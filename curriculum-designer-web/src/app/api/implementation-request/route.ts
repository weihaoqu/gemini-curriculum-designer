import { NextResponse } from "next/server";
import { insertRequest } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department, course, email, courseTopic, courseInfo, files } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!files || typeof files !== "string") {
      return NextResponse.json(
        { error: "Files content is required" },
        { status: 400 }
      );
    }

    const id = insertRequest(
      email,
      courseTopic ?? "",
      typeof courseInfo === "string" ? courseInfo : JSON.stringify(courseInfo),
      files,
      typeof name === "string" ? name : "",
      typeof department === "string" ? department : "",
      typeof course === "string" ? course : ""
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Implementation request error:", err);
    return NextResponse.json(
      { error: "Failed to save request" },
      { status: 500 }
    );
  }
}
