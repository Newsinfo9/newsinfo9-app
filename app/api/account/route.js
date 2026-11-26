import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSession } from "@/lib/auth";

// Logged-in user updates own name / login email: PATCH { email?, name? }
export async function PATCH(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { email, name } = await req.json().catch(() => ({}));
  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const e = email ? String(email).toLowerCase().trim() : null;
  if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return NextResponse.json({ error: "Email sariga ledu" }, { status: 400 });
  try {
    const rows = await sql`UPDATE users SET email = COALESCE(${e}, email), name = COALESCE(${name || null}, name)
      WHERE id = ${s.uid} RETURNING id, email, name, role`;
    return NextResponse.json({ user: rows[0] });
  } catch {
    return NextResponse.json({ error: "Ee email already vere account ki undi" }, { status: 409 });
  }
}
