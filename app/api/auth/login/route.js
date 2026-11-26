import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser, hasDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

// Used by both admin website (cookie) and mobile app (returns token)
export async function POST(req) {
  if (!hasDb) return NextResponse.json({ error: "Database not connected yet." }, { status: 503 });
  const { email, password } = await req.json().catch(() => ({}));
  const u = await findUser(email);
  if (!u || !(await bcrypt.compare(String(password || ""), u.password_hash))) {
    return NextResponse.json({ error: "Email leda password tappu" }, { status: 401 });
  }
  if (!u.active) return NextResponse.json({ error: "Mee account block chesaru. Admin ni contact cheyandi." }, { status: 403 });
  const token = await createSession(u);
  return NextResponse.json({ token, user: { id: u.id, name: u.name, role: u.role, email: u.email, district: u.district } });
}
