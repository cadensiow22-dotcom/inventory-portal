import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { id, ownerPin } = await req.json();

    if (!id || !ownerPin) {
      return NextResponse.json({ error: "Missing id or owner PIN" }, { status: 400 });
    }

    // Dynamic import so build-time module evaluation doesn't choke
    const { compare } = await import("bcryptjs");

    // 1) Verify OWNER PIN
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

    // 2) Get file path
    const { data: row, error: getErr } = await supabaseAdmin
      .from("pdf_documents")
      .select("storage_path,file_path")
      .eq("id", id)
      .single();

    if (getErr || !row) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const path = row.storage_path || row.file_path;

    // 3) Soft delete
    const { error: dbErr } = await supabaseAdmin
      .from("pdf_documents")
      .update({ is_active: false })
      .eq("id", id);

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    // 4) Remove from storage (best-effort)
    if (path) {
      await supabaseAdmin.storage.from("pdfs").remove([path]);
    }

    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Delete failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
