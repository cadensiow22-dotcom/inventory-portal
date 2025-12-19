import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { compare } from "bcryptjs";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null)?.trim() || "Untitled";
  const ownerPin = (formData.get("ownerPin") as string | null)?.trim();

  if (!file || !ownerPin) {
    return NextResponse.json({ error: "Missing file or owner PIN" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }

  // 1) Verify OWNER PIN against hash in owner_pin_settings
  const { data: pinRow, error: pinErr } = await supabaseAdmin
    .from("owner_pin_settings")
    .select("owner_pin_hash")
    .eq("id", true)
    .single();

  if (pinErr || !pinRow?.owner_pin_hash) {
    return NextResponse.json({ error: "Owner PIN settings not found" }, { status: 500 });
  }

  const ok = await compare(ownerPin, pinRow.owner_pin_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid owner PIN" }, { status: 401 });
  }

  // 2) Upload to Storage
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `pdfs/${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("pdfs")
    .upload(storagePath, file, { contentType: "application/pdf" });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // 3) Get public URL
  const { data: pub } = supabaseAdmin.storage.from("pdfs").getPublicUrl(storagePath);
  const publicUrl = pub.publicUrl;

  // 4) Insert DB row
  const { error: dbErr } = await supabaseAdmin.from("pdf_documents").insert({
    title,
    storage_path: storagePath,
    public_url: publicUrl,
    file_path: storagePath,   // keep both since your table has file_path too
    is_active: true,
    uploaded_at: new Date().toISOString(),
  });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
