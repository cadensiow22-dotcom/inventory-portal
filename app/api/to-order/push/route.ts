import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
const { compare } = await import("bcryptjs");

export const runtime = "nodejs";

type Body = {
  ownerPin?: string;
  parentCategoryId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const ownerPin = String(body?.ownerPin ?? "").trim();
    const parentCategoryId = String(body?.parentCategoryId ?? "").trim();

    if (!ownerPin) return NextResponse.json({ error: "Owner PIN is required" }, { status: 400 });
    if (!/^\d{4,8}$/.test(ownerPin))
      return NextResponse.json({ error: "Owner PIN must be 4 to 8 digits" }, { status: 400 });

    if (!parentCategoryId)
      return NextResponse.json({ error: "Category is required" }, { status: 400 });

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
    if (!ok) return NextResponse.json({ error: "Invalid owner PIN" }, { status: 401 });

    // 2) Read parent category name
    const { data: parentRow, error: parentErr } = await supabaseAdmin
      .from("categories")
      .select("id,name")
      .eq("id", parentCategoryId)
      .single();

    if (parentErr || !parentRow) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 3) Fetch subcategories under this parent
    const { data: subs, error: subErr } = await supabaseAdmin
      .from("categories")
      .select("id,name")
      .eq("parent_id", parentCategoryId)
      .eq("is_active", true);

    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

    const subIds = (subs ?? []).map((s) => s.id);
    const subNameMap = new Map<string, string>();
    for (const s of subs ?? []) subNameMap.set(s.id, s.name);

    // If no subcategories => clear this category's queue and return 0
    if (subIds.length === 0) {
      await supabaseAdmin.from("to_order_queue").delete().eq("parent_category_id", parentCategoryId);
      return NextResponse.json({ ok: true, added: 0, order_date: new Date().toISOString().slice(0, 10) });
    }

    // 4) Fetch items below quota in those subcategories
    const { data: items, error: itemErr } = await supabaseAdmin
      .from("items")
      .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
      .in("subcategory_id", subIds)
      .eq("is_active", true);

    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

    const below = (items ?? []).filter((it: any) => {
      const quotaEnabled = !it.quota_disabled && it.quota !== null;
      return quotaEnabled && it.stock_count < it.quota;
    });

    // 5) Replace this category’s queue rows
    const { error: delErr } = await supabaseAdmin
      .from("to_order_queue")
      .delete()
      .eq("parent_category_id", parentCategoryId);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // 6) Insert new snapshot rows (with order_date = current_date on server)
    if (below.length > 0) {
      const payload = below.map((it: any) => ({
        parent_category_id: parentCategoryId,
        parent_category_name: parentRow.name,

        item_id: it.id,
        item_name: it.name,

        subcategory_id: it.subcategory_id,
        subcategory_name: subNameMap.get(it.subcategory_id) ?? "Unknown",

        stock_count: it.stock_count,
        quota: it.quota,
        // order_date will default to current_date
      }));

      const { error: insErr } = await supabaseAdmin
        .from("to_order_queue")
        .insert(payload);

      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // Return the server date string
    const orderDate = new Date().toISOString().slice(0, 10);
    return NextResponse.json({ ok: true, added: below.length, order_date: orderDate }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
