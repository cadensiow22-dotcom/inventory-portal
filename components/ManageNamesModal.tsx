"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ManageNamesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [names, setNames] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedToDelete, setSelectedToDelete] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  async function loadNames() {
    const { data, error } = await supabase
      .from("staff_names")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
      setNames([]);
      return;
    }
    setNames((data ?? []).map((r: any) => r.name));
  }

  useEffect(() => {
    loadNames();
  }, [open]);

  async function addName() {
    setErr("");
    const n = newName.trim();
    const p = pin.trim();

    if (!/^\d{4}$/.test(p)) return setErr("PIN must be 4 digits.");
    if (!n) return setErr("Enter a name.");

    setLoading(true);
    const { error } = await supabase.rpc("add_staff_name_with_pin", {
      p_name: n,
      p_pin: p,
    });
    setLoading(false);

    if (error) return setErr(error.message);

    setNewName("");
    await loadNames();
  }

  async function deleteName() {
    setErr("");
    const n = selectedToDelete.trim();
    const p = pin.trim();

    if (!/^\d{4}$/.test(p)) return setErr("PIN must be 4 digits.");
    if (!n) return setErr("Select a name to delete.");

    setLoading(true);
    const { error } = await supabase.rpc("delete_staff_name_with_pin", {
      p_name: n,
      p_pin: p,
    });
    setLoading(false);

    if (error) return setErr(error.message);

    setSelectedToDelete("");
    await loadNames();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Manage Names</h2>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="block text-sm font-semibold">Admin PIN</label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="4-digit PIN"
        />

        {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

        <div className="mt-4 rounded-lg border p-3">
          <div className="text-sm font-semibold mb-2">Add new name</div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border p-2"
              placeholder="e.g. Caden"
            />
            <button
              disabled={loading}
              onClick={addName}
              className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border p-3">
          <div className="text-sm font-semibold mb-2">Delete name</div>
          <div className="flex gap-2">
            <select
              className="w-full rounded-lg border p-2"
              value={selectedToDelete}
              onChange={(e) => setSelectedToDelete(e.target.value)}
            >
              <option value="">Select name</option>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button
              disabled={loading}
              onClick={deleteName}
              className="rounded-lg border border-red-300 px-3 py-2 text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Names are used in logs (Update Stock / Add Item / Change PIN).
        </p>
      </div>
    </div>
  );
}
