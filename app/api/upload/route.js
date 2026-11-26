import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

// Photo upload to Vercel Blob (needs BLOB_READ_WRITE_TOKEN – added automatically when Blob storage is connected in Vercel)
export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Photo storage connect avvaledu. Image URL paste cheyandi." }, { status: 503 });
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!/^image\//.test(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image only, max 5MB" }, { status: 400 });
  const blob = await put(`news/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
