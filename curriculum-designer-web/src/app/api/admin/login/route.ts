import { NextResponse } from "next/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured on server" },
      { status: 500 }
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = hashPassword(adminPassword);

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return res;
}
