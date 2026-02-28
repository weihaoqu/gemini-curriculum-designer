import type {
  CourseInfo,
  CurriculumModule,
  Prerequisite,
  CoreConcept,
  ModuleLessonPlan,
} from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

// --- Legacy prompt builders (kept for backward compatibility) ---

export function buildModuleProposalPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleIndex: number,
  totalModules: number,
  previousModules: CurriculumModule[]
): string {
  const previousContext = previousModules
    .filter((m) => m.status === "complete" && m.content)
    .map((m, i) => `Module ${i + 1}: ${m.name}`)
    .join("\n");

  return `I'm designing a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach.

${previousContext ? `**Previously completed modules:**\n${previousContext}\n` : ""}

Please create a **Module Proposal** for Module ${moduleIndex + 1} of ${totalModules}: "${moduleName}"

Generate the proposal in this format:

## Module ${moduleIndex + 1}: ${moduleName}

**Prerequisites** (based on audience level: ${courseInfo.audience}):
- List 3-5 prerequisite concepts with status indicators:
  - ✅ [Concept] - Include as lesson (needs teaching)
  - 🔄 [Concept] - Quick recap (assumed partially known)
  - ⏭️ [Concept] - Skip (already known by target audience)

**Core Concepts** (recommended coverage):
- List 4-6 core concepts with priority:
  - ⭐ [Concept] - EMPHASIZE (most important)
  - 📘 [Concept] - Cover normally
  - 💡 [Concept] - Optional deep-dive

**Suggested Topics:**
1. Topic Title - brief description
2. Topic Title - brief description
(list 3-6 key topics for this module)

**Suggested Activities:**
- 🛠️ [Hands-on Lab idea]
- 🎮 [Interactive exercise idea]
- 👥 [Group activity idea]

**Modern Additions:**
- Suggest 2-3 current tools, techniques, or case studies to incorporate`;
}

export function buildModuleGenerationPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleIndex: number,
  proposal: string,
  previousModules: CurriculumModule[]
): string {
  const previousSummary = previousModules
    .filter((m) => m.status === "complete" && m.content)
    .map((m, i) => `Module ${i + 1}: ${m.name}`)
    .join("\n");

  return `I'm designing a course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach in a ${courseInfo.format} format.

${previousSummary ? `**Previously completed modules:**\n${previousSummary}\n` : ""}

**Approved Module Proposal:**
${proposal}

---

Now generate the **full module content** for Module ${moduleIndex + 1}: "${moduleName}".

Use this structure:

# Module ${moduleIndex + 1}: ${moduleName}

## Learning Objectives
By the end of this module, students will be able to:
- (Use Bloom's taxonomy verbs: analyze, evaluate, create, apply, design, etc.)
- List 4-6 specific, measurable learning objectives

## Topic 1: [Title]

### Overview
(2-3 paragraph introduction establishing context and relevance)

### Key Concepts
1. **[Concept Name]**
   - Definition: ...
   - Why it matters: ...
   - Example: ...

(Repeat for each key concept in the topic)

### Hands-On Exercise
**Exercise 1.1: [Title]**
- Objective: ...
- Steps: (numbered, detailed steps)
- Expected outcome: ...

### Discussion Questions
1. [Thought-provoking question for class discussion]

(Repeat the Topic structure for all topics in the module)

## Module Summary
- Key takeaways
- Preparation for next module

Apply the appropriate pedagogical pattern (Problem-First, Theory-to-Practice, Scaffolding, or Recap-and-Refresh) based on the content.`;
}

// --- New interview-based prompt builders ---

function buildPreviousContext(previousModules: CurriculumModule[]): string {
  const completed = previousModules
    .filter((m) => m.status === "complete" && m.content)
    .map((m, i) => `Module ${i + 1}: ${m.name}`)
    .join("\n");
  return completed
    ? `**Previously completed modules:**\n${completed}\n`
    : "";
}

