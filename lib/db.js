// PostgreSQL access (Neon / Vercel Postgres). Falls back to read-only demo data
// when DATABASE_URL is not set, so the site works before the database is connected.
//
// News workflow:  reporter submits (app/admin) -> status 'pending' -> admin Approve -> 'published' (visible to users)
//                                                                  -> admin Reject  -> 'rejected' (reporter sees reason)
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import seed from "./seed.json";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const hasDb = !!url;
const sql = hasDb ? neon(url) : null;

let ready = null;
export function ensureSchema() {
  if (!hasDb) return Promise.resolve();
  if (!ready) ready = init().catch(e => { ready = null; throw e; });
  return ready;
}

async function init() {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reporter',
    district TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    cat TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT 'all',
    breaking BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    title_te TEXT, body_te TEXT, full_te TEXT,
    title_en TEXT, body_en TEXT, full_en TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    reject_reason TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS news_feed_idx ON news (status, created_at DESC)`;

  // First admin from environment variables
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim(), pass = process.env.ADMIN_PASSWORD;
  if (email && pass) {
    const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (!rows.length) {
      const hash = await bcrypt.hash(pass, 10);
      await sql`INSERT INTO users (email, name, password_hash, role) VALUES (${email}, 'Admin', ${hash}, 'admin')`;
    }
  }
  // Demo stories on an empty database
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM news`;
  if (count === 0) {
    for (const n of seed.news.slice().reverse()) {
      await sql`INSERT INTO news (cat, district, breaking, image, title_te, body_te, full_te, title_en, body_en, full_en, source, created_at)
        VALUES (${n.cat}, ${n.district}, ${n.breaking}, ${n.image || null}, ${n.te.title}, ${n.te.body}, ${n.te.full}, ${n.en.title}, ${n.en.body}, ${n.en.full}, ${n.source}, ${n.time})`;
    }
  }
}

// ---------- Shape conversion ----------
export function toApi(r) {
  return {
    id: String(r.id), cat: r.cat, district: r.district, breaking: r.breaking, image: r.image || "",
    time: new Date(r.created_at).toISOString(), source: r.source || "NEWS INFO9",
    status: r.status || "published", rejectReason: r.reject_reason || "",
    authorId: r.author_id || null, authorName: r.author_name || "",
    te: { title: r.title_te || "", body: r.body_te || "", full: r.full_te || "" },
    en: { title: r.title_en || "", body: r.body_en || "", full: r.full_en || "" }
  };
}
const demo = () => seed.news.map(n => ({ ...n, status: "published" }));

// ---------- News ----------
// Public feed (published only) | admin list (all / by status) | reporter's own list
export async function listNews({ cat, district, limit = 100, all = false, status = null, authorId = null } = {}) {
  if (!hasDb) {
    if (authorId || status === "pending") return [];
    let l = demo();
    if (cat && cat !== "all") l = l.filter(n => n.cat === cat);
    if (district) l = l.filter(n => n.district === district || n.district === "all");
    return l.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);
  }
  await ensureSchema();
  const c = cat && cat !== "all" ? cat : null, d = district || null, st = status || null;
  let rows;
  if (authorId) {
    rows = await sql`SELECT n.*, u.name AS author_name FROM news n LEFT JOIN users u ON u.id = n.author_id
      WHERE n.author_id = ${authorId} ORDER BY n.created_at DESC LIMIT ${limit}`;
  } else if (all) {
    rows = await sql`SELECT n.*, u.name AS author_name FROM news n LEFT JOIN users u ON u.id = n.author_id
      WHERE (${st}::text IS NULL OR n.status = ${st}) ORDER BY n.created_at DESC LIMIT ${limit}`;
  } else {
    rows = await sql`SELECT * FROM news WHERE status = 'published'
      AND (${c}::text IS NULL OR cat = ${c})
      AND (${d}::text IS NULL OR district = ${d} OR district = 'all')
      ORDER BY created_at DESC LIMIT ${limit}`;
  }
  return rows.map(toApi);
}

export async function getNews(id, { publishedOnly = true } = {}) {
  if (!hasDb) return demo().find(n => n.id === id) || null;
  await ensureSchema();
  const n = Number(id); if (!Number.isInteger(n)) return null;
  const rows = await sql`SELECT * FROM news WHERE id = ${n}`;
  if (!rows[0] || (publishedOnly && rows[0].status !== "published")) return null;
  return toApi(rows[0]);
}

