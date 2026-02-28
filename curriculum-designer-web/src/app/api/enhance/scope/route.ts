import { getAnthropicClient } from "@/lib/claude/client";
import { ENHANCE_SYSTEM_PROMPT, MODEL, MAX_TOKENS } from "@/lib/claude/prompts";
import { buildScopeAnalysisPrompt } from "@/lib/claude/enhance-scope";
import type { UploadedFile, EnhanceCourseContext } from "@/lib/types/curriculum";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { files, materialType, courseContext } = body as {
      files: UploadedFile[];
      materialType: "syllabus" | "slides";
      courseContext?: EnhanceCourseContext | null;
    };

    if (!files || files.length === 0) {
      return new Response("No files provided", { status: 400 });
    }

    const client = getAnthropicClient();
    const userPrompt = buildScopeAnalysisPrompt(files, materialType ?? "syllabus", courseContext);

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: ENHANCE_SYSTEM_PROMPT,
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
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
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
    console.error("Scope analysis API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
