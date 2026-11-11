import { NextResponse } from "next/server";
import { authConfig, checkPassword, createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

export async function POST(request: Request) {
  const { configured } = authConfig();
  if (!configured) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  let password = "";
  try {
    password = String((await request.json())?.password ?? "");
  } catch {}
  if (!checkPassword(password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}
