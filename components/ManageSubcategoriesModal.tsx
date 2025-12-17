"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Subcat = {
  id: string;
  name: string;
};

export default function ManageSubcategoriesModal({
  open,
  onClose,
  parentCategoryId,
  parentCategoryName,
}: {
  open: boolean;
  onClose: () => void;
  parentCategoryId: string;
  parentCategoryName?: string;
}) {
  const [ownerPin, setOwnerPin] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [subcats, setSubcats] = useState<Subcat[]>([]);
  const [selectedSubcatId, setSelectedSubcatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadSubcats() {
    setErr("");
    const { data, error } = await supabase
      .from("categories")
      .select("id,name")
      .eq("parent_id", parentCategoryId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
      setSubcats([]);
      return;
    }

    setSubcats((data ?? []) as Subcat[]);
  }

  useEffect(() => {
    if (!open) return;

    // reset fields on open
    setErr("");
    setOwnerPin("");
    setNewSubcatName("");
    setSelectedSubcatId("");

    loadSubcats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentCategoryId]);

  if (!open) return null;

  async function addSubcategory() {
    setErr("");
    const p = ownerPin.trim();
    const n = newSubcatName.trim();

    if (!/^\d{4,8}$/.test(p)) return setErr("Owner PIN must be 4 to 8 digits.");
    if (!n) return setErr("Enter a subcategory name.");

    setLoading(true);
    const { error } = await supabase.rpc("add_subcategory_with_owner_pin", {
      p_parent_id: parentCategoryId,
      p_name: n,
      p_owner_pin: p,
    });
    setLoading(false);

    if (error) return setErr(error.message);

    setNewSubcatName("");
    await loadSubcats();
  }

  async function removeSubcategory() {
    setErr("");
    const p = ownerPin.trim();
    const subId = selectedSubcatId.trim();

    if (!/^\d{4,8}$/.test(p)) return setErr("Owner PIN must be 4 to 8 digits.");
    if (!subId) return setErr("Select a subcategory to remove.");

    setLoading(true);
    const { error } = await supabase.rpc("deactivate_subcategory_with_owner_pin", {
      p_subcategory_id: subId,
      p_owner_pin: p,
    });
    setLoading(false);

    if (error) return setErr(error.message);

    setSelectedSubcatId("");
    await loadSubcats();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Manage Subcategories{parentCategoryName ? ` — ${parentCategoryName}` : ""}
          </h2>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="block text-sm font-semibold">Owner PIN (full-timers only)</label>
        <input
          type="password"
          inputMode="numeric"
          value={ownerPin}
          onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="Owner PIN"
        />

        {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

        <div className="mt-4 rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Add new subcategory</div>
          <div className="flex gap-2">
            <input
              value={newSubcatName}
              onChange={(e) => setNewSubcatName(e.target.value)}
              className="w-full rounded-lg border p-2"
              placeholder="e.g. RCCB / Fluorescent Lamps"
            />
            <button
              disabled={loading}
              onClick={addSubcategory}
              className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Remove subcategory (soft remove)</div>
          <div className="flex gap-2">
            <select
              className="w-full rounded-lg border p-2"
              value={selectedSubcatId}
              onChange={(e) => setSelectedSubcatId(e.target.value)}
            >
              <option value="">Select subcategory</option>
              {subcats.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              disabled={loading}
              onClick={removeSubcategory}
              className="rounded-lg border border-red-300 px-3 py-2 text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Removal is safe (soft). If the subcategory still has active items, the backend will block it.
          </p>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Current subcategories: <b>{subcats.length}</b>
        </div>
      </div>
    </div>
  );
}
