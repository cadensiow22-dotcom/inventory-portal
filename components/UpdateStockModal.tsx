"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
};

export default function UpdateStockModal({ open, onClose, item, onSuccess }: Props) {
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
    if (!/^\d{4}$/.test(pin)) return false;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Update stock</h2>
          <p className="text-sm text-gray-600">
            {item.name} • Current: <span className="font-medium">{item.stock_count}</span>
          </p>
        </div>

        {errorMsg ? (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

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
            <label className="block text-sm font-medium">Your name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={changedByName}
              onChange={(e) => setChangedByName(e.target.value)}
              placeholder="e.g. Caden"
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

        <div className="mt-4 flex gap-2">
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
  );
}
