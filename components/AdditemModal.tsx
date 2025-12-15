"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddItemModal({
  open,
  onClose,
  subcategoryId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  subcategoryId: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");
  const [searchText, setSearchText] = useState("");
  const [pin, setPin] = useState("");
  const [byName, setByName] = useState("");
  const [byDate, setByDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

if (!pin.trim()) {
  setError("PIN is required.");
  setLoading(false);
  return;
}

if (!/^\d{4}$/.test(pin.trim())) {
  setError("PIN must be exactly 4 digits.");
  setLoading(false);
  return;
}


    const { error } = await supabase.rpc("add_item_with_pin", {
      p_name: name,
      p_stock_count: Number(stock),
      p_subcategory_id: subcategoryId,
      p_search_text: searchText,
      p_attributes: {},
      p_changed_by_name: byName,
      p_changed_by_date: byDate,
      p_pin: pin,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onClose();
    onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md">
        <h2 className="text-lg font-bold mb-3">Add Item</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <input
          placeholder="Item name"
          className="w-full border p-2 mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Initial stock"
          className="w-full border p-2 mb-2"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <input
          placeholder="Tags"
          className="w-full border p-2 mb-2"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <input
          placeholder="Your name"
          className="w-full border p-2 mb-2"
          value={byName}
          onChange={(e) => setByName(e.target.value)}
        />

        <input
          type="date"
          className="w-full border p-2 mb-2"
          value={byDate}
          onChange={(e) => setByDate(e.target.value)}
        />

        <input
          placeholder="4-digit PIN"
          className="w-full border p-2 mb-4"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="border px-4 py-2 w-1/2">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="bg-black text-white px-4 py-2 w-1/2"
          >
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
