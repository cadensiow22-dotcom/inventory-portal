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

    {err ? <p className="text-xs text-red-600 mt-1">{err}</p> : null}
    </div>
  );
}
