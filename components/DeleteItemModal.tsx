"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

export default function DeleteItemModal({
  open,
  onClose,
  item,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  item: { id: string; name: string } | null;
  onDeleted: () => void;
}) {
  const [adminPin, setAdminPin] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [byName, setByName] = useState("");
  const [byDate, setByDate] = useState(new Date().toISOString().slice(0, 10));

  if (!open || !item) return null;

  const handleDelete = async () => {
    setErr("");

    if (confirmText.trim() !== "DELETE") {
      setErr("Type DELETE to confirm.");
      return;
    }

    if (!byName.trim()) {
      setErr("Your name is required.");
      return;
    }

    if (!/^\d{6}$/.test(adminPin.trim())) {
      setErr("Admin PIN must be exactly 6 digits.");
      return;
    }

    setLoading(true);

    // ✅ NO client-side pin verification anymore.
    // ✅ Supabase RPC will be the ONLY source of truth.
    const { error } = await supabase.rpc("delete_item_with_pin", {
      p_item_id: item.id,
      p_pin: adminPin.trim(),
      p_changed_by_name: byName.trim(),
      p_changed_by_date: byDate,
    });

    if (error) {
      // Supabase will return: "Invalid admin PIN" if wrong
      setErr(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close modal" />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base sm:text-lg font-semibold text-red-600">Delete item</h2>

          <p className="mt-2 text-sm">
            You are about to delete:
            <br />
            <b>{item.name}</b>
          </p>

          <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>

          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold">
              Type <b>DELETE</b> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </div>

          <div>
            <NameDropdown value={byName} onChange={setByName} onlyRole="fulltimer" />
          </div>

          <div>
            <label className="block text-sm font-semibold">Date</label>
            <input
              type="date"
              value={byDate}
              onChange={(e) => setByDate(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Admin PIN (6 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Admin PIN"
            />
          </div>
        </div>

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
              disabled={loading}
              className="w-1/2 rounded-lg bg-red-600 px-3 py-2 text-white disabled:opacity-50"
              onClick={handleDelete}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
