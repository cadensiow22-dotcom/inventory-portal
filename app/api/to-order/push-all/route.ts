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

    if (!ownerPin) {
      return NextResponse.json({ error: "Owner PIN is required" }, { status: 400 });
    }
    if (!/^\d{4,8}$/.test(ownerPin)) {
      return NextResponse.json({ error: "Owner PIN must be 4 to 8 digits" }, { status: 400 });
    }

    // Verify owner PIN
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

    // Load all categories to map subcategory -> parent
    const { data: cats, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("id,name,parent_id")
      .eq("is_active", true);

    if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

    const subName = new Map<string, string>();
    const subToParent = new Map<string, string>();
    const parentName = new Map<string, string>();

    for (const c of cats ?? []) {
      if (c.parent_id) {
        subName.set(c.id, c.name);
        subToParent.set(c.id, c.parent_id);
      } else {
        parentName.set(c.id, c.name);
      }
    }

    // Load all items
    const { data: items, error: itemErr } = await supabaseAdmin
      .from("items")
      .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
      .eq("is_active", true)
      .limit(10000);

    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

    // Filter below quota
    const below = (items ?? []).filter((it: any) => {
      const quotaEnabled = !it.quota_disabled && it.quota !== null;
      return quotaEnabled && it.stock_count < it.quota;
    });

    // Clear entire queue
    const { error: delErr } = await supabaseAdmin
      .from("to_order_queue")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Insert new queue
    if (below.length > 0) {
      const payload = below.map((it: any) => {
        const subId = it.subcategory_id as string;
        const parentId = subToParent.get(subId) ?? null;

        return {
          parent_category_id: parentId,
          parent_category_name: parentId ? (parentName.get(parentId) ?? "Unknown") : "Unknown",

          item_id: it.id,
          item_name: it.name,

          subcategory_id: subId,
          subcategory_name: subName.get(subId) ?? "Unknown",

          stock_count: it.stock_count,
          quota: it.quota,
          // order_date uses DB default current_date
        };
      });

      const { error: insErr } = await supabaseAdmin.from("to_order_queue").insert(payload);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const orderDate = new Date().toISOString().slice(0, 10);
    return NextResponse.json({ ok: true, added: below.length, order_date: orderDate }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