export function buildPrerequisitesPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleDescription: string | undefined,
  moduleIndex: number,
  totalModules: number,
  previousModules: CurriculumModule[]
): string {
  return `I'm designing a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach.

${buildPreviousContext(previousModules)}

For Module ${moduleIndex + 1} of ${totalModules}: "${moduleName}"${moduleDescription ? ` — ${moduleDescription}` : ""}

Propose 3-5 prerequisites that students need before starting this module. For each prerequisite, suggest whether to Include (teach it as part of this module), Quick Recap (briefly review it), or Skip (assume the audience already knows it), based on the target audience level (${courseInfo.audience}).

**Respond with ONLY valid JSON, no other text:**

{
  "prerequisites": [
    {
      "name": "Prerequisite name",
      "description": "Brief explanation of why this is needed",
      "status": "include|recap|skip"
    }
  ]
}`;
}

export function buildConceptsPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleDescription: string | undefined,
  moduleIndex: number,
  prerequisites: Prerequisite[]
): string {
  const prereqSummary = prerequisites
    .filter((p) => p.status !== "skip")
    .map(
      (p) =>
        `- ${p.name} (${p.status === "include" ? "will be taught" : "quick recap"})`
    )
    .join("\n");

  return `I'm designing a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach.

For Module ${moduleIndex + 1}: "${moduleName}"${moduleDescription ? ` — ${moduleDescription}` : ""}

**Confirmed prerequisites:**
${prereqSummary || "(none — audience already knows all prerequisites)"}

Based on these prerequisites, propose 4-6 core concepts to cover in this module. Assign each a priority: Emphasize (most important, spend more time), Normal (standard coverage), or Optional (deep-dive for advanced students).

**Respond with ONLY valid JSON, no other text:**

{
  "concepts": [
    {
      "name": "Concept name",
      "description": "What this concept covers and why it matters",
      "priority": "emphasize|normal|optional"
    }
  ]
}`;
}

export function buildLessonsPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleDescription: string | undefined,
  moduleIndex: number,
  prerequisites: Prerequisite[],
  concepts: CoreConcept[]
): string {
  const prereqSummary = prerequisites
    .filter((p) => p.status !== "skip")
    .map(
      (p) =>
        `- ${p.name} (${p.status === "include" ? "teach" : "recap"})`
    )
    .join("\n");

  const conceptSummary = concepts
    .map((c) => `- ${c.name} [${c.priority}]: ${c.description}`)
    .join("\n");

  return `I'm designing a course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach in a ${courseInfo.format} format.

For Module ${moduleIndex + 1}: "${moduleName}"${moduleDescription ? ` — ${moduleDescription}` : ""}

**Prerequisites:**
${prereqSummary || "(none)"}

**Core concepts to cover:**
${conceptSummary}

Based on the prerequisites and core concepts, propose:
1. **Topics** — 3-6 key topics that logically sequence the concepts for this module. Each module is typically taught in 1-2 class sessions, so these are the major topics covered within those sessions. Each topic should have a teaching approach (e.g., "Problem-First", "Theory-to-Practice", "Scaffolding", "Hands-On Demo").
2. **Activities** — 3-4 activities (hands-on labs, interactive exercises, group work, individual practice).

**Respond with ONLY valid JSON, no other text:**

{
  "lessons": [
    {
      "title": "Topic title",
      "description": "Brief description of what this topic covers",
      "teachingApproach": "Problem-First|Theory-to-Practice|Scaffolding|Hands-On Demo"
    }
  ],
  "activities": [
    {
      "title": "Activity title",
      "description": "Brief description of the activity",
      "type": "hands-on|interactive|group|individual"
    }
  ]
}`;
}

