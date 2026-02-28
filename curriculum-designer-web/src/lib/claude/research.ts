import type { CourseInfo } from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

const AUDIENCE_LABELS: Record<CourseInfo["audience"], string> = {
  beginners: "Beginners (no prior knowledge)",
  intermediate: "Intermediate (some background)",
  advanced: "Advanced (experienced practitioners)",
  mixed: "Mixed levels",
};

const FORMAT_LABELS: Record<CourseInfo["format"], string> = {
  semester: "University Semester (15 weeks)",
  bootcamp: "Intensive Bootcamp (4-8 weeks)",
  workshop: "Workshop Series (multiple sessions)",
  "self-paced": "Self-Paced Online Course",
};

const PHILOSOPHY_LABELS: Record<CourseInfo["philosophy"], string> = {
  "project-based": "Project-Based (learn by building)",
  "theory-first": "Theory-First (concepts then application)",
  "problem-based": "Problem-Based (real-world challenges)",
  "hands-on": "Hands-On Labs (guided exercises)",
};

const SCOPE_LABELS: Record<CourseInfo["scope"], string> = {
  "full-course": "Full multi-module course",
  "single-topic": "Single topic / one week of focused materials",
};

function buildSection2(courseInfo: CourseInfo): string {
  if (courseInfo.scope === "single-topic") {
    return `## SECTION 2: Single-Topic Module

Based on the course specifications above, design **one focused module** for a single week of instruction targeting ${AUDIENCE_LABELS[courseInfo.audience].toLowerCase()}.

Provide:
1. Module title
2. One-line description
3. A detailed weekly breakdown with 3-4 lessons, each including:
   - Lesson title and learning objectives
   - Key topics covered
   - Suggested activities or exercises
   - Estimated time allocation

Format as a single module with a detailed lesson breakdown. The module should be self-contained and immediately teachable.`;
  }

  return `## SECTION 2: Suggested Module Breakdown

Based on the course specifications above, suggest a complete module breakdown. For a ${FORMAT_LABELS[courseInfo.format].toLowerCase()} format targeting ${AUDIENCE_LABELS[courseInfo.audience].toLowerCase()}, propose 5-8 modules:

For each module, provide:
1. Module number and title
2. One-line description
3. Estimated duration

Format as a numbered list. Each module should build logically on the previous ones, following scaffolding principles.`;
}

function buildJsonInstructions(courseInfo: CourseInfo): string {
  const moduleHint = courseInfo.scope === "single-topic"
    ? "a single module object with a detailed description including the lesson breakdown"
    : "5-8 module objects";

  return `---

**IMPORTANT — After all the readable content above, append these two structured JSON blocks exactly as shown (they will be parsed by the app):**

\`\`\`json-landscape
{
  "trends": [
    { "name": "Trend name", "description": "Brief explanation" }
  ],
  "tools": [
    { "name": "Tool name", "description": "Why it matters", "category": "Category" }
  ],
  "resources": [
    { "title": "Resource title", "type": "book|course|website|tutorial", "description": "Brief description" }
  ],
  "industryContext": "A paragraph or two about industry usage."
}
\`\`\`

\`\`\`json-modules
[
  { "name": "Module Title", "description": "One-line description", "estimatedDuration": "e.g. 2 weeks" }
]
\`\`\`

Make sure the JSON blocks contain the same information as the readable sections above, just structured as JSON. The JSON must be valid and parseable. The json-modules array should contain ${moduleHint}.`;
}

export function buildResearchPrompt(courseInfo: CourseInfo): string {
  const formatLine = courseInfo.scope === "full-course"
    ? `\n- **Format:** ${FORMAT_LABELS[courseInfo.format]}`
    : "";

  return `I'm designing a course with these specifications:

- **Scope:** ${SCOPE_LABELS[courseInfo.scope]}
- **Discipline:** ${getAreaLabel(courseInfo.area)}
- **Topic:** ${courseInfo.topic}
- **Target Audience:** ${AUDIENCE_LABELS[courseInfo.audience]}${formatLine}
- **Teaching Philosophy:** ${PHILOSOPHY_LABELS[courseInfo.philosophy]}

Please generate TWO sections:

## SECTION 1: Topic Landscape

Provide a comprehensive "Topic Landscape" for this subject:

### Current Trends
- List 4-6 current trends and developments in this field with brief explanations

### Essential Tools & Technologies
- List 4-6 essential tools, frameworks, or technologies with why they matter

### Recommended Resources
- List 4-6 high-quality books, courses, or online resources

### Industry Context
- Explain how this topic is used in practice (2-3 paragraphs)

${buildSection2(courseInfo)}

${buildJsonInstructions(courseInfo)}`;
}
