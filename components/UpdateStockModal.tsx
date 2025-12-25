"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown"; 

type ItemRow = {
  id: string;
  name: string;
  stock_count: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: ItemRow | null;
  onSuccess: () => void;

  // NEW (optional, so nothing breaks elsewhere)
  openedFromBarcode?: boolean;
  barcodeText?: string;
  onUnlinked?: () => void;
};


export default function UpdateStockModal({
  open,
  onClose,
  item,
  onSuccess,
  openedFromBarcode = false,
  barcodeText = "",
  onUnlinked,
}: Props) {

  const [newStock, setNewStock] = useState<string>("");
  const [changedByName, setChangedByName] = useState<string>("");

  const [changedByDate, setChangedByDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [pin, setPin] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    if (!item) return false;
    if (newStock.trim() === "") return false;
    const n = Number(newStock);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return false;
    if (changedByName.trim().length < 2) return false;
    if (!changedByDate) return false;
    if (!/^\d{4,8}$/.test(pin)) return false;
    return true;
  }, [item, newStock, changedByName, changedByDate, pin]);

  useEffect(() => {
    if (open) {
      setNewStock(item ? String(item.stock_count) : "");
      setPin("");
      setNote("");
      setErrorMsg("");
    }
  }, [open, item]);

  if (!open || !item) return null;

  async function handleSubmit() {
    if (!item) {
  setErrorMsg("No item selected");
  return;
}

    setErrorMsg("");
    setLoading(true);
    try {
      const n = Number(newStock);

      const { error } = await supabase.rpc("update_stock_with_pin", {
        p_item_id: item.id,
        p_new_stock: n,
        p_changed_by_name: changedByName.trim(),
        p_changed_by_date: changedByDate,
        p_pin: pin,
        p_note: note.trim() === "" ? null : note.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      onClose();
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
    {/* IMPORTANT: keep backdrop click-to-close */}
    <button
      className="absolute inset-0"
      onClick={onClose}
      aria-label="Close modal backdrop"
    />

    <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header (sticky) */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base sm:text-lg font-semibold">Update stock</h2>
        <p className="text-sm text-gray-600">
          {item.name} • Current: <span className="font-medium">{item.stock_count}</span>
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
            <label className="block text-sm font-medium">New stock count</label>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="e.g. 12"
            />
          </div>

          <div>
          <NameDropdown
  value={changedByName}
  onChange={setChangedByName}
  onlyRole="fulltimer"
/>
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
            <label className="block text-sm font-medium">Owner's PIN</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              maxLength={8}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={pin}
              placeholder="••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Note (optional)</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Stock count verified"
            />
          </div>
        </div>

        {/* Barcode card stays in the scroll area (good if content is long) */}
        {openedFromBarcode && barcodeText?.trim() ? (
          <div className="mt-4 pointer-events-auto relative z-50 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-sm font-medium text-amber-900">Barcode linked</div>

            <div className="mt-1 break-all font-mono text-xs text-amber-800">
              {barcodeText}
            </div>

            <button
              type="button"
              className="pointer-events-auto relative z-50 mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              disabled={loading || changedByName.trim().length < 2 || !/^\d{4,8}$/.test(pin)}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const ok = confirm(`Unlink barcode ${barcodeText} from this item?`);
                if (!ok) return;

                setErrorMsg("");
                setLoading(true);
                try {
                  const { error } = await supabase.rpc("unlink_barcode_from_item_with_pin", {
                    p_barcode_text: barcodeText.trim(),
                    p_item_id: item.id,
                    p_changed_by_name: changedByName.trim(),
                    p_changed_by_date: changedByDate,
                    p_pin: pin,
                  });

                  if (error) {
                    setErrorMsg(error.message);
                    return;
                  }

                  onUnlinked?.();
                  onClose();
                } catch (e: any) {
                  setErrorMsg(e?.message ?? "Unlink failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Unlink this barcode
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer (sticky buttons always reachable) */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-3">
        <div className="flex gap-2">
          <button
            className="w-1/2 rounded-lg border px-3 py-2"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="w-1/2 rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
