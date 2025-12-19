"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

type ItemRow = {
  id: string;
  name: string;
  stock_count: number;
  search_text?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  barcodeText: string;              // scanned/entered barcode
  items: ItemRow[];                 // items from current subcategory list
  onLinked: () => void;             // callback after success
};

export default function LinkBarcodeModal({
  open,
  onClose,
  barcodeText,
  items,
  onLinked,
}: Props) {
  const [q, setQ] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const [changedByName, setChangedByName] = useState<string>("");
  const [changedByDate, setChangedByDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [pin, setPin] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (open) {
      setQ("");
      setSelectedItemId("");
      setPin("");
      setErrorMsg("");
    }
  }, [open, barcodeText]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => {
      const hay = `${it.name} ${it.search_text ?? ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [items, q]);

  const canSubmit = useMemo(() => {
    if (!open) return false;
    if (!barcodeText.trim()) return false;
    if (!selectedItemId) return false;
    if (changedByName.trim().length < 2) return false;
    if (!changedByDate) return false;
    if (!/^\d{4}$/.test(pin)) return false;
    return true;
  }, [open, barcodeText, selectedItemId, changedByName, changedByDate, pin]);

  async function handleLink() {
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.rpc("link_barcode_to_item_with_pin", {
        p_barcode_text: barcodeText.trim(),
        p_item_id: selectedItemId,
        p_changed_by_name: changedByName.trim(),
        p_changed_by_date: changedByDate,
        p_pin: pin,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      onClose();
      onLinked();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
    {/* Backdrop click */}
    <button
      className="absolute inset-0"
      onClick={onClose}
      aria-label="Close modal backdrop"
    />

    <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header (sticky) */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base sm:text-lg font-semibold">Link barcode to item</h2>
        <p className="text-sm text-gray-600 break-all mt-1">
          Barcode: <span className="font-mono">{barcodeText || "-"}</span>
        </p>

        {errorMsg ? (
          <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}
      </div>

      {/* Body (scrolls) */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Find item</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item name or tags..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Select item</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">-- Choose an item --</option>
              {filtered.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} (Stock: {it.stock_count})
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Showing {filtered.length} item(s)
            </p>
          </div>

          <div>
            <NameDropdown value={changedByName} onChange={setChangedByName} />
          </div>

          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={changedByDate}
              onChange={(e) => setChangedByDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">4-digit PIN</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </div>
        </div>
      </div>

      {/* Footer (sticky buttons always reachable) */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-3">
        <div className="flex gap-2">
          <button
            className="w-1/2 rounded-lg border px-3 py-2"
            onClick={onClose}
            disabled={loading || changedByName.trim() === ""}
          >
            Cancel
          </button>

          <button
            className="w-1/2 rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
            onClick={handleLink}
            disabled={!canSubmit || loading}
          >
            {loading ? "Linking..." : "Link"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
