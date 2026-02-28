import { getAnthropicClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, MODEL, MAX_TOKENS } from "@/lib/claude/prompts";
import { buildAssessmentPrompt, buildAssessmentPromptFromConfigs } from "@/lib/claude/assessment";
import type { CourseInfo, CurriculumModule, AssessmentType, AssessmentConfig, ModuleDifficultyCalibration } from "@/lib/types/curriculum";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      courseInfo,
      modules,
      assessmentTypes,
      assessmentConfigs,
      difficultyCalibrations,
    } = body as {
      courseInfo: CourseInfo;
      modules: CurriculumModule[];
      assessmentTypes?: AssessmentType[];
      assessmentConfigs?: AssessmentConfig[];
      difficultyCalibrations?: ModuleDifficultyCalibration[];
    };

    if (!courseInfo || !modules) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Use new config-based prompt if available, otherwise fall back to legacy
    let userPrompt: string;
    if (assessmentConfigs && assessmentConfigs.length > 0) {
      userPrompt = buildAssessmentPromptFromConfigs(courseInfo, modules, assessmentConfigs, difficultyCalibrations);
    } else if (assessmentTypes && assessmentTypes.length > 0) {
      userPrompt = buildAssessmentPrompt(courseInfo, modules, assessmentTypes, difficultyCalibrations);
    } else {
      return new Response("No assessment types or configs provided", { status: 400 });
    }

    const client = getAnthropicClient();

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assessment API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
