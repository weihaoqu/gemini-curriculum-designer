import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { listRequests } from "@/lib/db";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const token = req.cookies.get("admin_token")?.value;
  if (!token || token !== hashPassword(adminPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = listRequests();
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("Admin requests error:", err);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
