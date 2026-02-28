import type {
  CourseInfo,
  CurriculumModule,
  AssessmentType,
  AssessmentConfig,
  ModuleDifficultyCalibration,
  QuestionFormat,
  DifficultyLevel,
} from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  quizzes: "Quizzes (knowledge checks with answer keys)",
  labs: "Coding/Practical Labs (hands-on skill assessments)",
  projects: "Projects (applied learning with milestones)",
  written: "Written Assignments (analysis/reflection essays)",
  "peer-reviews": "Peer Reviews (collaborative assessment forms)",
  portfolio: "Portfolio Assessment (cumulative demonstration)",
};

const FORMAT_NAMES: Record<QuestionFormat, string> = {
  "multiple-choice": "Multiple Choice",
  "short-answer": "Short Answer",
  "true-false": "True/False",
  "fill-blank": "Fill in the Blank",
  poll: "Poll/Survey",
  "code-analysis": "Code Analysis",
  essay: "Essay",
  matching: "Matching",
};

/**
 * Derive the dominant difficulty level from assigned questions (majority vote).
 * Returns null if no questions are assigned.
 */
function getDominantLevel(cal: ModuleDifficultyCalibration): DifficultyLevel | null {
  const counts: Record<DifficultyLevel, number> = { basic: 0, intermediate: 0, advanced: 0 };
  for (const level of Object.values(cal.assignedLevels)) {
    if (level) counts[level]++;
  }
  const total = counts.basic + counts.intermediate + counts.advanced;
  if (total === 0) return null;
  if (counts.advanced >= counts.intermediate && counts.advanced >= counts.basic) return "advanced";
  if (counts.intermediate >= counts.basic) return "intermediate";
  return "basic";
}

/**
 * Build an exemplar block from instructor-sorted calibration questions.
 * Groups questions by their assigned level and formats them for the prompt.
 */
function buildCalibrationExemplarBlock(
  moduleIndex: number,
  moduleName: string,
  cal: ModuleDifficultyCalibration
): string | null {
  const byLevel: Record<DifficultyLevel, string[]> = {
    basic: [],
    intermediate: [],
    advanced: [],
  };

  for (const q of cal.questions) {
    const level = cal.assignedLevels[q.id];
    if (!level) continue;
    const prefix = q.questionType === "multiple-choice" ? "[MC]" : "[SA]";
    byLevel[level].push(`      - ${prefix} ${q.question}`);
  }

  const totalAssigned = byLevel.basic.length + byLevel.intermediate.length + byLevel.advanced.length;
  if (totalAssigned === 0) return null;

  const lines: string[] = [];
  lines.push(`  Module ${moduleIndex + 1} (${moduleName}) — Instructor Calibration:`);
  for (const level of ["basic", "intermediate", "advanced"] as DifficultyLevel[]) {
    if (byLevel[level].length > 0) {
      lines.push(`    ${level.toUpperCase()} (${byLevel[level].length} example${byLevel[level].length > 1 ? "s" : ""}):`);
      lines.push(...byLevel[level]);
    }
  }
  return lines.join("\n");
}

/**
 * Build the full exemplar section for all calibrated modules.
 * Returns empty string if no calibration data with assignments exists.
 */
function buildExemplarSection(
  difficultyCalibrations: ModuleDifficultyCalibration[]
): string {
  const blocks = difficultyCalibrations
    .map((cal) => buildCalibrationExemplarBlock(cal.moduleIndex, cal.moduleName, cal))
    .filter((b): b is string => b !== null);

  if (blocks.length === 0) return "";

  return `\n**Instructor Difficulty Calibration (Exemplar Questions):**
Use these instructor-sorted examples to understand the expected cognitive demand at each level. Match this standard when generating assessment questions.

${blocks.join("\n\n")}
`;
}

