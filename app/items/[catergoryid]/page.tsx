'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import UpdateStockModal from '../../../components/UpdateStockModal';
import AddItemModal from '../../../components/AdditemModal';
import ItemHistoryModal from '../../../components/ItemHistoryModal';
import DeleteItemModal from '../../../components/DeleteItemModal';
import LinkBarcodeModal from '../../../components/LinkBarcodeModal';
import MobileBarcodeScanner from '../../../components/MobileBarcodeScanner';

type Item = {
  id: string;
  name: string;
  stock_count: number;
  search_text: string | null;
};

export default function ItemsPage() {
  const pathname = usePathname();
  const categoryId = pathname.split('/').pop(); // <-- gets the last part of /items/<id>

  const [title, setTitle] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; stock_count: number } | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>("");
  const [openedFromBarcode, setOpenedFromBarcode] = useState(false);
  const normalizeBarcode = (s: string) =>
  (s || "").replace(/\s+/g, "").trim();
  const [addPrefillBarcode, setAddPrefillBarcode] = useState("");

  // --- Barcode/QR (additive) ---
  const [barcode, setBarcode] = useState("");
  const [barcodeErr, setBarcodeErr] = useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  const update = () => setIsMobile(mq.matches);

  update(); // run once on mount
  mq.addEventListener?.("change", update);

  return () => mq.removeEventListener?.("change", update);
}, []);


  const handleBarcodeLookup = async (codeRaw: string) => {
  const code = (codeRaw || "").trim();
  setBarcode(code);
  setBarcodeErr(null);
  setBarcodeNotFound(false);

  if (!code) return;

  setBarcodeLoading(true);
  try {
    const { data, error } = await supabase.rpc("lookup_item_by_barcode", {
      p_barcode_text: code,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const itemId = row?.item_id ?? row?.id ?? null;

    if (!itemId) {
      setBarcodeNotFound(true);
      return;
    }

    const found =
      row?.name && typeof row?.stock_count === "number"
        ? { id: itemId, name: row.name, stock_count: row.stock_count }
        : items.find((x) => x.id === itemId);

    if (!found) {
      setBarcodeErr("Barcode is linked to an item outside this subcategory.");
      return;
    }

    setQ(found.name);

    if (adminMode) {
      setLastScannedBarcode(code);
      setOpenedFromBarcode(true);
      setSelectedItem(found);
      setModalOpen(true);
    }
  } catch (e: any) {
    setBarcodeErr(e?.message ?? "Barcode lookup failed.");
  } finally {
    setBarcodeLoading(false);
  }
};

  const tokens = useMemo(() => {
    return q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [q]);

useEffect(() => {
  if (!categoryId) {
    setLoading(false);
    return;
  }

  const loadItems = async () => {
    setLoading(true);
    setErr(null);

    const cat = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    const res = await supabase
  .from('items')
  .select('id,name,stock_count,search_text')
  .eq('subcategory_id', categoryId)
  .eq('is_active', true)
  .limit(200);



    if (cat.error) setErr(cat.error.message);
    if (res.error) setErr(res.error.message);

    setTitle(cat.data?.name ?? '');
    setItems(res.data ?? []);
    setLoading(false);
  };

  loadItems();
}, [categoryId]);
//  Load admin mode from sessionStorage on first render
useEffect(() => {
  const saved = sessionStorage.getItem('adminMode');
  if (saved === 'true') setAdminMode(true);
}, []);

//  Save admin mode whenever it changes
useEffect(() => {
  sessionStorage.setItem('adminMode', adminMode ? 'true' : 'false');
}, [adminMode]);


  const filtered = useMemo(() => {
    if (tokens.length === 0) return items;
    return items.filter((it) => {
      const hay = `${it.name} ${it.search_text ?? ''}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, tokens]);

  return (
  <main className="min-h-screen bg-transparent">
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Home
        </Link>

       <div className="flex flex-wrap items-center gap-3">
  <button
    type="button"
    className={`rounded-lg border px-3 py-1 text-sm ${
      adminMode ? "bg-black text-white" : "bg-white hover:bg-gray-50"
    }`}
    onClick={() => setAdminMode((v) => !v)}
  >
    {adminMode ? "Admin mode: ON" : "Admin mode: OFF"}
  </button>

  <div className="text-xs text-gray-500">
    ID: <span className="font-mono">{categoryId}</span>
  </div>
</div>

      </div>

      <h1 className="mb-4 text-2xl font-bold">{title || "Items"}</h1>

        <div className="mb-4 rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-200">
        <label className="text-sm font-semibold">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. philips gu10 warm white"
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black/10"
        />

        {/* --- Barcode/QR Entry (additive, mobile-first) --- */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              inputMode="numeric"
              placeholder={isMobile ? "Scan or enter barcode" : "Enter barcode (desktop optional)"}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />

            <button
              type="button"
              className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-50"
              disabled={barcodeLoading || !barcode.trim()}
              onClick={() => handleBarcodeLookup(barcode)}
            >
              {barcodeLoading ? "Checking..." : "Check"}
            </button>

            {isMobile && (
  <button
    type="button"
    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
    onClick={() => setScanOpen(true)}
    disabled={barcodeLoading}
  >
    Scan
  </button>
)}

          </div>

          {barcodeErr && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {barcodeErr}
            </div>
          )}

          {barcodeNotFound && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              Barcode not linked to any item.
              {adminMode ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1 text-xs hover:bg-white"
                    onClick={() => {
                     setAddPrefillBarcode(barcode);   // ✅ barcode flow = prefill scanned barcode
                     setAddOpen(true);
                    }}

                  >
                    + Add new item
                  </button>

                  {/* Link flow will be added later as a NEW modal (LinkBarcodeModal) */}
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1 text-xs hover:bg-white"
                    onClick={() => setLinkOpen(true)}

                  >
                    Link to existing item
                  </button>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-amber-700">
                  Turn on Admin mode to add or link barcodes.
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Tip: brand + base + color + watts works best.
        </p>
      </div>

      {adminMode && (
        <button
  className="mb-4 w-full sm:w-auto rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
  onClick={() => {
    setAddPrefillBarcode("");      // ✅ IMPORTANT: normal add = no barcode
    setAddOpen(true);
  }}
>
  + Add Item
</button>
      )}

      {loading && <p>Loading...</p>}

      {err && (
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="font-semibold text-red-600">Error</p>
          <p className="mt-1 text-sm text-gray-700">{err}</p>
        </div>
      )}

      {!loading && !err && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <p className="text-sm text-gray-600">
            Showing <b>{filtered.length}</b> item(s)
          </p>

          {filtered.map((it) => (
            <div key={it.id} className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-gray-500">{it.search_text}</div>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs text-gray-500">Stock</div>
                  <div className="text-2xl font-semibold">{it.stock_count}</div>

                  {adminMode && (
                    <button
                      className="mt-2 w-full sm:w-auto rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setSelectedItem({
                          id: it.id,
                          name: it.name,
                          stock_count: it.stock_count,
                        });
                        setModalOpen(true);
                      }}
                    >
                      Update stock
                    </button>
                  )}

                  {adminMode && (
                    <button
                      className="mt-2 w-full sm:w-auto rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setHistoryItem({ id: it.id, name: it.name });
                        setHistoryOpen(true);
                      }}
                    >
                      View history
                    </button>
                  )}

                  {adminMode && (
                    <button
                      className="mt-2 w-full sm:w-auto rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setDeleteItem({ id: it.id, name: it.name });
                        setDeleteOpen(true);
                      }}
                    >
                      Delete item
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl bg-white p-6 text-center text-gray-600 shadow">
              No matches. Try “philips gu10 warm white”.
            </div>
          )}
        </div>
      )}

      <UpdateStockModal
  open={modalOpen && adminMode}
  item={selectedItem}

  openedFromBarcode={openedFromBarcode}
  barcodeText={lastScannedBarcode}

  onClose={() => {
    setModalOpen(false);
    setSelectedItem(null);
    setOpenedFromBarcode(false);
    setLastScannedBarcode("");
  }}

  onUnlinked={() => {
    // Option A: close modal + reset barcode state
    setBarcode("");
    setBarcodeErr(null);
    setBarcodeNotFound(false);
    setOpenedFromBarcode(false);
    setLastScannedBarcode("");
  }}

  onSuccess={async () => {
    if (!categoryId) return;

    setLoading(true);
    setErr(null);

    const res = await supabase
      .from("items")
      .select("id,name,stock_count,search_text")
      .eq("subcategory_id", categoryId)
      .eq("is_active", true)
      .limit(200);

    if (res.error) setErr(res.error.message);
    setItems(res.data ?? []);
    setLoading(false);
  }}
/>


<AddItemModal
  open={addOpen && adminMode}
  subcategoryId={categoryId!}
  prefillBarcode={addPrefillBarcode}
  onClose={() => setAddOpen(false)}
  onSuccess={async () => {
  setAddOpen(false);
  if (!categoryId) return;

  setLoading(true);
  setErr(null);

  const res = await supabase
    .from("items")
    .select("id,name,stock_count,search_text")
    .eq("subcategory_id", categoryId)
    .eq("is_active", true)
    .limit(200);

  if (res.error) setErr(res.error.message);

  const freshItems = res.data ?? [];
  setItems(freshItems);
  setLoading(false);

  // ✅ IMPORTANT: now that items are refreshed, re-run barcode lookup
  if (barcode.trim()) {
    setBarcodeNotFound(false);
    setBarcodeErr(null);
    await handleBarcodeLookup(barcode.trim());
  }
}}
/>


<MobileBarcodeScanner
  open={scanOpen}
  onClose={() => setScanOpen(false)}
  onDetected={(code) => {
    const clean = normalizeBarcode(code);
    setBarcode(clean);
    handleBarcodeLookup(clean);
  }}
/>


      <LinkBarcodeModal
        open={linkOpen && adminMode}
        barcodeText={barcode}
        items={items}
        onClose={() => setLinkOpen(false)}
        onLinked={() => {
          setLinkOpen(false);
          setBarcodeNotFound(false);
          setBarcodeErr(null);
          // Re-run lookup so it selects item and can open UpdateStockModal
          handleBarcodeLookup(barcode);
        }}
      />


      <ItemHistoryModal
        open={historyOpen && adminMode}
        itemId={historyItem?.id ?? null}
        itemName={historyItem?.name ?? null}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryItem(null);
        }}
      />

      <DeleteItemModal
        open={deleteOpen && adminMode}
        item={deleteItem}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteItem(null);
        }}
        onDeleted={async () => {
          if (!categoryId) return;

          const res = await supabase
            .from("items")
            .select("id,name,stock_count,search_text")
            .eq("subcategory_id", categoryId)
            .eq("is_active", true)
            .limit(200);

          setItems(res.data ?? []);
        }}
      />



    </div>
  </main>
);
}