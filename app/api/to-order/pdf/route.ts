import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

type Row = {
  item_id: string;
  item_name: string;
  stock_count: number;
  quota: number;
  subcategory_id: string;
  subcategory_name: string;
  parent_category_id: string;
  parent_category_name: string;
  order_date: string | null;
};

function makeSafeFilenamePart(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function buildPdfBuffer(rows: Row[]) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ----- Header -----
    const orderDate =
      rows.length === 0
        ? null
        : rows
            .map((r) => r.order_date ?? "")
            .filter(Boolean)
            .sort()
            .at(-1) ?? null;

    doc.fontSize(18).text("To-Order List", { align: "left" });
    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Order Date: ${orderDate ?? "—"}`)
      .text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(12);

    if (rows.length === 0) {
      doc.text("No items in the To-Order queue.");
      doc.end();
      return;
    }

    // ----- Group rows: Parent Category -> Subcategory -----
    const byParent = new Map<string, { name: string; subs: Map<string, { name: string; items: Row[] }> }>();

    for (const r of rows) {
      const pKey = r.parent_category_id ?? "unknown-parent";
      const pName = r.parent_category_name ?? "Unknown Category";
      const sKey = r.subcategory_id ?? "unknown-sub";
      const sName = r.subcategory_name ?? "Unknown Subcategory";

      if (!byParent.has(pKey)) {
        byParent.set(pKey, { name: pName, subs: new Map() });
      }
      const parent = byParent.get(pKey)!;

      if (!parent.subs.has(sKey)) {
        parent.subs.set(sKey, { name: sName, items: [] });
      }
      parent.subs.get(sKey)!.items.push(r);
    }

    // Sort parents and subs by name (matches your UI ordering)
    const parentsSorted = Array.from(byParent.values()).sort((a, b) => a.name.localeCompare(b.name));

    for (const parent of parentsSorted) {
      doc.moveDown(0.5);
      doc.fontSize(14).text(parent.name);
      doc.moveDown(0.3);

      const subsSorted = Array.from(parent.subs.values()).sort((a, b) => a.name.localeCompare(b.name));

      for (const sub of subsSorted) {
        doc.fontSize(12).text(sub.name);
        doc.moveDown(0.2);

        // sort items by name
        const itemsSorted = [...sub.items].sort((a, b) => (a.item_name ?? "").localeCompare(b.item_name ?? ""));

        for (const item of itemsSorted) {
          const line = `• ${item.item_name}   (Stock: ${item.stock_count} / Quota: ${item.quota})`;
          doc.fontSize(10).text(line, { indent: 12 });
        }

        doc.moveDown(0.6);
      }
    }

    doc.end();
  });
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("to_order_queue")
      .select(
        "item_id,item_name,stock_count,quota,subcategory_id,subcategory_name,parent_category_id,parent_category_name,order_date"
      )
      .order("parent_category_name", { ascending: true })
      .order("subcategory_name", { ascending: true })
      .order("item_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as Row[];

    const orderDate =
      rows.length === 0
        ? "empty"
        : rows
            .map((r) => r.order_date ?? "")
            .filter(Boolean)
            .sort()
            .at(-1) ?? "unknown-date";

    const filename = `to-order-${makeSafeFilenamePart(orderDate)}.pdf`;
    const pdfBuffer = await buildPdfBuffer(rows);

    const body = new Uint8Array(pdfBuffer);

return new NextResponse(body, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
  },
});

      } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
