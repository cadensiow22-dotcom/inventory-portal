'use client';

import Link from 'next/link';

export default function SkirtingPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Home
        </Link>

        <h1 className="text-3xl font-bold mb-2 mt-4">Skirting</h1>
        <p className="text-gray-600 mb-6">
          Open the printable skirting template.
        </p>

        <div className="rounded-xl bg-white p-6 shadow">
          <Link
            href="/skirting/print"
            target="_blank"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 bg-white shadow hover:shadow-md transition"
          >
            🖨 Open printable template
          </Link>

          <p className="mt-3 text-sm text-gray-500">
            This opens a non-editable page optimised for printing (Ctrl + P).
          </p>
        </div>
      </div>
    </main>
  );
}
