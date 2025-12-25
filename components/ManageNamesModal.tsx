"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type StaffRole = "fulltimer" | "parttimer" | "intern";

type StaffRow = {
  name: string | null;
  staff_uid: string | null;
  staff_role: StaffRole | null;
};

export default function ManageNamesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [ownerPin, setOwnerPin] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<StaffRole>("intern");
  const [selectedToDelete, setSelectedToDelete] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadNames() {
    const { data, error } = await supabase
      .from("staff_names")
      .select("name, staff_uid, staff_role")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setErr(error.message);
      setRows([]);
      return;
    }

    setRows((data ?? []) as StaffRow[]);
  }

  useEffect(() => {
    if (!open) return;

    setErr("");
    setOwnerPin("");
    setNewName("");
    setNewRole("intern");
    setSelectedToDelete("");

    loadNames();
  }, [open]);

  if (!open) return null;

  function roleLabel(r: StaffRole) {
    if (r === "fulltimer") return "Full-timer";
    if (r === "parttimer") return "Part-timer";
    return "Intern";
  }

  async function addName() {
    setErr("");
    setLoading(true);

    const n = newName.trim();
    const p = ownerPin.trim();
    if (!p) {
      setLoading(false);
      return setErr("Owner PIN is required.");
    }
    if (!n) {
      setLoading(false);
      return setErr("Name is required.");
    }

    // Keep existing flow: use your existing RPC to insert the staff name
    const { error: rpcErr } = await supabase.rpc("add_staff_name_with_owner_pin", {
      p_name: n,
      p_owner_pin: p,
    });

    if (rpcErr) {
      setLoading(false);
      return setErr(rpcErr.message);
    }

    // NEW: assign role after insert (does NOT change your RPC)
    const { error: roleErr } = await supabase
      .from("staff_names")
      .update({ staff_role: newRole })
      .eq("name", n)
      .eq("is_active", true);

    setLoading(false);

    if (roleErr) return setErr(roleErr.message);

    setNewName("");
    setNewRole("intern");
    await loadNames();
  }

  async function deleteName() {
    setErr("");
    setLoading(true);

    const n = selectedToDelete.trim();
    const p = ownerPin.trim();
    if (!p) {
      setLoading(false);
      return setErr("Owner PIN is required.");
    }
    if (!n) {
      setLoading(false);
      return setErr("Select a name to delete.");
    }

    const { error } = await supabase.rpc("delete_staff_name_with_owner_pin", {
      p_name: n,
      p_owner_pin: p,
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

        <label className="block text-sm font-semibold">
          Owner PIN (full-timers only)
        </label>
        <input
          type="password"
          inputMode="numeric"
          value={ownerPin}
          onChange={(e) =>
            setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="Owner PIN"
          autoComplete="off"
        />

        {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

        {/* CURRENT ACTIVE NAMES LIST */}
        <div className="mt-4 rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Current active names</div>
          <div className="max-h-40 overflow-auto rounded-lg border">
            {rows.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No names found.</div>
            ) : (
              rows
                .filter((r) => r.name)
                .map((r) => (
                  <div
                    key={`${r.name}-${r.staff_uid ?? "noid"}`}
                    className="flex items-center justify-between gap-2 border-b p-2 last:border-b-0"
                  >
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-gray-600">
                      {roleLabel((r.staff_role ?? "intern") as StaffRole)}
                    </div>
                  </div>
                ))
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            IDs exist in the system but are hidden from dropdowns.
          </p>
        </div>

        {/* ADD NAME */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Add new name</div>

          <label className="block text-xs font-semibold">Role</label>
          <select
            className="mt-1 w-full rounded-lg border p-2"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as StaffRole)}
          >
            <option value="fulltimer">Full-timer</option>
            <option value="parttimer">Part-timer</option>
            <option value="intern">Intern</option>
          </select>

          <div className="mt-2 flex gap-2">
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

          <p className="mt-2 text-xs text-gray-500">
            The role is used later to allow “full-timer only” actions.
          </p>
        </div>

        {/* DELETE NAME */}
        <div className="mt-3 rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Delete name</div>
          <div className="flex gap-2">
            <select
              className="w-full rounded-lg border p-2"
              value={selectedToDelete}
              onChange={(e) => setSelectedToDelete(e.target.value)}
            >
              <option value="">Select name</option>
              {rows
                .filter((r) => r.name)
                .map((r) => {
                  const n = r.name as string;
                  return (
                    <option key={`${n}-${r.staff_uid ?? "noid"}`} value={n}>
                      {n}
                    </option>
                  );
                })}
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
          Names are still used in logs (Update Stock / Add Item / Change PIN).
        </p>
      </div>
    </div>
  );
}