function buildConfigSection(config: AssessmentConfig, calibrationMap: Map<number, string>): string {
  const lines: string[] = [];
  lines.push(`### ${ASSESSMENT_LABELS[config.type]}`);
  lines.push("");

  // Difficulty
  if (config.difficulty === "auto" && calibrationMap.size > 0) {
    lines.push("**Difficulty:** Use per-module calibration levels (shown in module list above). For uncalibrated modules, default to intermediate.");
  } else if (config.difficulty === "auto") {
    lines.push("**Difficulty:** Intermediate (default — no calibration data available).");
  } else {
    const desc: Record<string, string> = {
      basic: "Basic — recall, comprehension, straightforward application (Bloom's 1-2)",
      intermediate: "Intermediate — application and analysis (Bloom's 3-4)",
      advanced: "Advanced — synthesis, evaluation, and creation (Bloom's 5-6)",
    };
    lines.push(`**Difficulty:** ${desc[config.difficulty]}`);
  }

  // Question formats
  if (config.questionFormats.length > 0) {
    const fmts = config.questionFormats.map((f) => FORMAT_NAMES[f]).join(", ");
    lines.push(`**Question Formats:** ${fmts}`);
  }

  // Count and scope
  lines.push(`**Question Count:** ${config.questionCount} questions${config.perModule ? " per module" : " total (course-wide)"}`);

  // Category-specific details
  switch (config.type) {
    case "quizzes":
      if (config.timeLimitMinutes) lines.push(`**Time Limit:** ${config.timeLimitMinutes} minutes per quiz`);
      if (config.numberOfAssessments) lines.push(`**Number of Quizzes:** ${config.numberOfAssessments}`);
      break;
    case "labs":
      if (config.numberOfAssessments) lines.push(`**Number of Labs:** ${config.numberOfAssessments}`);
      if (config.groupWork) lines.push("**Group Work:** Yes — design for collaborative teams");
      break;
    case "projects":
      if (config.milestones) lines.push(`**Milestones:** ${config.milestones} milestones with check-in deliverables`);
      if (config.groupWork) lines.push("**Team Project:** Yes — include team roles and collaboration guidelines");
      break;
    case "written":
      if (config.numberOfAssessments) lines.push(`**Number of Assignments:** ${config.numberOfAssessments}`);
      if (config.wordCountRange) lines.push(`**Word Count Range:** ${config.wordCountRange} words`);
      break;
    case "peer-reviews":
      lines.push(`**Anonymous:** ${config.anonymous !== false ? "Yes" : "No"}`);
      break;
    case "portfolio":
      if (config.artifactCount) lines.push(`**Required Artifacts:** ${config.artifactCount}`);
      break;
  }

  lines.push("");
  lines.push(getCategoryInstructions(config));
  lines.push("");

  return lines.join("\n");
}

function getCategoryInstructions(config: AssessmentConfig): string {
  switch (config.type) {
    case "quizzes":
      return `Generate quizzes with the specified question formats. For each quiz include:
- Duration, total points, and instructions
- Questions in the requested formats with answer explanations
- Answer key with rubrics for non-objective questions
- Code analysis questions where relevant to the subject matter`;

    case "labs":
      return `Create lab assessments that cover multiple modules:
- Clear objectives and prerequisites
- Detailed requirements with point values
- Grading rubric table (Excellent/Good/Satisfactory/Needs Work)
- Starter code descriptions where applicable
${config.groupWork ? "- Team roles and collaboration guidelines" : ""}`;

    case "projects":
      return `Design substantial project(s):
- Project overview and learning outcomes assessed
- ${config.milestones ?? 3} milestones with deliverables and check-in questions
- Final submission requirements (code, documentation, reflection, demo)
- Detailed grading rubric for Technical Implementation, Code Quality, Innovation, and Communication
${config.groupWork ? "- Team composition guidelines, role definitions, and peer evaluation component" : ""}`;

    case "written":
      return `Create written assignments:
- Analysis or reflection prompts tied to course content
- Word count expectations${config.wordCountRange ? ` (${config.wordCountRange} words)` : ""}
- Grading criteria with specific rubric categories
- Include prompts that require critical thinking and synthesis`;

    case "peer-reviews":
      return `Create a peer review template with:
- Review checklist (Functionality, Code Quality, Design)
- Sections for Strengths, Areas for Improvement, and Questions
- Rating scale
- Reviewer reflection prompt
${config.anonymous !== false ? "- Design for anonymous submission" : "- Include reviewer attribution"}`;

    case "portfolio":
      return `Define portfolio requirements:
- ${config.artifactCount ?? 5} required artifacts across the course
- Reflection requirements for each artifact
- Presentation/demo expectations
- Holistic grading rubric covering technical depth, growth, and presentation`;

    default:
      return "";
  }
}

/**
 * Build the assessment prompt from AssessmentConfig[] (new format).
 */
