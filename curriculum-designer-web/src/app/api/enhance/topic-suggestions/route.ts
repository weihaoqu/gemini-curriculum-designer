import { getAnthropicClient } from "@/lib/claude/client";
import { ENHANCE_SYSTEM_PROMPT, MODEL, MAX_TOKENS } from "@/lib/claude/prompts";
import { buildTopicSuggestionsPrompt } from "@/lib/claude/enhance-topic";
import type { UploadedFile, EnhanceCourseContext } from "@/lib/types/curriculum";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topicName, topicDescription, weekOrModule, courseName, instructorNotes, materials, scopeContext, courseContext } =
      body as {
        topicName: string;
        topicDescription: string;
        weekOrModule: string;
        courseName: string;
        instructorNotes?: string;
        materials?: UploadedFile[];
        scopeContext: string;
        courseContext?: EnhanceCourseContext | null;
      };

    if (!topicName || !courseName) {
      return new Response("Missing required fields", { status: 400 });
    }

    const client = getAnthropicClient();
    const userPrompt = buildTopicSuggestionsPrompt({
      topicName,
      topicDescription,
      weekOrModule,
      courseName,
      instructorNotes,
      materials,
      scopeContext,
      courseContext,
    });

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
    console.error("Topic suggestions API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
