import type {
  CourseInfo,
  CurriculumModule,
  ModuleDifficultyCalibration,
  DifficultyLevel,
} from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

/**
 * Derive the dominant difficulty level from assigned questions (majority vote).
 * Falls back to selectedLevel, then to "intermediate".
 */
function getEffectiveLevel(cal: ModuleDifficultyCalibration | undefined): DifficultyLevel {
  if (!cal) return "intermediate";

  // Try assignedLevels majority vote first
  if (cal.assignedLevels) {
    const counts: Record<DifficultyLevel, number> = { basic: 0, intermediate: 0, advanced: 0 };
    for (const level of Object.values(cal.assignedLevels)) {
      if (level) counts[level]++;
    }
    const total = counts.basic + counts.intermediate + counts.advanced;
    if (total > 0) {
      if (counts.advanced >= counts.intermediate && counts.advanced >= counts.basic) return "advanced";
      if (counts.intermediate >= counts.basic) return "intermediate";
      return "basic";
    }
  }

  return cal.selectedLevel ?? "intermediate";
}

export function buildSlidePlanPrompt(
  courseInfo: CourseInfo,
  modules: CurriculumModule[],
  difficultyCalibrations: ModuleDifficultyCalibration[]
): string {
  const moduleDescriptions = modules
    .map((m, i) => {
      const cal = difficultyCalibrations.find((c) => c.moduleIndex === i);
      const diffLevel = getEffectiveLevel(cal);

      const topics =
        m.lessonPlan?.lessons
          .filter((l) => l.enabled)
          .map((l) => `    - ${l.title}: ${l.description}`)
          .join("\n") || "    (no topics specified)";

      return `### Module ${i + 1}: ${m.name}
**Difficulty level:** ${diffLevel}
**Topics:**
${topics}`;
    })
    .join("\n\n");

  return `I'm creating a slide plan for a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students in a ${courseInfo.format} format using a ${courseInfo.philosophy} approach.

${moduleDescriptions}

For EACH module, generate a structured slide outline. Each slide should have:
- A clear title
- 2-4 bullet points summarizing content
- A slideType from this list: title, objectives, concept, code-example, exercise, quiz, animation, interactive, discussion, summary, divider
- teachingNotes: 1-2 sentences of instructor guidance for this slide (e.g., "Spend 3 min here, emphasize the tradeoff between X and Y", "Good place for a live demo", "Students often confuse A with B — clarify early")

Guidelines:
- Start each module with a "title" slide and an "objectives" slide
- Create "concept" slides for each major topic (may need multiple slides per topic)
- Add "code-example" slides where the topic involves programming or technical content
- Include "exercise" slides for hands-on practice
- Add 1-2 "quiz" slides per module calibrated to the module's difficulty level
- Suggest "animation" slides where visual step-by-step explanation helps (e.g., algorithms, data flows)
- Suggest "interactive" slides where live demos, polls, or audience participation fits
- Add "discussion" slides for topics that benefit from class dialogue
- End each module with a "summary" slide

**Respond with ONLY valid JSON, no other text:**

{
  "modules": [
    {
      "moduleIndex": 0,
      "moduleName": "Module Name",
      "slides": [
        {
          "title": "Slide title",
          "bulletPoints": ["Point 1", "Point 2"],
          "slideType": "concept",
          "teachingNotes": "Instructor guidance for delivering this slide"
        }
      ]
    }
  ]
}`;
}