export function buildAssessmentPromptFromConfigs(
  courseInfo: CourseInfo,
  modules: CurriculumModule[],
  configs: AssessmentConfig[],
  difficultyCalibrations?: ModuleDifficultyCalibration[]
): string {
  const cals = difficultyCalibrations ?? [];

  // Build calibrationMap from assignedLevels (dominant level) with fallback to selectedLevel
  const calibrationEntries: [number, DifficultyLevel][] = [];
  for (const c of cals) {
    const level = getDominantLevel(c) ?? c.selectedLevel;
    if (level) calibrationEntries.push([c.moduleIndex, level]);
  }
  const calibrationMap = new Map(calibrationEntries);

  const moduleList = modules
    .map((m, i) => {
      const level = calibrationMap.get(i);
      return `${i + 1}. ${m.name}${level ? ` — calibrated difficulty: ${level}` : ""}`;
    })
    .join("\n");

  const exemplarSection = buildExemplarSection(cals);

  const configSections = configs
    .map((c) => buildConfigSection(c, calibrationMap))
    .join("\n---\n\n");

  return `I'm designing assessments for a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students in a ${courseInfo.format} format.

**Course Modules:**
${moduleList}
${exemplarSection}
**Assessment Plan (${configs.length} categories configured):**

${configSections}

## Assessment Calendar

Create a timeline table integrating all assessments:

| Week | Module | Assessment | Type | Weight |
|------|--------|------------|------|--------|

Include a grade breakdown summary at the end.`;
}

/**
 * Legacy prompt builder — used when only assessmentTypes[] is provided (backward compat).
 */
export function buildAssessmentPrompt(
  courseInfo: CourseInfo,
  modules: CurriculumModule[],
  assessmentTypes: AssessmentType[],
  difficultyCalibrations?: ModuleDifficultyCalibration[]
): string {
  const cals = difficultyCalibrations ?? [];

  const legacyEntries: [number, DifficultyLevel][] = [];
  for (const c of cals) {
    const level = getDominantLevel(c) ?? c.selectedLevel;
    if (level) legacyEntries.push([c.moduleIndex, level]);
  }
  const calibrationMap = new Map(legacyEntries);

  const moduleList = modules
    .map((m, i) => {
      const level = calibrationMap.get(i);
      return `${i + 1}. ${m.name}${level ? ` — target difficulty: ${level}` : ""}`;
    })
    .join("\n");

  const selectedTypes = assessmentTypes
    .map((t) => `- ${ASSESSMENT_LABELS[t]}`)
    .join("\n");

  const exemplarSection = buildExemplarSection(cals);

  const difficultyNote = calibrationMap.size > 0
    ? `\n**Difficulty Calibration:**\nThe instructor has calibrated the target difficulty for specific modules (shown above). For modules with a target difficulty:\n- **Basic**: Focus on recall, comprehension, and straightforward application (Bloom's levels 1-2)\n- **Intermediate**: Focus on application and analysis (Bloom's levels 3-4)\n- **Advanced**: Focus on synthesis, evaluation, and creation (Bloom's levels 5-6)\nAdjust the complexity, depth, and cognitive demand of questions accordingly.\n`
    : "";

  return `I'm designing assessments for a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students in a ${courseInfo.format} format.

**Course Modules:**
${moduleList}
${exemplarSection}${difficultyNote}
**Selected Assessment Types:**
${selectedTypes}

Generate comprehensive assessments for this course. Include ALL of the following for each selected type:

${assessmentTypes.includes("quizzes") ? `
### Quizzes
For each module, create a quiz with:
- Duration and total points
- 3-5 multiple choice questions with answer explanations
- 2-3 short answer questions with expected answers and rubrics
- Include code analysis questions where relevant
` : ""}

${assessmentTypes.includes("labs") ? `
### Practical Labs
Create 2-3 lab assessments that cover multiple modules:
- Clear objectives and prerequisites
- Detailed requirements with point values
- Grading rubric table (Excellent/Good/Satisfactory/Needs Work)
- Starter code descriptions where applicable
` : ""}

${assessmentTypes.includes("projects") ? `
### Projects
Design 1-2 substantial projects:
- Project overview and learning outcomes assessed
- 2-3 milestones with deliverables and check-in questions
- Final submission requirements (code, documentation, reflection, demo)
- Detailed grading rubric for Technical Implementation, Code Quality, Innovation, and Communication
` : ""}

${assessmentTypes.includes("written") ? `
### Written Assignments
Create 2-3 written assignments:
- Analysis or reflection prompts tied to course content
- Word count expectations
- Grading criteria
` : ""}

${assessmentTypes.includes("peer-reviews") ? `
### Peer Review Forms
Create a peer review template with:
- Review checklist (Functionality, Code Quality, Design)
- Sections for Strengths, Areas for Improvement, and Questions
- Rating scale
- Reviewer reflection prompt
` : ""}

${assessmentTypes.includes("portfolio") ? `
### Portfolio Assessment
Define portfolio requirements:
- Required artifacts from each module
- Reflection requirements
- Presentation/demo expectations
- Holistic grading rubric
` : ""}

## Assessment Calendar

Create a timeline table integrating all assessments:

| Week | Module | Assessment | Type | Weight |
|------|--------|------------|------|--------|

Include a grade breakdown summary at the end.`;
}