const STATUSES = ["published", "pending", "draft", "rejected"];
function fields(b) {
  const s = v => (v == null ? "" : String(v)).trim();
  return {
    cat: s(b.cat) || "local", district: s(b.district) || "all", breaking: !!b.breaking, image: s(b.image) || null,
    title_te: s(b.te?.title), body_te: s(b.te?.body), full_te: s(b.te?.full),
    title_en: s(b.en?.title), body_en: s(b.en?.body), full_en: s(b.en?.full),
    source: s(b.source) || "NEWS INFO9", status: STATUSES.includes(b.status) ? b.status : "published"
  };
}

export async function createNews(b, authorId) {
  await ensureSchema();
  const f = fields(b);
  const rows = await sql`INSERT INTO news (cat, district, breaking, image, title_te, body_te, full_te, title_en, body_en, full_en, source, status, author_id)
    VALUES (${f.cat}, ${f.district}, ${f.breaking}, ${f.image}, ${f.title_te}, ${f.body_te}, ${f.full_te}, ${f.title_en}, ${f.body_en}, ${f.full_en}, ${f.source}, ${f.status}, ${authorId || null})
    RETURNING *`;
  return toApi(rows[0]);
}

export async function updateNews(id, b) {
  await ensureSchema();
  const f = fields(b);
  const rows = await sql`UPDATE news SET cat=${f.cat}, district=${f.district}, breaking=${f.breaking}, image=${f.image},
    title_te=${f.title_te}, body_te=${f.body_te}, full_te=${f.full_te}, title_en=${f.title_en}, body_en=${f.body_en}, full_en=${f.full_en},
    source=${f.source}, status=${f.status}, updated_at=now() WHERE id=${Number(id)} RETURNING *`;
  return rows[0] ? toApi(rows[0]) : null;
}

// Approve / reject. On approval the story moves to the top of the feed.
export async function setStatus(id, status, reason) {
  await ensureSchema();
  const rows = await sql`UPDATE news SET
      created_at = CASE WHEN ${status} = 'published' AND status <> 'published' THEN now() ELSE created_at END,
      status = ${status}, reject_reason = ${reason || null}, updated_at = now()
    WHERE id = ${Number(id)} RETURNING *`;
  return rows[0] ? toApi(rows[0]) : null;
}

export async function getRaw(id) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM news WHERE id = ${Number(id)}`;
  return rows[0] || null;
}

export async function countPending() {
  if (!hasDb) return 0;
  await ensureSchema();
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM news WHERE status = 'pending'`;
  return count;
}

export async function deleteNews(id) {
  await ensureSchema();
  await sql`DELETE FROM news WHERE id = ${Number(id)}`;
}

// ---------- Users ----------
export async function findUser(email) {
  if (!hasDb) return null;
  await ensureSchema();
  const rows = await sql`SELECT * FROM users WHERE email = ${String(email || "").toLowerCase().trim()}`;
  return rows[0] || null;
}

export async function getUser(id) {
  if (!hasDb) return null;
  await ensureSchema();
  const rows = await sql`SELECT id, email, name, role, district, active FROM users WHERE id = ${Number(id)}`;
  return rows[0] || null;
}

export async function listUsers() {
  await ensureSchema();
  return sql`SELECT u.id, u.email, u.name, u.phone, u.role, u.district, u.active, u.created_at,
    (SELECT count(*)::int FROM news n WHERE n.author_id = u.id) AS stories
    FROM users u ORDER BY u.id`;
}

export async function createUser({ email, name, password, role, district, phone }) {
  await ensureSchema();
  const hash = await bcrypt.hash(String(password), 10);
  const rows = await sql`INSERT INTO users (email, name, password_hash, role, district, phone)
    VALUES (${String(email).toLowerCase().trim()}, ${name}, ${hash}, ${role === "admin" ? "admin" : "reporter"}, ${district || null}, ${phone || null})
    RETURNING id, email, name, role, district, phone`;
  return rows[0];
}

export async function setUserActive(id, active) {
  await ensureSchema();
  await sql`UPDATE users SET active = ${!!active} WHERE id = ${Number(id)} AND role <> 'admin'`;
}
