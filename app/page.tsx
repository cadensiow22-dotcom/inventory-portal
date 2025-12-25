'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import ManageNamesModal from "../components/ManageNamesModal";
import ViewUidsModal from "../components/ViewUidsModal";

type Category = {
  id: string;
  name: string;
};

export default function Page() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openManageNames, setOpenManageNames] = useState(false);
  const [openViewUids, setOpenViewUids] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name')
        .is('parent_id', null)
        .order('name');

      if (error) setErr(error.message);
      else setCats(data ?? []);
      setLoading(false);
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Inventory Portal</h1>
        <p className="text-gray-600 mb-6">
          Browse stock by category. No login required.
        </p>

        {loading && <p>Loading categories...</p>}

        {err && (
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-red-600">Error loading categories</p>
            <p className="text-sm text-gray-700 mt-1">{err}</p>
            <p className="text-sm text-gray-500 mt-3">
              If this says “permission denied” we’ll enable RLS + add a read policy.
            </p>
          </div>
        )}

        {!loading && !err && (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cats.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.id}`}
          className="rounded-xl bg-white p-6 shadow hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold text-center">{c.name}</h2>
        </Link>
      ))}
    </div>

    <div className="mt-6">
  <Link
    href="/pdfs"
    className="block rounded-xl bg-white p-6 shadow hover:shadow-lg transition text-center"
  >
    <h2 className="text-xl font-semibold">📄 PDF Library</h2>
    <p className="mt-1 text-sm text-gray-500">
      Manuals, guides, and documents
    </p>
  </Link>
</div>

<div className="mt-6 flex flex-col items-center gap-3">
<button
  className="border px-4 py-2 rounded bg-white shadow hover:shadow-md transition"
  onClick={() => setOpenViewUids(true)}
>
  View UIDs
</button>


  <button
    className="border px-4 py-2 rounded bg-white shadow hover:shadow-md transition"
    onClick={() => setOpenManageNames(true)}
  >
    Manage Names (Owner Only)
  </button>
</div>

<ViewUidsModal
  open={openViewUids}
  onClose={() => setOpenViewUids(false)}
/>

<ManageNamesModal
  open={openManageNames}
  onClose={() => setOpenManageNames(false)}
/>

  </>
)}

      </div>
    </main>
  );
}

