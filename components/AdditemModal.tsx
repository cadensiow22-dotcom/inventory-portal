"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  subcategoryId: string;
  onSuccess: () => void;
  prefillBarcode?: string;
};

export default function AddItemModal({
  open,
  onClose,
  subcategoryId,
  onSuccess,
  prefillBarcode,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [searchText, setSearchText] = useState("");

  // ✅ ADMIN PIN ONLY
  const [adminPin, setAdminPin] = useState("");

  const [byName, setByName] = useState("");
  const [byDate, setByDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [barcodeText, setBarcodeText] = useState(prefillBarcode ?? "");
  const openedWithPrefill = useRef(false);

  useEffect(() => {
    if (!open) return;

    const pre = (prefillBarcode ?? "").trim();
    openedWithPrefill.current = pre.length > 0;

    setBarcodeText(pre);

    setName("");
    setStock("0");
    setSearchText("");
    setAdminPin("");
    setByName("");
    setByDate(new Date().toISOString().slice(0, 10));

    setError("");
    setLoading(false);
  }, [open, prefillBarcode]);

  if (!open) return null;

  const trimmedBarcode = (barcodeText || "").trim();
  const isBarcodeFlow = openedWithPrefill.current && trimmedBarcode.length > 0;

  async function submit() {
    setError("");
    setLoading(true);

    const n = name.trim();
    const tags = searchText.trim();
    const who = byName.trim();
    const date = byDate;
    const stockNum = Number(stock);
    const ap = adminPin.trim();

    if (!n) {
      setError("Item name is required.");
      setLoading(false);
      return;
    }
    if (!tags) {
      setError("Tags are required.");
      setLoading(false);
      return;
    }
    if (!who) {
      setError("Your name is required.");
      setLoading(false);
      return;
    }
    if (!stock.trim() || Number.isNaN(stockNum)) {
      setError("Initial stock is required.");
      setLoading(false);
      return;
    }
    if (!date) {
      setError("Date is required.");
      setLoading(false);
      return;
    }

    // ✅ ALWAYS ADMIN PIN
    if (!/^\d{6}$/.test(ap)) {
      setError("Admin PIN must be exactly 6 digits.");
      setLoading(false);
      return;
    }

    const rpcName = isBarcodeFlow
      ? "add_item_and_link_barcode_with_pin"
      : "add_item_with_pin";

    const payload: Record<string, any> = {
      p_name: n,
      p_stock_count: stockNum,
      p_subcategory_id: subcategoryId,
      p_search_text: tags,
      p_attributes: {},
      p_changed_by_name: who,
      p_changed_by_date: date,

      // ✅ pass admin pin through p_pin (backend must treat it as admin)
      p_pin: ap,
    };

    if (isBarcodeFlow) payload.p_barcode_text = trimmedBarcode;

    const { error } = await supabase.rpc(rpcName, payload);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base sm:text-lg font-semibold">Add Item</h2>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <input
            placeholder="Item name"
            className="w-full border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Initial stock"
            className="w-full border rounded-lg p-2"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <input
            placeholder="Barcode (optional)"
            className="w-full border rounded-lg p-2"
            value={barcodeText}
            onChange={(e) => setBarcodeText(e.target.value)}
          />

          <input
            placeholder="Tags"
            className="w-full border rounded-lg p-2"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="pt-1">
            <NameDropdown value={byName} onChange={setByName} onlyRole="fulltimer" />
          </div>

          <input
            type="date"
            className="w-full border rounded-lg p-2"
            value={byDate}
            onChange={(e) => setByDate(e.target.value)}
          />

          {/* ✅ always show admin pin */}
          <input
            placeholder="Admin PIN (6 digits)"
            className="w-full border rounded-lg p-2"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

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
              disabled={loading}
              className={`rounded-lg px-4 py-2 w-1/2 ${
                loading ? "bg-gray-300 text-gray-500" : "bg-black text-white"
              }`}
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  