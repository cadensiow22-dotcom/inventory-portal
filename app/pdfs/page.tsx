"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PdfRow = {
  id: number;
  title: string | null;
  storage_path: string;
  public_url: string;
  created_at: string | null;
};

export default function PdfsPage() {
  const [pdfs, setPdfs] = useState<PdfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // upload form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [ownerPin, setOwnerPin] = useState("");
  const [uploading, setUploading] = useState(false);

  // remove form
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removePin, setRemovePin] = useState("");

  async function loadPdfs() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/pdfs/list", { method: "GET" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load PDFs");
      setPdfs(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPdfs();
  }, []);

  const sorted = useMemo(() => {
    return [...pdfs].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
  }, [pdfs]);

  async function handleUpload() {
    setErr("");

    if (!file) {
      setErr("Please choose a PDF file first.");
      return;
    }
    if (file.type !== "application/pdf") {
      setErr("Only PDF files are allowed.");
      return;
    }
    if (ownerPin.trim().length === 0) {
      setErr("Owner PIN is required to upload.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("owner_pin", ownerPin.trim());

      const res = await fetch("/api/pdfs/upload", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");

      // reset
      setFile(null);
      setTitle("");
      setOwnerPin("");

      await loadPdfs();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(id: number) {
    setErr("");
    if (removePin.trim().length === 0) {
      setErr("Owner PIN is required to remove.");
      return;
    }

    const ok = confirm("Remove this PDF? This cannot be undone.");
    if (!ok) return;

    setRemovingId(id);
    try {
      const res = await fetch("/api/pdfs/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, owner_pin: removePin.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Remove failed");

      await loadPdfs();
    } catch (e: any) {
      setErr(e?.message ?? "Remove failed");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
          <div className="text-sm font-semibold">PDF Library</div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm text-gray-600">
            Viewing is public. Uploading and removal require the <b>Owner PIN</b>.
          </p>

          {err ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {/* Upload (Owner only) */}
          <div className="mt-4 rounded-xl border bg-gray-50 p-3">
            <div className="text-sm font-semibold">Owner actions</div>

            <div className="mt-3 grid gap-3">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Owner PIN"
                inputMode="numeric"
                value={ownerPin}
                onChange={(e) =>
                  setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 12))
                }
              />

              <input
                type="file"
                accept="application/pdf"
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>

              <div className="text-xs text-gray-500">
                Tip: enter the Owner PIN only when you need to upload/remove.
              </div>
            </div>
          </div>

          {/* List */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Available PDFs</div>
              <button
                className="rounded-lg border bg-white px-3 py-1 text-xs hover:bg-gray-50"
                onClick={loadPdfs}
              >
                Refresh
              </button>
            </div>

            {loading ? <p className="text-sm">Loading…</p> : null}

            {!loading && sorted.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                No PDFs uploaded yet.
              </div>
            ) : null}

            {!loading && sorted.length > 0 ? (
              <div className="space-y-3">
                {/* Remove PIN input (shared) */}
                <div className="rounded-xl border p-3">
                  <div className="text-xs font-semibold text-gray-700">
                    Owner PIN (for removal only)
                  </div>
                  <input
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Owner PIN"
                    inputMode="numeric"
                    value={removePin}
                    onChange={(e) =>
                      setRemovePin(e.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                  />
                  <div className="mt-1 text-[11px] text-gray-500">
                    Public users can ignore this field.
                  </div>
                </div>

                {sorted.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {p.title?.trim() ? p.title : "Untitled PDF"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 break-all">
                          {p.public_url}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {p.created_at
                            ? new Date(p.created_at).toLocaleString()
                            : ""}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={p.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 text-center"
                        >
                          Open
                        </a>

                        <button
                          type="button"
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          disabled={removingId === p.id}
                          onClick={() => handleRemove(p.id)}
                        >
                          {removingId === p.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
