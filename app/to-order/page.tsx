"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Row = {
  item_id: string;
  item_name: string;
  stock_count: number;
  quota: number;

  subcategory_id: string;
  subcategory_name: string;

  parent_category_id: string;
  parent_category_name: string;
};

export default function ToOrderPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("to_order_items")
        .select(
          "item_id,item_name,stock_count,quota,subcategory_id,subcategory_name,parent_category_id,parent_category_name"
        )
        .order("parent_category_name", { ascending: true })
        .order("subcategory_name", { ascending: true })
        .order("item_name", { ascending: true });

      if (error) setErr(error.message);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const hay = `${r.parent_category_name} ${r.subcategory_name} ${r.item_name}`.toLowerCase();
      return hay.includes(t);
    });
  }, [rows, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of filtered) {
      const key = r.parent_category_name;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold">To Order</h1>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <label className="text-sm font-semibold">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-2 w-full rounded-lg border p-2"
            placeholder="Search category / subcategory / item..."
          />
        </div>

        {loading && <p className="mt-4">Loading...</p>}

        {err && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-red-600">Error</p>
            <p className="text-sm text-gray-700 mt-1">{err}</p>
          </div>
        )}

        {!loading && !err && grouped.length === 0 && (
          <div className="mt-4 rounded-xl bg-white p-6 shadow text-center text-gray-600">
            Nothing to order 🎉 (No items are below quota)
          </div>
        )}

        {!loading && !err && grouped.length > 0 && (
          <div className="mt-4 space-y-4">
            {grouped.map(([catName, list]) => (
              <div key={catName} className="rounded-xl bg-white p-4 shadow">
                <h2 className="text-lg font-bold mb-3">{catName}</h2>

                <div className="space-y-2">
                  {list.map((r) => (
                    <div
                      key={r.item_id}
                      className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold">{r.item_name}</div>
                        <div className="text-xs text-gray-500">
                          {r.subcategory_name}
                        </div>
                      </div>

                      <div className="text-sm">
                        Stock:{" "}
                        <span className="font-bold text-red-600">
                          {r.stock_count}
                        </span>{" "}
                        / Quota: <span className="font-semibold">{r.quota}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
