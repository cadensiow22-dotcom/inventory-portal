"use client";

import { useEffect, useState } from "react";

type Row = {
  name: string | null;
  staff_uid: string | null;
  staff_role: string | null;
};

export default function ViewUidsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [ownerPin, setOwnerPin] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!open) return;

    // reset every time modal opens (so user must re-enter PIN)
    setOwnerPin("");
    setRows([]);
    setErr("");
    setVerified(false);
    setLoading(false);
  }, [open]);

  if (!open) return null;

  async function verifyAndLoad() {
    setErr("");
    setLoading(true);
    setVerified(false);
    setRows([]);

    const res = await fetch("/api/staff/uids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerPin }),
    });

    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setErr(json?.error ?? "Invalid owner PIN.");
      return;
    }

    setRows(json?.data ?? []);
    setVerified(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">View UIDs</h2>
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        {!verified && (
          <>
            <label className="block text-sm font-semibold">Owner PIN required</label>
            <input
              type="password"
              inputMode="numeric"
              value={ownerPin}
              onChange={(e) =>
                setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Enter owner PIN"
              autoComplete="off"
            />

            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

            <button
              onClick={verifyAndLoad}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
            >
              {loading ? "Checking..." : "Verify & View"}
            </button>
          </>
        )}

        {verified && (
          <div className="mt-3 max-h-80 overflow-auto rounded-lg border">
            {rows.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No staff found.</div>
            ) : (
              rows.map((r) => (
                <div key={r.staff_uid ?? `${r.name}`} className="border-b p-3 last:border-b-0">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="mt-1 text-xs text-gray-600">UID: {r.staff_uid}</div>
                  <div className="text-xs text-gray-500">Role: {r.staff_role}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
