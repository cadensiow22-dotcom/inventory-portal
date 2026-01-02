"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
};

type ItemRow = {
  id: string;
  name: string;
  stock_count: number;
  quota: number | null;
  quota_disabled: boolean;
  subcategory_id: string;
  subcategory_name?: string;
};

export default function StockTakePage() {
  const router = useRouter();

  const [parents, setParents] = useState<Category[]>([]);
  const [parentId, setParentId] = useState<string>("");

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Load parent categories + add "All"
  useEffect(() => {
    const loadParents = async () => {
      setLoadingParents(true);
      setErr(null);

      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("name");

      if (error) setErr(error.message);

      const list = (data ?? []) as Category[];
      setParents([{ id: "__ALL__", name: "All" }, ...list]);
      setLoadingParents(false);
    };

    loadParents();
  }, []);

  // When category changes, load items (either that category, or ALL)
  useEffect(() => {
    const loadItems = async () => {
      if (!parentId) {
        setItems([]);
        return;
      }

      setLoadingItems(true);
      setErr(null);

      // ✅ ALL: fetch every active subcategory for mapping + every active item
      if (parentId === "__ALL__") {
        const { data: subs, error: subErr } = await supabase
          .from("categories")
          .select("id,name")
          .not("parent_id", "is", null)
          .eq("is_active", true);

        if (subErr) {
          setErr(subErr.message);
          setItems([]);
          setLoadingItems(false);
          return;
        }

        const subNameMap = new Map<string, string>();
        for (const s of subs ?? []) subNameMap.set(s.id, s.name);

        const { data: itemData, error: itemErr } = await supabase
          .from("items")
          .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
          .eq("is_active", true)
          .order("name")
          .limit(5000);

        if (itemErr) {
          setErr(itemErr.message);
          setItems([]);
          setLoadingItems(false);
          return;
        }

        const enriched = (itemData ?? []).map((it: any) => ({
          id: it.id,
          name: it.name,
          stock_count: it.stock_count,
          quota: it.quota,
          quota_disabled: it.quota_disabled,
          subcategory_id: it.subcategory_id,
          subcategory_name: subNameMap.get(it.subcategory_id) ?? "Unknown",
        })) as ItemRow[];

        setItems(enriched);
        setLoadingItems(false);
        return;
      }

      // ✅ Normal category: load its subcategories then its items
      const { data: subData, error: subErr } = await supabase
        .from("categories")
        .select("id,name")
        .eq("parent_id", parentId)
        .eq("is_active", true)
        .order("name");

      if (subErr) {
        setErr(subErr.message);
        setItems([]);
        setLoadingItems(false);
        return;
      }

      const subs = (subData ?? []) as Category[];
      const subIds = subs.map((s) => s.id);

      if (subIds.length === 0) {
        setItems([]);
        setLoadingItems(false);
        return;
      }

      const subNameMap = new Map<string, string>();
      for (const s of subs) subNameMap.set(s.id, s.name);

      const { data: itemData, error: itemErr } = await supabase
        .from("items")
        .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
        .in("subcategory_id", subIds)
        .eq("is_active", true)
        .order("name")
        .limit(2000);

      if (itemErr) {
        setErr(itemErr.message);
        setItems([]);
        setLoadingItems(false);
        return;
      }

      const enriched = (itemData ?? []).map((it: any) => ({
        id: it.id,
        name: it.name,
        stock_count: it.stock_count,
        quota: it.quota,
        quota_disabled: it.quota_disabled,
        subcategory_id: it.subcategory_id,
        subcategory_name: subNameMap.get(it.subcategory_id) ?? "Unknown",
      })) as ItemRow[];

      setItems(enriched);
      setLoadingItems(false);
    };

    loadItems();
  }, [parentId]);

  const selectedParentName = useMemo(() => {
    if (parentId === "__ALL__") return "All";
    return parents.find((p) => p.id === parentId)?.name ?? "";
  }, [parents, parentId]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Top bar with To Order button */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back
          </Link>

          {/* ✅ RESTORED: To Order button (requires owner pin & pushes selection) */}
          <button
            className="rounded-lg border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={!parentId || loadingItems}
            onClick={async () => {
  if (!parentId) return;

  const ownerPin = prompt("Enter Owner PIN to add items to To Order:");
  if (!ownerPin) return;

  setErr(null);
  setMsg(null);

  // ✅ If ALL selected -> push all below quota items
  if (parentId === "__ALL__") {
    const res = await fetch("/api/to-order/push-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerPin }),
    });

    const json = await res.json();

    if (!res.ok) {
      setErr(json?.error ?? "Failed to add ALL to To Order");
      return;
    }

    setMsg(
      json.added === 0
        ? "No items below quota across all categories."
        : `Added ${json.added} item(s) below quota across ALL categories. Order date: ${json.order_date}`
    );

    router.push("/to-order");
    return;
  }

  // ✅ Normal single category push
  const res = await fetch("/api/to-order/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerPin, parentCategoryId: parentId }),
  });

  const json = await res.json();

  if (!res.ok) {
    setErr(json?.error ?? "Failed to add to To Order");
    return;
  }

  setMsg(
    json.added === 0
      ? "No items below quota for this category."
      : `Added ${json.added} item(s) below quota. Order date: ${json.order_date}`
  );

  router.push("/to-order");
}}

          >
            🛒 To Order
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Stock Take</h1>
        <p className="text-gray-600 mb-6">
          Select a category (or All) → view items with stock & quota.
        </p>

        {err && (
          <div className="mb-4 rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-red-600">Error</p>
            <p className="text-sm text-gray-700 mt-1">{err}</p>
          </div>
        )}

        {msg && (
          <div className="mb-4 rounded-xl bg-white p-4 shadow">
            <p className="text-sm font-semibold text-green-700">{msg}</p>
          </div>
        )}

        <div className="rounded-xl bg-white p-4 shadow mb-6">
          <label className="block text-sm font-semibold mb-1">
            Select Category
          </label>

          {loadingParents ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">-- Choose a category --</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              {selectedParentName ? (
                <>
                  Category:{" "}
                  <span className="font-semibold">{selectedParentName}</span>
                </>
              ) : (
                "Select a category to view items."
              )}
            </p>
          </div>

          {loadingItems && (
            <p className="text-sm text-gray-500">Loading items...</p>
          )}

          {!loadingItems && parentId && items.length === 0 && (
            <p className="text-sm text-gray-500">
              No items found for this selection.
            </p>
          )}

          {!loadingItems && items.length > 0 && (
            <div className="space-y-3">
              {items.map((it) => {
                const quotaEnabled = !it.quota_disabled && it.quota !== null;
                const belowQuota =
                  quotaEnabled && it.stock_count < (it.quota as number);
                const quotaText = quotaEnabled ? String(it.quota) : "—";

                return (
                  <div
                    key={it.id}
                    className={`rounded-lg border p-3 ${
                      belowQuota ? "bg-red-50 border-red-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold">{it.name}</div>

                      <div className="text-xs text-gray-600">
                        Subcategory:{" "}
                        <span className="font-medium">
                          {it.subcategory_name ?? "Unknown"}
                        </span>
                      </div>

                      <div className="text-sm text-gray-700">
                        Stock:{" "}
                        <span
                          className={`font-bold ${
                            belowQuota ? "text-red-600" : ""
                          }`}
                        >
                          {it.stock_count}
                        </span>
                        {"  "} / Quota:{" "}
                        <span className="font-semibold">{quotaText}</span>

                        {belowQuota && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Below quota
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
