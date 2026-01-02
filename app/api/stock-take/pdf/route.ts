import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

type Row = {
  id: string;
  name: string;
  stock_count: number;
  search_text: string | null;
};

function safeFilename(s: string) {
  return (s || "unknown")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function buildPdfBuffer(categoryName: string, rows: Row[]) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Stock Take", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Category: ${categoryName}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    if (rows.length === 0) {
      doc.fontSize(12).text("No items found for this selection.");
      doc.end();
      return;
    }

    for (const item of rows) {
      doc.fontSize(11).text(`• ${item.name}   (Stock: ${item.stock_count})`, {
        indent: 12,
      });
    }

    doc.end();
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    // ---------- ALL ----------
    if (categoryId === "__ALL__") {
      const { data, error } = await supabaseAdmin
        .from("items")
        .select("id,name,stock_count,search_text")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(5000);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const rows = (data ?? []) as Row[];
      const pdfBuffer = await buildPdfBuffer("All", rows);
      const body = new Uint8Array(pdfBuffer);

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="stocktake-all.pdf"`,
        },
      });
    }

    // ---------- NORMAL CATEGORY ----------
    // 1) Get parent category name
    const { data: catData, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .single();

    if (catErr) {
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }

    const categoryName = catData?.name ?? "Unknown";

    // 2) Get subcategory IDs under this parent
    const { data: subData, error: subErr } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("parent_id", categoryId)
      .eq("is_active", true);

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const subIds = (subData ?? []).map((s: any) => s.id);

    // If no subcategories, return empty PDF
    if (subIds.length === 0) {
      const pdfBuffer = await buildPdfBuffer(categoryName, []);
      const body = new Uint8Array(pdfBuffer);
      const filename = `stocktake-${safeFilename(categoryName)}.pdf`;

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // 3) Get items by subcategory_id list (NO JOIN)
    const { data: itemData, error: itemErr } = await supabaseAdmin
      .from("items")
      .select("id,name,stock_count,search_text")
      .in("subcategory_id", subIds)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(5000);

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }

    const rows = (itemData ?? []) as Row[];
    const pdfBuffer = await buildPdfBuffer(categoryName, rows);
    const body = new Uint8Array(pdfBuffer);

    const filename = `stocktake-${safeFilename(categoryName)}.pdf`;

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
