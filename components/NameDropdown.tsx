"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function NameDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // manage names
  const [manageOpen, setManageOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedToDelete, setSelectedToDelete] = useState("");

  async function loadNames() {
    setLoading(true);
    setErr("");

    const { data, error } = await supabase
      .from("staff_names")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
      setNames([]);
    } else {
      setNames((data ?? []).map((r: any) => r.name));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNames();
  }, []);

  async function addName() {
    setErr("");
    const n = newName.trim();
    if (!n) return setErr("Enter a name.");
    if (!/^\d{4}$/.test(pin.trim())) return setErr("PIN must be 4 digits.");

    const { error } = await supabase.rpc("add_staff_name_with_pin", {
      p_name: n,
      p_pin: pin.trim(),
    });

    if (error) return setErr(error.message);

    setNewName("");
    await loadNames();
  }

  async function deleteName() {
    setErr("");
    const n = selectedToDelete.trim();
    if (!n) return setErr("Select a name to delete.");
    if (!/^\d{4}$/.test(pin.trim())) return setErr("PIN must be 4 digits.");

    const { error } = await supabase.rpc("delete_staff_name_with_pin", {
      p_name: n,
      p_pin: pin.trim(),
    });

    if (error) return setErr(error.message);

    // if current selected name was deleted, clear it
    if (value === n) onChange("");
    setSelectedToDelete("");
    await loadNames();
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold mb-1">Your name</label>

      <div className="flex gap-2">
        <select
          className="w-full border p-2 rounded-md"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? "Loading names..." : "Select your name"}</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="border px-3 rounded-md"
          onClick={() => setManageOpen((v) => !v)}
        >
          Manage
        </button>
      </div>

      {err ? <p className="text-xs text-red-600 mt-1">{err}</p> : null}

      {manageOpen ? (
        <div className="mt-3 rounded-lg border p-3">
          <label className="block text-sm font-semibold">Admin PIN</label>
          <input
            type="password"
            inputMode="numeric"
            className="w-full border p-2 mt-1 mb-3 rounded-md"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4-digit PIN"
          />

          <div className="mb-3">
            <label className="block text-sm font-semibold">Add new name</label>
            <div className="flex gap-2 mt-1">
              <input
                className="w-full border p-2 rounded-md"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Caden"
              />
              <button type="button" className="bg-black text-white px-3 rounded-md" onClick={addName}>
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold">Delete name</label>
            <div className="flex gap-2 mt-1">
              <select
                className="w-full border p-2 rounded-md"
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
                type="button"
                className="border border-red-300 text-red-600 px-3 rounded-md"
                onClick={deleteName}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

    
    </div>
  );
}
