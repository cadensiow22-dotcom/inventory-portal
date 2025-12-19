"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useEffect} from "react";
import NameDropdown from "./NameDropdown";

export default function ChangePinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [byName, setByName] = useState("");
  const [byDate, setByDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ownerPin, setOwnerPin] = useState("");

useEffect(() => {
  if (!open) return;

  // Reset fields every time modal opens
  setCurrentPin("");
  setNewPin("");
  setByName("");
  setByDate(new Date().toISOString().slice(0, 10));
  setErr("");
  setOwnerPin("");

}, [open]);

  if (!open) return null;

async function submit() {
  setErr("");
  setLoading(true);

  const { error } = await supabase.rpc("change_admin_pin", {
    p_current_pin: currentPin,
    p_new_pin: newPin,
    p_owner_pin: ownerPin,
    p_changed_by_name: byName,
    p_changed_by_date: byDate,
  });

  if (error) {
    setErr(error.message);
    setLoading(false);
    return;
  }

  alert("PIN changed successfully");

  // clear fields
  setCurrentPin("");
  setNewPin("");
  setOwnerPin("");
  setByName("");
  setByDate(new Date().toISOString().slice(0, 10));
  setErr("");

  setLoading(false);
  onClose();
}


  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
    {/* Backdrop click to close */}
    <button
      className="absolute inset-0"
      onClick={onClose}
      aria-label="Close modal backdrop"
    />

    <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header (sticky) */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base sm:text-lg font-semibold">Change Admin PIN</h2>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </div>

      {/* Body (scrolls) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div>
          <label className="block text-sm font-medium">
            Owner PIN (full-timers only)
          </label>
          <input
            placeholder="Owner PIN (full-timers only)"
            className="mt-1 w-full border rounded-lg p-2"
            value={ownerPin}
            onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Current 4-digit PIN</label>
          <input
            placeholder="Current 4-digit PIN"
            className="mt-1 w-full border rounded-lg p-2"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">New 4-digit PIN</label>
          <input
            placeholder="New 4-digit PIN"
            className="mt-1 w-full border rounded-lg p-2"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>

        <div className="pt-1">
          <NameDropdown value={byName} onChange={setByName} />
        </div>

        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            className="mt-1 w-full border rounded-lg p-2"
            value={byDate}
            onChange={(e) => setByDate(e.target.value)}
          />
        </div>
      </div>

      {/* Footer (sticky buttons always reachable) */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="border rounded-lg px-4 py-2 w-1/2"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={
              loading ||
              byName.trim() === "" ||
              ownerPin.trim() === "" ||
              currentPin.length !== 4 ||
              newPin.length !== 4
            }
            className={`rounded-lg px-4 py-2 w-1/2 ${
              loading || byName.trim() === "" || ownerPin.trim() === "" || currentPin.length !== 4 || newPin.length !== 4
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white"
            }`}
          >
            {loading ? "Changing…" : "Change"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
