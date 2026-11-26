import { NextResponse } from "next/server";
import { hasDb, hasAdmin, createUser, findUser } from "@/lib/db";
import { createSession } from "@/lib/auth";

// One-time setup: creates the first admin account. Disabled forever once an admin exists.
export async function POST(req) {
  if (!hasDb) return NextResponse.json({ error: "Database not connected yet" }, { status: 503 });
  if (await hasAdmin()) return NextResponse.json({ error: "Admin already created. Login cheyandi." }, { status: 403 });
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8) return NextResponse.json({ error: "Email & password (min 8 characters) ivvandi" }, { status: 400 });
  await createUser({ email, name: name || "Admin", password, role: "admin" });
  const u = await findUser(email);
  await createSession(u);
  return NextResponse.json({ ok: true });
}
