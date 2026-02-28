import { NextResponse } from "next/server";
import { insertFeedback } from "@/lib/db";

const VALID_CATEGORIES = ["bug", "feature", "general"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, category, message, mode, phase, pagePath } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Category must be one of: bug, feature, general" },
        { status: 400 }
      );
    }

    const id = insertFeedback(
      typeof email === "string" ? email.trim() : "",
      category,
      message.trim(),
      typeof mode === "string" ? mode : "",
      typeof phase === "string" ? phase : "",
      typeof pagePath === "string" ? pagePath : ""
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
