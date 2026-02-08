export async function sendPdfToAssignedEmail(args: {
  blob: Blob;
  filename: string;
  subject?: string;
  message?: string;
}) {
  const { blob, filename, subject, message } = args;

  const base64Pdf = await blobToBase64(blob);

  const res = await fetch("/api/send-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, base64Pdf, subject, message }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Failed to send PDF");
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Failed to read PDF blob"));
    r.onload = () => {
      const result = String(r.result || "");
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    r.readAsDataURL(blob);
  });
}
