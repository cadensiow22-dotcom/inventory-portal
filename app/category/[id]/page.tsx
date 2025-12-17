"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import ManageSubcategoriesModal from "../../../components/ManageSubcategoriesModal";

type Category = {
  id: string;
  name: string;
};

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [subs, setSubs] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openManageSubcats, setOpenManageSubcats] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setErr(null);

      const parent = await supabase
        .from("categories")
        .select("name")
        .eq("id", id)
        .single();

      const children = await supabase
        .from("categories")
        .select("id,name")
        .eq("parent_id", id)
        .eq("is_active", true)
        .order("name");

      if (parent.error) setErr(parent.error.message);
      if (children.error) setErr(children.error.message);

      setTitle(parent.data?.name ?? "");
      setSubs(children.data ?? []);
      setLoading(false);
    };

    load();
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold">{title || "Category"}</h1>
          </div>

          <button
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => setOpenManageSubcats(true)}
          >
            Manage Subcategories
          </button>
        </div>

        <ManageSubcategoriesModal
          open={openManageSubcats}
          onClose={() => setOpenManageSubcats(false)}
          parentCategoryId={id ?? ""}
          parentCategoryName={title}
        />

        {loading && <p>Loading...</p>}

        {err && (
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-red-600">Error</p>
            <p className="text-sm text-gray-700 mt-1">{err}</p>
          </div>
        )}

        {!loading && !err && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subs.map((s) => (
              <Link
                key={s.id}
                href={`/items/${s.id}`}
                className="rounded-xl bg-white p-6 shadow hover:shadow-lg transition block"
              >
                <h2 className="text-lg font-semibold text-center">{s.name}</h2>
              </Link>
            ))}

            {subs.length === 0 && (
              <div className="rounded-xl bg-white p-6 shadow text-center text-gray-600">
                No sub-categories yet.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
