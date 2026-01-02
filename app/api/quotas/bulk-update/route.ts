import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { compare } = await import("bcryptjs");

export const runtime = "nodejs";

type Body = {
  adminPin?: string;
  itemIds?: string[];
  disable?: boolean;
  quota?: number | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const adminPin = String(body?.adminPin ?? "").trim();
    const itemIds = Array.isArray(body?.itemIds) ? body.itemIds : [];
    const disable = Boolean(body?.disable);
    const quotaRaw = body?.quota;

    if (!adminPin) {
      return NextResponse.json({ error: "Admin PIN is required" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(adminPin)) {
      return NextResponse.json({ error: "Admin PIN must be exactly 6 digits" }, { status: 400 });
    }
    if (itemIds.length === 0) {
      return NextResponse.json({ error: "Select at least 1 item" }, { status: 400 });
    }

    // 1) Verify ADMIN PIN against hash in admin_settings.pin_hash
    const { data: pinRow, error: pinErr } = await supabaseAdmin
      .from("admin_settings")
      .select("pin_hash")
      .limit(1)
      .maybeSingle();

    if (pinErr || !pinRow?.pin_hash) {
      return NextResponse.json({ error: "Admin PIN settings not found" }, { status: 500 });
    }

    const ok = await compare(adminPin, pinRow.pin_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid admin PIN" }, { status: 401 });
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
      return NextResponse.json({ error: "Quota must be a positive number" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("items")
      .update({ quota: Math.floor(quota), quota_disabled: false })
      .in("id", itemIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { ok: true, disabled: false, quota: Math.floor(quota) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
