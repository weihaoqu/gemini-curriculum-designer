import type { UploadedFile, EnhanceCourseContext } from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

/**
 * Build a prompt to analyze a syllabus/slides and extract scope + topics.
 * Dual output: streamed markdown + json-scope tagged block.
 */
export function buildScopeAnalysisPrompt(
  files: UploadedFile[],
  materialType: "syllabus" | "slides",
  courseContext?: EnhanceCourseContext | null
): string {
  const fileList = files
    .map(
      (f, i) =>
        `--- FILE ${i + 1}: ${f.name} ---\n${f.content}\n--- END FILE ${i + 1} ---`
    )
    .join("\n\n");

  const materialLabel =
    materialType === "syllabus" ? "syllabus/course document" : "lecture slides";

  const contextBlock = courseContext
    ? `\n## Course Context (provided by instructor)
- **Discipline:** ${getAreaLabel(courseContext.area)}
- **Target Audience:** ${courseContext.audience}
- **Teaching Philosophy:** ${courseContext.philosophy}

Use this context to tailor your analysis and suggestions to the specific discipline, audience level, and pedagogical approach.\n`
    : "";

  return `Please analyze the following ${materialLabel} and help me understand the curriculum scope.
${contextBlock}

${fileList}

Provide a comprehensive scope analysis with these sections:

## Course Overview
Identify the course name, target audience, format (semester/bootcamp/workshop), and overall scope.

## Topics Identified
List every distinct topic, module, or week found in the materials. For each, provide:
- Topic name
- Brief description of what it covers
- Which week/module/section it belongs to

## Scope Suggestions
Based on current trends and best practices, suggest improvements to the course scope:
- Topics that should be **added** (missing from current trends)
- Topics that could be **merged** (overlapping content)
- **Reordering** suggestions (better pedagogical flow)
- Topics that could be **removed** (outdated or low-value)
- General **scope updates** (depth adjustments, focus shifts)

Be specific and actionable. Explain *why* each suggestion matters.

---

**IMPORTANT — After all the readable content above, append this structured JSON block exactly as shown (it will be parsed by the app):**

\`\`\`json-scope
{
  "courseName": "Detected course name",
  "currentScope": "Brief 1-2 sentence description of current scope",
  "topics": [
    {
      "name": "Topic name",
      "description": "Brief description",
      "weekOrModule": "Week 1 or Module 1 or Section 1"
    }
  ],
  "scopeSuggestions": [
    {
      "type": "add-topic|merge-topics|reorder|remove-topic|update-scope",
      "title": "Short suggestion title",
      "description": "Detailed description of the suggestion and why it matters"
    }
  ]
}
\`\`\`

Make sure the JSON block contains the same information as the readable sections above, just structured as JSON. The JSON must be valid and parseable. Aim for all topics found in the materials and 3-8 scope suggestions.`;
}
