import { getAnthropicClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, MODEL } from "@/lib/claude/prompts";
import { buildCalibrationPrompt } from "@/lib/claude/calibrate";
import type { CourseInfo, LessonPlanItem } from "@/lib/types/curriculum";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseInfo, moduleName, moduleIndex, topics } = body as {
      courseInfo: CourseInfo;
      moduleName: string;
      moduleIndex: number;
      topics: LessonPlanItem[];
    };

    if (!courseInfo || !moduleName) {
      return new Response("Missing required fields", { status: 400 });
    }

    const client = getAnthropicClient();
    const userPrompt = buildCalibrationPrompt(
      courseInfo,
      moduleName,
      moduleIndex,
      topics ?? []
    );

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Failed to parse calibration response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch (error) {
    console.error("Calibration API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
