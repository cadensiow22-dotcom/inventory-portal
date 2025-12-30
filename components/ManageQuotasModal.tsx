"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subcat = { id: string; name: string };
type ItemRow = {
  id: string;
  name: string;
  stock_count: number;
  quota: number | null;
  quota_disabled: boolean;
};

export default function ManageQuotasModal({
  open,
  onClose,
  parentCategoryId,
  parentCategoryName,
}: {
  open: boolean;
  onClose: () => void;
  parentCategoryId: string;
  parentCategoryName?: string;
}) {
  const [ownerPin, setOwnerPin] = useState("");
  const [subcats, setSubcats] = useState<Subcat[]>([]);
  const [subcatId, setSubcatId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [disableQuota, setDisableQuota] = useState(false);
  const [quota, setQuota] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = useMemo(() => {
    const t = itemSearch.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => i.name.toLowerCase().includes(t));
  }, [items, itemSearch]);

  async function loadSubcats() {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name")
      .eq("parent_id", parentCategoryId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
      setSubcats([]);
      return;
    }
    setSubcats((data ?? []) as Subcat[]);
  }

  async function loadItems(subId: string) {
    const { data, error } = await supabase
      .from("items")
      .select("id,name,stock_count,quota,quota_disabled")
      .eq("subcategory_id", subId)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(500);

    if (error) {
      setErr(error.message);
      setItems([]);
      return;
    }
    setItems((data ?? []) as ItemRow[]);
  }

  useEffect(() => {
    if (!open) return;

    // reset on open
    setErr("");
    setOwnerPin("");
    setSubcatId("");
    setItems([]);
    setSelectedIds([]);
    setDisableQuota(false);
    setQuota("");
    setItemSearch("");

    loadSubcats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentCategoryId]);

  useEffect(() => {
    if (!open) return;
    if (!subcatId) return;

    setErr("");
    setSelectedIds([]);
    loadItems(subcatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcatId, open]);

  if (!open) return null;

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllFiltered() {
    const ids = filteredItems.map((i) => i.id);
    setSelectedIds(ids);
  }

  async function apply() {
    setErr("");
    const p = ownerPin.trim();

    if (!/^\d{4,8}$/.test(p)) return setErr("Owner PIN must be 4 to 8 digits.");
    if (!subcatId) return setErr("Select a subcategory first.");
    if (selectedIds.length === 0) return setErr("Select at least 1 item.");

    if (!disableQuota) {
      const q = Number(quota);
      if (!Number.isFinite(q) || q <= 0) return setErr("Add quota must be a positive number.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quotas/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerPin: p,
          itemIds: selectedIds,
          disable: disableQuota,
          quota: disableQuota ? null : Number(quota),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to update quotas");

      await loadItems(subcatId); // refresh
      setSelectedIds([]);
      setQuota("");
      setDisableQuota(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Manage Quotas{parentCategoryName ? ` — ${parentCategoryName}` : ""}
          </h2>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        {/* 1) Select subcategory */}
        <div className="rounded-lg border p-3">
          <div className="text-sm font-semibold mb-1">1) Select subcategory</div>
          <select
            className="w-full rounded-lg border p-2"
            value={subcatId}
            onChange={(e) => setSubcatId(e.target.value)}
          >
            <option value="">Select subcategory</option>
            {subcats.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2) Select items */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">2) Select items</div>
            <button
              type="button"
              className="text-xs rounded-lg border px-2 py-1 hover:bg-gray-50"
              onClick={selectAllFiltered}
              disabled={!subcatId || filteredItems.length === 0}
            >
              Select all (filtered)
            </button>
          </div>

          <input
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="mt-2 w-full rounded-lg border p-2 text-sm"
            placeholder="Search item name..."
            disabled={!subcatId}
          />

          <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
            {!subcatId ? (
              <div className="p-2 text-sm text-gray-500">Select a subcategory first.</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No items found.</div>
            ) : (
              filteredItems.map((it) => {
                const checked = selectedIds.includes(it.id);
                const quotaLabel =
                  it.quota == null ? "No quota" : `Quota: ${it.quota}`;
                const disabledLabel = it.quota_disabled ? " (Disabled)" : "";
                return (
                  <label
                    key={it.id}
                    className="flex items-center justify-between gap-2 border-b p-2 last:border-b-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(it.id)}
                      />
                      <div>
                        <div className="text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-gray-600">
                          Stock: {it.stock_count} • {quotaLabel}
                          <span className="text-gray-500">{disabledLabel}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Selected: <b>{selectedIds.length}</b>
          </div>
        </div>

        {/* 3) Owner pin */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="text-sm font-semibold mb-1">3) Owner PIN</div>
          <input
            type="password"
            inputMode="numeric"
            value={ownerPin}
            onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="w-full rounded-lg border p-2"
            placeholder="Owner PIN"
            autoComplete="off"
          />
        </div>

        {/* 4) Disable quota */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="text-sm font-semibold mb-2">4) Disable quota (for selected items)</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disableQuota}
              onChange={(e) => setDisableQuota(e.target.checked)}
            />
            Disable quota (item won’t appear in To Order list)
          </label>
        </div>

        {/* 5) Add quotas */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="text-sm font-semibold mb-1">5) Set New Quotas</div>
          <input
            value={quota}
            onChange={(e) => setQuota(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full rounded-lg border p-2"
            placeholder="e.g. 10"
            inputMode="numeric"
            disabled={disableQuota}
          />
          <p className="mt-2 text-xs text-gray-500">
            If the item already has a quota, this will overwrite it to match “Add quotas”.
          </p>
        </div>

        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

        <button
          disabled={loading}
          onClick={apply}
          className="mt-4 w-full rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Applying..." : disableQuota ? "Disable quota for selected" : "Set quota for selected"}
        </button>
      </div>
    </div>
  );
}
