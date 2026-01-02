"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

type ItemRow = {
  id: string;
  name: string;
  stock_count: number;
};

export default function PublicUpdateModal({
  open,
  onClose,
  item,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  item: ItemRow | null;
  onSuccess: () => void;
}) {
  const [changedByName, setChangedByName] = useState("");
  const [uid, setUid] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ LIMIT: max amount a public user can subtract per update
  const MAX_PUBLIC_DEDUCT = 20;

  const [updateDate, setUpdateDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  useEffect(() => {
    if (!open) return;

    setChangedByName("");
    setUid("");
    setQty("");
    setErr("");
    setLoading(false);

    // reset date to today whenever modal opens
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setUpdateDate(`${yyyy}-${mm}-${dd}`);
  }, [open]);

  if (!open || !item) return null;

  async function submit() {
    setErr("");

    const currentItem = item;
    if (!currentItem) return setErr("No item selected.");

    const name = changedByName.trim();
    const staffUid = uid.trim();
    const qtyUsed = Number(qty);

    // ✅ VALIDATION (before calling database)
    if (!name) return setErr("Name is required.");
    if (!staffUid) return setErr("UID is required.");
    if (!Number.isFinite(qtyUsed) || qtyUsed <= 0) return setErr("Quantity must be more than 0.");
    if (!updateDate) return setErr("Date is required.");

    // ✅ LIMIT CHECK
    if (qtyUsed > MAX_PUBLIC_DEDUCT) {
      return setErr(`You can only subtract up to ${MAX_PUBLIC_DEDUCT} at a time.`);
    }

    // ✅ DO NOT ALLOW NEGATIVE STOCK
    if (qtyUsed > currentItem.stock_count) {
      return setErr(`You cannot subtract ${qtyUsed}. Only ${currentItem.stock_count} in stock.`);
    }

    setLoading(true);

    const { error } = await supabase.rpc("consume_stock_with_uid", {
      p_item_id: currentItem.id,
      p_qty_used: qtyUsed,
      p_changed_by_name: name,
      p_staff_uid: staffUid,
      p_changed_by_date: updateDate,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Update (Subtract Stock)</h2>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <div className="font-semibold">{item.name}</div>
          <div className="text-gray-600">
            Current stock: <span className="font-semibold">{item.stock_count}</span>
          </div>
          <div className="text-gray-600">
            Max subtract per update: <span className="font-semibold">{MAX_PUBLIC_DEDUCT}</span>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <NameDropdown value={changedByName} onChange={setChangedByName} label="Your name" />

          <div>
            <label className="block text-sm font-semibold">UID</label>
            <input
              value={uid}
              onChange={(e) => setUid(e.target.value.trim())}
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Enter your UID (must match your name)"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Quantity (to subtract)</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-lg border p-2"
              placeholder={`e.g. 10 (max ${MAX_PUBLIC_DEDUCT})`}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Date</label>
            <input
              type="date"
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </div>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}

          <button
            disabled={loading}
            onClick={submit}
            className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update"}
          </button>

          <p className="text-xs text-gray-500">
            This will subtract from stock. No adding, deleting, linking or unlinking is allowed in Admin OFF.
          </p>
        </div>
      </div>
    </div>
  );
}
