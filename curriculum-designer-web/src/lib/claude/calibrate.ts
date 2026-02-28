import type { CourseInfo, LessonPlanItem } from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

export function buildCalibrationPrompt(
  courseInfo: CourseInfo,
  moduleName: string,
  moduleIndex: number,
  topics: LessonPlanItem[]
): string {
  const topicList = topics
    .filter((t) => t.enabled)
    .map((t, i) => `${i + 1}. ${t.title} — ${t.description}`)
    .join("\n");

  return `I'm designing a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students using a ${courseInfo.philosophy} approach in a ${courseInfo.format} format.

For Module ${moduleIndex + 1}: "${moduleName}", I need candidate questions so the instructor can sort them by difficulty.

**Module Topics:**
${topicList || "(no topics specified)"}

Generate 10 candidate questions covering this module's content — 5 short-answer and 5 multiple-choice. The questions should span a natural range from straightforward to complex, but do NOT label them with difficulty levels. The instructor will sort them into basic/intermediate/advanced categories themselves.

Guidelines:
- Make each question specific to the module content (not generic)
- Cover different topics within the module across the 10 questions
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
