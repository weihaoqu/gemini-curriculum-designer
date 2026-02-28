import { getAnthropicClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, MODEL } from "@/lib/claude/prompts";
import { buildTopicCalibrationPrompt } from "@/lib/claude/enhance-topic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topicName, topicDescription, courseName, materialsText } = body as {
      topicName: string;
      topicDescription: string;
      courseName: string;
      materialsText?: string;
    };

    if (!topicName || !courseName) {
      return new Response("Missing required fields", { status: 400 });
    }

    const client = getAnthropicClient();
    const userPrompt = buildTopicCalibrationPrompt({
      topicName,
      topicDescription,
      courseName,
      materialsText,
    });

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
    console.error("Topic calibration API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
