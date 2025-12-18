"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

type Props = {
  open: boolean;
  onClose: () => void;
  barcodeText: string;
  onUnlinked: () => void;
};

export default function UnlinkBarcodeModal({ open, onClose, barcodeText, onUnlinked }: Props) {
  const [changedByName, setChangedByName] = useState("");
  const [changedByDate, setChangedByDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setPin("");
      setErrorMsg("");
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!barcodeText.trim()) return false;
    if (changedByName.trim().length < 2) return false;
    if (!changedByDate) return false;
    if (!/^\d{4}$/.test(pin)) return false;
    return true;
  }, [barcodeText, changedByName, changedByDate, pin]);

  async function handleUnlink() {
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.rpc("unlink_barcode_from_item_with_pin", {
        p_barcode_text: barcodeText.trim(),
        p_changed_by_name: changedByName.trim(),
        p_changed_by_date: changedByDate,
        p_pin: pin,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      onClose();
      onUnlinked();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close modal backdrop" />
      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold">Unlink barcode</h2>
        <p className="mt-1 text-sm text-gray-600 break-all">
          Barcode: <span className="font-mono">{barcodeText || "-"}</span>
        </p>

        {errorMsg ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
        ) : null}

        <div className="mt-3 space-y-3">
          <NameDropdown value={changedByName} onChange={setChangedByName} />

          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={changedByDate}
              onChange={(e) => setChangedByDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">4-digit PIN</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="w-1/2 rounded-lg border px-3 py-2" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="w-1/2 rounded-lg bg-red-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={handleUnlink}
            disabled={!canSubmit || loading}
          >
            {loading ? "Unlinking..." : "Unlink"}
          </button>
        </div>
      </div>
    </div>
  );
}

