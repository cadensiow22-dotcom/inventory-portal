import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("pdf_documents")
    .select("id,title,public_url,uploaded_at,is_active")
    .eq("is_active", true)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { signature: "LIST_ROUTE_VERCEL_PROOF_123", file: "app/api/pdfs/list/route.ts", error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    signature: "LIST_ROUTE_VERCEL_PROOF_123",
    file: "app/api/pdfs/list/route.ts",
    data,
  });

  return NextResponse.json(
  { signature: "LIST_ROUTE_VERCEL_PROOF_123", file: "app/api/pdfs/list/route.ts", data },
  { headers: { "Cache-Control": "no-store" } }
);

}
