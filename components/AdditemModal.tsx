"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import NameDropdown from "./NameDropdown";

export default function AddItemModal({
  open,
  onClose,
  subcategoryId,
  onSuccess,
  prefillBarcode,
}: {
  open: boolean;
  onClose: () => void;
  subcategoryId: string;
  onSuccess: () => void;
  prefillBarcode?: string;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [searchText, setSearchText] = useState("");
  const [pin, setPin] = useState("");
  const [byName, setByName] = useState("");
  const [byDate, setByDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [barcodeText, setBarcodeText] = useState(prefillBarcode ?? "");
  const openedWithPrefill = useRef(false);

  useEffect(() => {
  if (!open) return;

  const pre = (prefillBarcode ?? "").trim();

  // ✅ This decides which mode this modal is in for THIS open:
  // - If it opened because of "barcode not found", prefillBarcode will be present.
  // - If it opened from normal "+ Add Item", prefillBarcode should be empty.
  openedWithPrefill.current = pre.length > 0;

  // ✅ Always reset barcode field based on how it opened
  setBarcodeText(pre);

  setError("");
  setLoading(false);
}, [open, prefillBarcode]);


  if (!open) return null;

  async function submit() {
    setError("");
    setLoading(true);

    // REQUIRED FIELD CHECKS
    if (!name.trim()) {
      setError("Item name is required.");
      setLoading(false);
      return;
    }
    if (!searchText.trim()) {
      setError("Tags are required.");
      setLoading(false);
      return;
    }
    if (!byName.trim()) {
      setError("Your name is required.");
      setLoading(false);
      return;
    }
    if (!/^\d{4,8}$/.test(pin.trim())) {
  setError("Owner's PIN must be 4 to 8 digits.");
  setLoading(false);
  return;
}
    if (!stock.trim() || Number.isNaN(Number(stock))) {
      setError("Initial stock is required.");
      setLoading(false);
      return;
    }
    if (!byDate) {
      setError("Date is required.");
      setLoading(false);
      return;
    }

    const bc = (barcodeText || "").trim();

// ✅ Only use barcode RPC if this modal was opened from barcode-not-found flow
const useBarcodeFlow = openedWithPrefill.current && bc.length > 0;

const rpcName = useBarcodeFlow
  ? "add_item_and_link_barcode_with_pin"
  : "add_item_with_pin";


    const payload: any = {
      p_name: name.trim(),
      p_stock_count: Number(stock),
      p_subcategory_id: subcategoryId,
      p_search_text: searchText.trim(),
      p_attributes: {},
      p_changed_by_name: byName.trim(),
      p_changed_by_date: byDate,
      p_pin: pin.trim(),
    };

    if (useBarcodeFlow) payload.p_barcode_text = bc;

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
      
      {/* Header (sticky) */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base sm:text-lg font-semibold">Add Item</h2>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Body (scrolls) */}
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

        <input
  placeholder="Owner's PIN"
  className="w-full border rounded-lg p-2"
  value={pin}
  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
/>
      </div>

      {/* Footer (sticky buttons) */}
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
