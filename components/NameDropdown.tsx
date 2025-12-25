"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type StaffRole = "fulltimer" | "parttimer" | "intern";

type StaffRow = {
  name: string | null;
  staff_uid: string | null;
  staff_role: StaffRole | null;
};

export default function NameDropdown({
  value,
  onChange,
  label = "Your name",
  onlyRole,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  onlyRole?: StaffRole;
}) {
  const [names, setNames] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");

      let q = supabase
        .from("staff_names")
        .select("name, staff_uid, staff_role")
        .eq("is_active", true);

      if (onlyRole) {
        q = q.eq("staff_role", onlyRole);
      }

      const { data, error } = await q.order("name", { ascending: true });

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setNames([]);
      } else {
        setNames((data ?? []) as StaffRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [onlyRole]);

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold mb-1">{label}</label>

      <select
        className="w-full rounded-lg border p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">
          {loading ? "Loading names..." : "Select your name"}
        </option>

        {names
          .filter((r) => r.name)
          .map((r) => {
            const n = r.name as string;
            const uid = r.staff_uid ?? n; // stable key, not displayed
            return (
              <option key={`${n}-${uid}`} value={n}>
                {n}
              </option>
            );
          })}
      </select>

      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
