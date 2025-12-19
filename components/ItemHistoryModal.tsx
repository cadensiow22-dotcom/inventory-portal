"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type LogRow = {
  id: string;
  action: string | null;
  changed_by_name: string | null;
  changed_by_date: string | null; // date comes as string
  changed_at: string | null; // timestamptz comes as string
  before_count: number | null;
  after_count: number | null;
  change_amount: number | null;
  note: string | null;
};

export default function ItemHistoryModal({
  open,
  onClose,
  itemId,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName: string | null;
}) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!open || !itemId) return;

    const load = async () => {
      setLoading(true);
      setErr("");

      const { data, error } = await supabase
        .from("stock_logs")
        .select(
          "id,action,changed_by_name,changed_by_date,changed_at,before_count,after_count,change_amount,note"
        )
        .eq("item_id", itemId)
        .order("changed_at", { ascending: false })
        .limit(20);

      if (error) setErr(error.message);
      setLogs(data ?? []);
      setLoading(false);
    };

    load();
  }, [open, itemId]);

  if (!open || !itemId) return null;

  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
    {/* Backdrop click */}
    <button
      className="absolute inset-0"
      onClick={onClose}
      aria-label="Close modal backdrop"
    />

    <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header (sticky) */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold">History</h2>
            <p className="text-sm text-gray-600 truncate">
              {itemName ?? itemId}
            </p>
          </div>

          <button
            className="shrink-0 rounded-lg border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {err ? (
          <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </div>

      {/* Body (scrolls) */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && <p className="text-sm">Loading…</p>}

        {!loading && !err && logs.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            No history yet.
          </div>
        ) : null}

        {!loading && !err && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">
                    {l.action ?? "action"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {l.changed_at ? new Date(l.changed_at).toLocaleString() : ""}
                  </div>
                </div>

                <div className="mt-1 text-sm text-gray-800">
                  {l.before_count} → {l.after_count}{" "}
                  <span className="text-gray-500">
                    {(() => {
                      const delta = l.change_amount ?? 0;
                      return (
                        <>
                          ({delta >= 0 ? "+" : ""}
                          {delta})
                        </>
                      );
                    })()}
                  </span>
                </div>

                <div className="mt-1 text-xs text-gray-600">
                  By: {l.changed_by_name ?? "-"} | Date: {l.changed_by_date ?? "-"}
                </div>

                {l.note ? (
                  <div className="mt-1 text-xs text-gray-600">
                    Note: {l.note}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer (optional small hint) */}
      <div className="border-t border-neutral-200 px-4 py-2 text-xs text-gray-500">
        Showing latest 20 logs
      </div>
    </div>
  </div>
);
}
