import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { compare } = await import("bcryptjs");

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ownerPin = String(body?.ownerPin ?? "").trim();

    if (!ownerPin) {
      return NextResponse.json({ error: "Owner PIN is required" }, { status: 400 });
    }

    // 1) Verify OWNER PIN against hash in owner_pin_settings (same pattern as PDF upload)
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

    // 2) Return staff UIDs only if verified
    const { data, error } = await supabaseAdmin
      .from("staff_names")
      .select("name, staff_uid, staff_role")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
