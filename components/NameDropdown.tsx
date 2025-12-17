"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function NameDropdown({
  value,
  onChange,
  label = "Your name",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");

      const { data, error } = await supabase
        .from("staff_names")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setNames([]);
      } else {
        setNames((data ?? []).map((r: any) => r.name));
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