export function buildModuleGenerationPromptFromInterview(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleIndex: number,
  prerequisites: Prerequisite[],
  concepts: CoreConcept[],
  lessonPlan: ModuleLessonPlan,
  previousModules: CurriculumModule[]
): string {
  const previousSummary = previousModules
    .filter((m) => m.status === "complete" && m.content)
    .map((m, i) => `Module ${i + 1}: ${m.name}`)
    .join("\n");

  const prereqSection = prerequisites
    .map((p) => {
      const icon =
        p.status === "include" ? "✅" : p.status === "recap" ? "🔄" : "⏭️";
      return `${icon} ${p.name} — ${p.description}`;
    })
    .join("\n");

  const conceptSection = concepts
    .map((c) => {
      const icon =
        c.priority === "emphasize"
          ? "⭐"
          : c.priority === "normal"
            ? "📘"
            : "💡";
      return `${icon} ${c.name} [${c.priority}] — ${c.description}`;
    })
    .join("\n");

  const lessonSection = lessonPlan.lessons
    .filter((l) => l.enabled)
    .map(
      (l, i) =>
        `${i + 1}. ${l.title} (${l.teachingApproach}) — ${l.description}`
    )
    .join("\n");

  const activitySection = lessonPlan.activities
    .filter((a) => a.enabled)
    .map((a) => `- [${a.type}] ${a.title} — ${a.description}`)
    .join("\n");

  return `I'm designing a course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach in a ${courseInfo.format} format.

${previousSummary ? `**Previously completed modules:**\n${previousSummary}\n` : ""}

**Approved Interview for Module ${moduleIndex + 1}: "${moduleName}"**

**Prerequisites:**
${prereqSection}

**Core Concepts:**
${conceptSection}

**Topics:**
${lessonSection}

**Activities:**
${activitySection}

---

Now generate the **full module content** for Module ${moduleIndex + 1}: "${moduleName}".

Each module is typically taught in 1-2 class sessions. The topics listed above are the major sections within those sessions.

Use this structure:

# Module ${moduleIndex + 1}: ${moduleName}

## Learning Objectives
By the end of this module, students will be able to:
- (Use Bloom's taxonomy verbs: analyze, evaluate, create, apply, design, etc.)
- List 4-6 specific, measurable learning objectives

For each topic in the approved plan above, generate:

## Topic N: [Title]

### Overview
(2-3 paragraph introduction establishing context and relevance)

### Key Concepts
1. **[Concept Name]**
   - Definition: ...
   - Why it matters: ...
   - Example: ...

(Cover the core concepts assigned to this topic)

### Hands-On Exercise
**Exercise N.1: [Title]**
- Objective: ...
- Steps: (numbered, detailed steps)
- Expected outcome: ...

### Discussion Questions
1. [Thought-provoking question for class discussion]

After all topics, include:

## Module Summary
- Key takeaways
- Preparation for next module

Apply the teaching approach specified for each topic (Problem-First, Theory-to-Practice, Scaffolding, or Hands-On Demo). For prerequisites marked as "include", weave them into the early topics. For "recap" items, add a brief review section at the start.`;
}

// --- Deep dive prompt ---

export function buildDeepDivePrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  conceptName: string,
  conceptDescription: string
): string {
  return `I'm designing a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach.

In the module "${moduleName}", there's a concept: **${conceptName}**${conceptDescription ? ` — ${conceptDescription}` : ""}.

The user wants to explore this concept deeper. Provide a mini deep-dive that includes:

1. **What it is** — A clear, accessible explanation (2-3 paragraphs)
2. **Why it matters** — Real-world relevance and practical applications
3. **Key sub-topics** — 3-5 sub-topics the instructor might want to cover
4. **Common misconceptions** — 2-3 things students often get wrong
5. **Teaching tip** — One concrete suggestion for how to teach this effectively

**Respond with ONLY valid JSON, no other text:**

{
  "explanation": "Clear explanation paragraphs...",
  "whyItMatters": "Real-world relevance...",
  "subTopics": [
    { "name": "Sub-topic name", "description": "Brief description" }
  ],
  "misconceptions": [
    { "misconception": "What students think", "correction": "What's actually true" }
  ],
  "teachingTip": "A concrete teaching suggestion..."
}`;
}
