import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasDb, listUsers, createUser, setUserActive } from "@/lib/db";

export const dynamic = "force-dynamic";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" };

// Current user (+ reporter list for admin)
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null, db: hasDb }, { headers: CORS });
  const users = s.role === "admin" && hasDb ? await listUsers() : [];
  return NextResponse.json({ user: s, users, db: hasDb }, { headers: CORS });
}

// Admin adds a reporter (reporters cannot sign up themselves)
export async function POST(req) {
  const s = await getSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const b = await req.json();
  if (!b.email || !b.password || String(b.password).length < 6) return NextResponse.json({ error: "Email & password (min 6) required" }, { status: 400 });
  try {
    const u = await createUser({ email: b.email, name: b.name || "Reporter", password: b.password, role: b.role, district: b.district, phone: b.phone });
    return NextResponse.json({ user: u }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ee email already undi" }, { status: 409 });
  }
}

// Admin blocks / unblocks a reporter: { id, active }
export async function PATCH(req) {
  const s = await getSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id, active } = await req.json();
  await setUserActive(id, active);
  return NextResponse.json({ ok: true });
}
