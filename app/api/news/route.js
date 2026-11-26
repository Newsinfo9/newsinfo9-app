import { NextResponse } from "next/server";
import { listNews, createNews, countPending, hasDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };

export function OPTIONS() { return new Response(null, { headers: CORS }); }

// GET /api/news?cat=&district=&limit=        -> public feed (published only)
// GET /api/news?mine=1                         -> reporter's own submissions (any status)
// GET /api/news?all=1&status=pending           -> admin moderation list
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const limit = Math.min(Number(p.get("limit")) || 100, 300);
  if (p.get("mine") === "1" || p.get("all") === "1") {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: "Login required" }, { status: 401, headers: CORS });
    if (p.get("mine") === "1") return NextResponse.json({ news: await listNews({ authorId: s.uid, limit }) }, { headers: { ...CORS, "Cache-Control": "no-store" } });
    if (s.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403, headers: CORS });
    const [news, pending] = await Promise.all([listNews({ all: true, status: p.get("status") || null, limit }), countPending()]);
    return NextResponse.json({ news, pending }, { headers: { ...CORS, "Cache-Control": "no-store" } });
  }
  const news = await listNews({ cat: p.get("cat") || undefined, district: p.get("district") || undefined, limit });
  return NextResponse.json({ news, db: hasDb }, { headers: { ...CORS, "Cache-Control": "s-maxage=20, stale-while-revalidate=60" } });
}

// Reporter story -> 'pending' (needs admin approval). Admin story -> published/draft as chosen.
export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401, headers: CORS });
  if (!hasDb) return NextResponse.json({ error: "Database not connected yet" }, { status: 503, headers: CORS });
  const b = await req.json();
  if (!b?.te?.title && !b?.en?.title) return NextResponse.json({ error: "Title required" }, { status: 400, headers: CORS });
  if (s.role !== "admin") {
    b.status = "pending";
    b.breaking = false;
    if (!b.district || b.district === "all") b.district = s.district || "all";
    if (!b.source) b.source = s.name;
  } else if (b.status !== "draft") b.status = "published";
  const n = await createNews(b, s.uid);
  return NextResponse.json({ news: n, message: s.role === "admin" ? "Published" : "Admin approval kosam pampam" }, { status: 201, headers: CORS });
}
