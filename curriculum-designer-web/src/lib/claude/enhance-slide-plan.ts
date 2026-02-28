import type {
  EnhanceTopicItem,
  EnhanceTopicDeepDive,
  EnhanceCourseContext,
  DifficultyLevel,
} from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

/**
 * Derive the dominant difficulty level from assigned calibration questions (majority vote).
 * Falls back to "intermediate".
 */
function getEffectiveLevel(dd: EnhanceTopicDeepDive | undefined): DifficultyLevel {
  if (!dd?.calibration) return "intermediate";

  const cal = dd.calibration;
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

export function buildEnhanceSlidePlanPrompt(
  courseName: string,
  topics: EnhanceTopicItem[],
  deepDives: EnhanceTopicDeepDive[],
  courseContext?: EnhanceCourseContext | null
): string {
  const topicDescriptions = topics
    .map((topic, i) => {
      const dd = deepDives.find((d) => d.topicId === topic.id);
      const diffLevel = getEffectiveLevel(dd);

      // Group selected suggestions by category
      const selectedSuggestions = dd?.suggestions.filter((s) => s.selected) ?? [];
      const grouped: Record<string, string[]> = {};
      for (const s of selectedSuggestions) {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(`${s.title}: ${s.description}`);
      }

      const suggestionsBlock = Object.entries(grouped)
        .map(([cat, items]) => `  **${cat}:**\n${items.map((item) => `    - ${item}`).join("\n")}`)
        .join("\n");

      const notesBlock = dd?.instructorNotes
        ? `**Instructor notes:** ${dd.instructorNotes}`
        : "";

      return `### Topic ${i + 1}: ${topic.name}
**Week/Module:** ${topic.weekOrModule}
**Description:** ${topic.description}
**Difficulty level:** ${diffLevel}
${suggestionsBlock ? `**Selected enhancements:**\n${suggestionsBlock}` : ""}
${notesBlock}`.trim();
    })
    .join("\n\n");

  const contextBlock = courseContext
    ? `\n**Course Context:**
- Discipline: ${getAreaLabel(courseContext.area)}
- Target Audience: ${courseContext.audience}
- Teaching Philosophy: ${courseContext.philosophy}\n`
    : "";

  return `I'm creating an enhanced slide plan for the course "${courseName}".
${contextBlock}
The following topics have been selected for enhancement, each with AI-suggested improvements that the instructor has approved:

${topicDescriptions}

For EACH topic, generate a structured slide outline that incorporates the selected enhancements. Each slide should have:
- A clear title
- 2-4 bullet points summarizing content
- A slideType from this list: title, objectives, concept, code-example, exercise, quiz, animation, interactive, discussion, summary, divider
- teachingNotes: 1-2 sentences of instructor guidance for this slide (e.g., "Spend 3 min here, emphasize the tradeoff between X and Y", "Good place for a live demo", "Students often confuse A with B — clarify early")

Guidelines:
- Start each topic with a "title" slide and an "objectives" slide
- Create "concept" slides for each major idea (may need multiple slides per concept)
- Add "code-example" slides where the topic involves programming or technical content
- Include "exercise" slides for hands-on practice
- Add 1-2 "quiz" slides per topic calibrated to the topic's difficulty level
- Suggest "animation" slides where visual step-by-step explanation helps (e.g., algorithms, data flows)
- Suggest "interactive" slides where live demos, polls, or audience participation fits
- Add "discussion" slides for topics that benefit from class dialogue
- End each topic with a "summary" slide
- Incorporate each selected enhancement naturally into the slide sequence

**Respond with ONLY valid JSON, no other text:**

{
  "modules": [
    {
      "moduleIndex": 0,
      "moduleName": "Topic Name",
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
