import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { compare } = await import("bcryptjs");

export const runtime = "nodejs";

type Body = {
  ownerPin?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const ownerPin = String(body?.ownerPin ?? "").trim();

    if (!ownerPin) return NextResponse.json({ error: "Owner PIN is required" }, { status: 400 });
    if (!/^\d{4,8}$/.test(ownerPin))
      return NextResponse.json({ error: "Owner PIN must be 4 to 8 digits" }, { status: 400 });

    // verify PIN
    const { data: pinRow, error: pinErr } = await supabaseAdmin
      .from("owner_pin_settings")
      .select("owner_pin_hash")
      .eq("id", true)
      .single();

    if (pinErr || !pinRow?.owner_pin_hash) {
      return NextResponse.json({ error: "Owner PIN settings not found" }, { status: 500 });
    }

    const ok = await compare(ownerPin, pinRow.owner_pin_hash);
    if (!ok) return NextResponse.json({ error: "Invalid owner PIN" }, { status: 401 });

    // delete all rows
    const { error } = await supabaseAdmin
      .from("to_order_queue")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
