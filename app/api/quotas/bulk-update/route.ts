import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { compare } = await import("bcryptjs");

export const runtime = "nodejs";

type Body = {
  ownerPin?: string;
  itemIds?: string[];
  disable?: boolean;
  quota?: number | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const ownerPin = String(body?.ownerPin ?? "").trim();
    const itemIds = Array.isArray(body?.itemIds) ? body.itemIds : [];
    const disable = Boolean(body?.disable);
    const quotaRaw = body?.quota;

    if (!ownerPin) {
      return NextResponse.json({ error: "Owner PIN is required" }, { status: 400 });
    }
    if (!/^\d{4,8}$/.test(ownerPin)) {
      return NextResponse.json({ error: "Owner PIN must be 4 to 8 digits" }, { status: 400 });
    }
    if (itemIds.length === 0) {
      return NextResponse.json({ error: "Select at least 1 item" }, { status: 400 });
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

    // 2) Update items
    if (disable) {
      const { error } = await supabaseAdmin
        .from("items")
        .update({ quota_disabled: true })
        .in("id", itemIds);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ ok: true, disabled: true }, { status: 200 });
    }

    // enable + set quota
    const quota = typeof quotaRaw === "number" ? quotaRaw : Number(quotaRaw);
    if (!Number.isFinite(quota) || quota <= 0) {
      return NextResponse.json({ error: "Add quota must be a positive number" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("items")
      .update({ quota: Math.floor(quota), quota_disabled: false })
      .in("id", itemIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, disabled: false, quota: Math.floor(quota) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
