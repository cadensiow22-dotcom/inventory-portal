'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DeleteItemModal({
  open,
  onClose,
  item,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  item: { id: string; name: string } | null;
  onDeleted: () => void;
}) {
  const [pin, setPin] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  if (!open || !item) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setErr('Type DELETE to confirm.');
      return;
    }

    setLoading(true);
    setErr('');

    const { error } = await supabase.rpc('delete_item_with_pin', {
      p_item_id: item.id,
      p_pin: pin,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-red-600">Delete item</h2>

        <p className="mt-2 text-sm">
          You are about to delete:
          <br />
          <b>{item.name}</b>
        </p>

        <p className="mt-2 text-sm text-red-600">
          This action cannot be undone.
        </p>

        <label className="mt-4 block text-sm font-semibold">
          Type <b>DELETE</b> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-lg border p-2"
        />

        <label className="mt-3 block text-sm font-semibold">Admin PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-1 w-full rounded-lg border p-2"
        />

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1 text-white disabled:opacity-50"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
