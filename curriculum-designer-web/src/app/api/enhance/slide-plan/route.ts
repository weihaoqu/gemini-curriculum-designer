import { getAnthropicClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, MODEL } from "@/lib/claude/prompts";
import { buildEnhanceSlidePlanPrompt } from "@/lib/claude/enhance-slide-plan";
import { generateId } from "@/lib/parsers";
import type {
  EnhanceTopicItem,
  EnhanceTopicDeepDive,
  EnhanceCourseContext,
} from "@/lib/types/curriculum";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseName, topics, deepDives, courseContext } = body as {
      courseName: string;
      topics: EnhanceTopicItem[];
      deepDives: EnhanceTopicDeepDive[];
      courseContext?: EnhanceCourseContext | null;
    };

    if (!topics?.length) {
      return new Response("Missing required fields", { status: 400 });
    }

    const client = getAnthropicClient();
    const userPrompt = buildEnhanceSlidePlanPrompt(
      courseName ?? "this course",
      topics,
      deepDives ?? [],
      courseContext
    );

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Failed to parse slide plan response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Add IDs and enabled flag to each slide
    if (parsed.modules) {
      for (const mod of parsed.modules) {
        mod.slides = mod.slides.map(
          (slide: { title: string; bulletPoints: string[]; slideType: string }) => ({
            ...slide,
            id: generateId(),
            enabled: true,
          })
        );
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Enhance slide plan API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
