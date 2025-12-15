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

useEffect(() => {
  if (!open) return;

  // Reset fields every time modal opens
  setCurrentPin("");
  setNewPin("");
  setByName("");
  setByDate(new Date().toISOString().slice(0, 10));
  setErr("");
}, [open]);

  if (!open) return null;

  async function submit() {
    setErr("");
    setLoading(true);

    const { error } = await supabase.rpc("change_admin_pin", {
      p_current_pin: currentPin,
      p_new_pin: newPin,
      p_changed_by_name: byName,
      p_changed_by_date: byDate,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    alert("PIN changed successfully");
    onClose();
    setLoading(false);

    alert("PIN changed successfully");

// clear fields
setCurrentPin("");
setNewPin("");
setByName("");
setByDate(new Date().toISOString().slice(0, 10));
setErr("");

onClose();
setLoading(false);

  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md">
        <h2 className="text-lg font-bold mb-3">Change Admin PIN</h2>

        {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

        <input
          placeholder="Current 4-digit PIN"
          className="w-full border p-2 mb-2"
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />

        <input
          placeholder="New 4-digit PIN"
          className="w-full border p-2 mb-2"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />

        <NameDropdown value={byName} onChange={setByName} />
        <input
          type="date"
          className="w-full border p-2 mb-4"
          value={byDate}
          onChange={(e) => setByDate(e.target.value)}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="border px-4 py-2 w-1/2">
            Cancel
          </button>
         <button
  onClick={submit}
  disabled={loading || byName.trim() === ""}
  className={`px-4 py-2 w-1/2 ${
    byName.trim() === ""
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-black text-white"
  }`}
>
  {loading ? "Changing…" : "Change"}
</button>

        </div>
      </div>
    </div>
  );
}
