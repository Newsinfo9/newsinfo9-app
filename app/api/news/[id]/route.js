import { NextResponse } from "next/server";
import { getNews, getRaw, updateNews, deleteNews, setStatus, hasDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
export function OPTIONS() { return new Response(null, { headers: CORS }); }

export async function GET(_req, { params }) {
  const { id } = await params;
  const n = await getNews(id);
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
  return NextResponse.json({ news: n }, { headers: CORS });
}

// Edit: admin any story; reporter only own pending/rejected story (goes back to pending)
export async function PUT(req, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401, headers: CORS });
  if (!hasDb) return NextResponse.json({ error: "Database not connected yet" }, { status: 503, headers: CORS });
  const { id } = await params;
  const raw = await getRaw(id);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
  const b = await req.json();
  if (s.role !== "admin") {
    if (raw.author_id !== s.uid || !["pending", "rejected"].includes(raw.status)) return NextResponse.json({ error: "Ee vartha edit cheyalem" }, { status: 403, headers: CORS });
    b.status = "pending"; b.breaking = false;
  }
  const n = await updateNews(id, b);
  return NextResponse.json({ news: n }, { headers: CORS });
}

// Admin moderation: { action: "approve" | "reject", reason? }
export async function PATCH(req, { params }) {
  const s = await getSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403, headers: CORS });
  const { id } = await params;
  const { action, reason } = await req.json();
  const map = { approve: "published", reject: "rejected", unpublish: "draft" };
  if (!map[action]) return NextResponse.json({ error: "Bad action" }, { status: 400, headers: CORS });
  const n = await setStatus(id, map[action], action === "reject" ? reason : null);
  return NextResponse.json({ news: n }, { headers: CORS });
}

export async function DELETE(_req, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401, headers: CORS });
  if (!hasDb) return NextResponse.json({ error: "Database not connected yet" }, { status: 503, headers: CORS });
  const { id } = await params;
  if (s.role !== "admin") {
    const raw = await getRaw(id);
    if (!raw || raw.author_id !== s.uid || raw.status === "published") return NextResponse.json({ error: "Not allowed" }, { status: 403, headers: CORS });
  }
  await deleteNews(id);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
