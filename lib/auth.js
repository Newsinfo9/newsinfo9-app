// Session auth: cookie for the website/admin, Bearer token for the mobile app.
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { createHash } from "crypto";
import { getUser, hasDb } from "./db";

const COOKIE = "ni9_session";
// AUTH_SECRET env is preferred; otherwise derive a private secret from the database URL (never exposed)
const secret = () => new TextEncoder().encode(
  process.env.AUTH_SECRET ||
  createHash("sha256").update("ni9-session:" + (process.env.DATABASE_URL || process.env.POSTGRES_URL || "dev-only")).digest("hex")
);

export async function signToken(user) {
  return new SignJWT({ uid: user.id, role: user.role, name: user.name, district: user.district || null })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("60d").sign(secret());
}

export async function createSession(user) {
  const token = await signToken(user);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return token;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// Returns the logged-in user (re-checked against DB so a blocked reporter loses access immediately)
export async function getSession() {
  try {
    const h = await headers();
    const bearer = (h.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const jar = await cookies();
    const t = bearer || jar.get(COOKIE)?.value;
    if (!t) return null;
    const { payload } = await jwtVerify(t, secret());
    if (hasDb) {
      const u = await getUser(payload.uid);
      if (!u || !u.active) return null;
      return { uid: u.id, role: u.role, name: u.name, district: u.district };
    }
    return payload;
  } catch {
    return null;
  }
}
