'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Pdf = {
  id: string;
  title: string | null;
  public_url: string;
};

export default function PdfLibraryPage() {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [title, setTitle] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadPdfs() {
  setErr(""); // clear old errors

  const res = await fetch("/api/pdfs/list");
  const json = await res.json();

  if (!res.ok) {
    setErr(json.error || "Failed to load PDFs");
    setPdfs([]);
    return;
  }

  setPdfs(json.data ?? []);
}


  useEffect(() => {
    loadPdfs();
  }, []);

  async function uploadPdf(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    if (!title.trim()) {
  setErr('Title is required');
  return;
}

   if (!file || !ownerPin) {
    setErr('Missing file or owner PIN');
    return;
  }


    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('ownerPin', ownerPin);

    const res = await fetch('/api/pdfs/upload', {
      method: 'POST',
      body: fd,
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErr(json.error || 'Upload failed');
      return;
    }

    setTitle('');
    setOwnerPin('');
    setFile(null);
    loadPdfs();
  }

  async function deletePdf(id: string) {
    const pin = prompt('Enter OWNER PIN to delete');
    if (!pin) return;

    const res = await fetch('/api/pdfs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ownerPin: pin }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Delete failed');
      return;
    }

    loadPdfs();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Home
        </Link>

        <h1 className="mt-4 text-2xl font-bold">PDF Library</h1>
        <p className="text-sm text-gray-600 mb-4">
          Viewing is public. Uploading and removal require the <b>Owner PIN</b>.
        </p>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Owner upload */}
        <form
          onSubmit={uploadPdf}
          className="mb-6 rounded-xl bg-white p-4 shadow"
        >
          <h2 className="font-semibold mb-3">Owner actions</h2>

          <input
            placeholder="Title (required)"
            className="w-full border p-2 mb-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="Owner PIN"
            type="password"
            className="w-full border p-2 mb-2 rounded"
            value={ownerPin}
            onChange={(e) => setOwnerPin(e.target.value)}
          />

        <label className="block mb-3">
           <span className="mb-1 block text-sm text-gray-600">PDF file</span>
           <input
            type="file"
            accept="application/pdf"
            className="w-full rounded border p-2"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
         </label>

          <button
            disabled={loading || !title.trim()}
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </form>

        {/* List */}
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="font-semibold mb-3">Available PDFs</h2>

          {pdfs.length === 0 && (
            <p className="text-sm text-gray-500">No PDFs uploaded yet.</p>
          )}

          <ul className="space-y-2">
            {pdfs.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <a
                  href={p.public_url}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {p.title || 'Untitled PDF'}
                </a>

                <button
                  onClick={() => deletePdf(p.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
