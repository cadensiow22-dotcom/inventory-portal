import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

type Body = {
  filename: string;
  base64Pdf: string; // base64 ONLY (no data:application/pdf;base64, prefix)
  subject?: string;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const filename = String(body?.filename ?? "export.pdf").trim() || "export.pdf";
    const base64Pdf = String(body?.base64Pdf ?? "").trim();

    // basic safety: block huge payloads (prevents accidental freeze)
    if (base64Pdf.length < 50) {
      return NextResponse.json({ error: "Missing PDF data" }, { status: 400 });
    }
    if (base64Pdf.length > 12_000_000) {
      return NextResponse.json({ error: "PDF too large to email" }, { status: 413 });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const to = process.env.PDF_RECIPIENT_EMAIL;
    const senderName = process.env.PDF_SENDER_NAME || "Inventory Portal";

    if (!host || !user || !pass || !to) {
      return NextResponse.json(
        {
          error:
            "Server email env vars not set: SMTP_HOST, SMTP_USER, SMTP_PASS, PDF_RECIPIENT_EMAIL",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user,
    pass,
  },
});

    const subject = (body?.subject ?? `PDF Export: ${filename}`).toString().slice(0, 140);
    const message =
      (body?.message ?? "Attached is the exported PDF from Inventory Portal.")
        .toString()
        .slice(0, 5000);

    await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to,
      subject,
      text: message,
      attachments: [
        {
          filename,
          content: Buffer.from(base64Pdf, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to send PDF" },
      { status: 500 }
    );
  }
}
