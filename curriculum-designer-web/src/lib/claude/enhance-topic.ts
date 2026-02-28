import type { UploadedFile, EnhanceCourseContext } from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

/**
 * Build a prompt for per-topic AI suggestions.
 * Dual output: streamed markdown + json-topic-suggestions tagged block.
 */
export function buildTopicSuggestionsPrompt(params: {
  topicName: string;
  topicDescription: string;
  weekOrModule: string;
  courseName: string;
  instructorNotes?: string;
  materials?: UploadedFile[];
  scopeContext: string;
  courseContext?: EnhanceCourseContext | null;
}): string {
  const { topicName, topicDescription, weekOrModule, courseName, instructorNotes, materials, scopeContext, courseContext } = params;

  const materialsSection =
    materials && materials.length > 0
      ? `\n\n## Current Materials for This Topic\n${materials
          .map(
            (f, i) =>
              `--- FILE ${i + 1}: ${f.name} ---\n${f.content}\n--- END FILE ${i + 1} ---`
          )
          .join("\n\n")}\n`
      : "\n\n(No existing materials provided — suggest from scratch based on the topic description.)\n";

  const instructorSection = instructorNotes?.trim()
    ? `\n\n## Instructor's Expectations & Goals\n${instructorNotes.trim()}\n\n**Important:** The instructor has specific goals for this topic. Prioritize suggestions that align with these expectations. Address their stated needs directly before suggesting other improvements.\n`
    : "";

  const courseContextBlock = courseContext
    ? `\n## Course Context
- **Discipline:** ${getAreaLabel(courseContext.area)}
- **Target Audience:** ${courseContext.audience}
- **Teaching Philosophy:** ${courseContext.philosophy}

Tailor suggestions to this discipline, audience level, and pedagogical approach.\n`
    : "";

  return `I'm enhancing the topic "${topicName}" (${weekOrModule}) in the course "${courseName}".

## Topic Description
${topicDescription}
${instructorSection}${courseContextBlock}
## Course Scope Context
${scopeContext}
${materialsSection}

Please suggest specific enhancements for this topic across these categories:

### New Content
Content that should be added — new concepts, explanations, examples, or sections.

### Exercises
Hands-on exercises, coding challenges, problem sets, or practice activities.

### Interactions
Interactive elements — live demos, polls, group activities, think-pair-share, discussions.

### Animations
Visual aids — step-through animations, diagrams that build up, visual explanations.

### Updates
Existing content that needs updating — outdated examples, deprecated tools, new best practices.

For each suggestion, provide a clear title and actionable description. Be specific — mention exact concepts, tools, and approaches.

---

**IMPORTANT — After all the readable content above, append this structured JSON block exactly as shown (it will be parsed by the app):**

\`\`\`json-topic-suggestions
[
  {
    "category": "new-content|exercise|interaction|animation|update",
    "title": "Short suggestion title",
    "description": "Detailed actionable description"
  }
]
\`\`\`

Aim for 8-15 suggestions across all categories. The JSON must be valid and parseable.`;
}

/**
 * Build a prompt for per-topic difficulty calibration.
 * JSON-only response (no streaming).
 */
export function buildTopicCalibrationPrompt(params: {
  topicName: string;
  topicDescription: string;
  courseName: string;
  materialsText?: string;
}): string {
  const { topicName, topicDescription, courseName, materialsText } = params;

  const materialsSection = materialsText
    ? `\n\n**Existing materials excerpt:**\n${materialsText.slice(0, 3000)}\n`
    : "";

  return `I'm calibrating difficulty for the topic "${topicName}" in the course "${courseName}".

**Topic Description:** ${topicDescription}${materialsSection}

Generate 10 candidate questions covering this topic — 5 short-answer and 5 multiple-choice. The questions should span a natural range from straightforward to complex, but do NOT label them with difficulty levels. The instructor will sort them into basic/intermediate/advanced categories themselves.

Guidelines:
- Make each question specific to this topic (not generic)
- Cover different aspects of the topic across the 10 questions
- For short-answer: include a sample answer showing expected depth
- For multiple-choice: provide exactly 4 choices (A-D) and indicate the correct choice
- Vary the cognitive demand naturally — some recall, some application, some synthesis

**Respond with ONLY valid JSON, no other text:**

{
  "questions": [
    {
      "questionType": "short-answer",
      "question": "The question text",
      "sampleAnswer": "A concise model answer showing expected depth"
    },
    {
      "questionType": "short-answer",
      "question": "The question text",
      "sampleAnswer": "A concise model answer showing expected depth"
    },
    {
      "questionType": "short-answer",
      "question": "The question text",
      "sampleAnswer": "A concise model answer showing expected depth"
    },
    {
      "questionType": "short-answer",
      "question": "The question text",
      "sampleAnswer": "A concise model answer showing expected depth"
    },
    {
      "questionType": "short-answer",
      "question": "The question text",
      "sampleAnswer": "A concise model answer showing expected depth"
    },
    {
      "questionType": "multiple-choice",
      "question": "The question text",
      "choices": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctChoice": "B",
      "sampleAnswer": "B. Second option — brief explanation of why this is correct"
    },
    {
      "questionType": "multiple-choice",
      "question": "The question text",
      "choices": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctChoice": "A",
      "sampleAnswer": "A. First option — brief explanation of why this is correct"
    },
    {
      "questionType": "multiple-choice",
      "question": "The question text",
      "choices": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctChoice": "C",
      "sampleAnswer": "C. Third option — brief explanation of why this is correct"
    },
    {
      "questionType": "multiple-choice",
      "question": "The question text",
      "choices": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctChoice": "D",
      "sampleAnswer": "D. Fourth option — brief explanation of why this is correct"
    },
    {
      "questionType": "multiple-choice",
      "question": "The question text",
      "choices": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctChoice": "B",
      "sampleAnswer": "B. Second option — brief explanation of why this is correct"
    }
  ]
}`;
}
