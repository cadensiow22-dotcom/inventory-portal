"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sendPdfToAssignedEmail } from "@/lib/sendPdfToEmail";

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
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load parent categories
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

  // Load items when category changes
  useEffect(() => {
    const loadItems = async () => {
      if (!parentId) {
        setItems([]);
        return;
      }

      setLoadingItems(true);
      setErr(null);

      // ALL
      if (parentId === "__ALL__") {
        const { data: subs } = await supabase
          .from("categories")
          .select("id,name")
          .not("parent_id", "is", null)
          .eq("is_active", true);

        const subNameMap = new Map<string, string>();
        for (const s of subs ?? []) subNameMap.set(s.id, s.name);

        const { data, error } = await supabase
          .from("items")
          .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
          .eq("is_active", true)
          .order("name")
          .limit(5000);

        if (error) {
          setErr(error.message);
          setItems([]);
        } else {
          setItems(
            (data ?? []).map((it: any) => ({
              ...it,
              subcategory_name:
                subNameMap.get(it.subcategory_id) ?? "Unknown",
            }))
          );
        }

        setLoadingItems(false);
        return;
      }

      // Single category
      const { data: subs } = await supabase
        .from("categories")
        .select("id,name")
        .eq("parent_id", parentId)
        .eq("is_active", true);

      const subIds = (subs ?? []).map((s) => s.id);
      const subNameMap = new Map<string, string>();
      for (const s of subs ?? []) subNameMap.set(s.id, s.name);

      if (subIds.length === 0) {
        setItems([]);
        setLoadingItems(false);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("id,name,stock_count,quota,quota_disabled,subcategory_id")
        .in("subcategory_id", subIds)
        .eq("is_active", true)
        .order("name")
        .limit(5000);

      if (error) {
        setErr(error.message);
        setItems([]);
      } else {
        setItems(
          (data ?? []).map((it: any) => ({
            ...it,
            subcategory_name:
              subNameMap.get(it.subcategory_id) ?? "Unknown",
          }))
        );
      }

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
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back
          </Link>

          <div className="flex gap-2">
            <button
              className="rounded-lg border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
              disabled={!parentId || loadingItems}
              onClick={async () => {
                if (!parentId) return;

                const ownerPin = prompt(
                  "Enter Owner PIN to add items to To Order:"
                );
                if (!ownerPin) return;

                setErr(null);
                setMsg(null);

                const res =
                  parentId === "__ALL__"
                    ? await fetch("/api/to-order/push-all", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ownerPin }),
                      })
                    : await fetch("/api/to-order/push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ownerPin,
                          parentCategoryId: parentId,
                        }),
                      });

                const json = await res.json();
                if (!res.ok) {
                  setErr(json?.error ?? "Failed to add to To Order");
                  return;
                }

                setMsg("Items added to To Order.");
                router.push("/to-order");
              }}
            >
              🛒 To Order
            </button>

           <button
  className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
  disabled={pdfLoading || !parentId}
  onClick={async () => {
    try {
      if (!parentId) return;

      setPdfLoading(true);
      setErr(null);
      setMsg(null);

      const res = await fetch(
        `/api/stock-take/pdf?categoryId=${encodeURIComponent(parentId)}`
      );

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Failed to generate PDF");
      }

      const blob = await res.blob();
      const filename = `stocktake-${selectedParentName || "unknown"}.pdf`;

      const choice = prompt(
        "Type 1 to DOWNLOAD\nType 2 to SEND to assigned Email\n\nEnter 1 or 2:"
      );

      // OPTION 1 — DOWNLOAD (same behavior as before)
      if (!choice || choice.trim() === "1") {
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        setMsg("PDF downloaded.");
        return;
      }

      // OPTION 2 — SEND TO GMAIL
      if (choice.trim() === "2") {
        await sendPdfToAssignedEmail({
          blob,
          filename,
          subject: `Stock Take PDF - ${selectedParentName || "All"}`,
          message: "Attached is the Stock Take PDF from Inventory Portal.",
        });

        setMsg("PDF sent to assigned Email.");
        return;
      }

      setMsg("Cancelled.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  }}
>
              {pdfLoading ? "Converting..." : "Convert to PDF"}
            </button>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Stock Take</h1>
        <p className="mb-6 text-gray-600">
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

        <div className="mb-6 rounded-xl bg-white p-4 shadow">
          <label className="mb-1 block text-sm font-semibold">
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
          {!loadingItems && items.length === 0 && parentId && (
            <p className="text-sm text-gray-500">
              No items found for this selection.
            </p>
          )}

          {!loadingItems &&
            items.map((it) => {
              const quotaEnabled =
                !it.quota_disabled && it.quota !== null;
              const belowQuota =
                quotaEnabled &&
                it.stock_count < (it.quota as number);

              return (
                <div
                  key={it.id}
                  className={`mb-3 rounded-lg border p-3 ${
                    belowQuota
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-gray-600">
                    Subcategory: {it.subcategory_name ?? "Unknown"}
                  </div>
                  <div className="text-sm">
                    Stock:{" "}
                    <span
                      className={`font-bold ${
                        belowQuota ? "text-red-600" : ""
                      }`}
                    >
                      {it.stock_count}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}
