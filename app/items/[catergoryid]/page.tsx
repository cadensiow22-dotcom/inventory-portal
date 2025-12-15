'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import UpdateStockModal from '../../../components/UpdateStockModal';
import AddItemModal from '../../../components/AdditemModal';
import ItemHistoryModal from '../../../components/ItemHistoryModal';
//import ChangePinModal from '../../../components/ChangePinModal';
import DeleteItemModal from '../../../components/DeleteItemModal';
import ManageNamesModal from "../../../components/ManageNamesModal";

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
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);
  const [manageNamesOpen, setManageNamesOpen] = useState(false);

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
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
  <Link href="/" className="text-blue-600 hover:underline">
    ← Home
  </Link>

     <div className="flex flex-wrap items-center gap-3">

    <button
      type="button"
      className={`rounded-lg border px-3 py-1 text-sm ${
        adminMode
          ? 'bg-black text-white'
          : 'bg-white hover:bg-gray-50'
      }`}
      onClick={() => setAdminMode((v) => !v)}
    >
      {adminMode ? 'Admin mode: ON' : 'Admin mode: OFF'}
    </button>
    {adminMode && (
  <button
    type="button"
    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
    onClick={() => setPinModalOpen(true)}
  >
    Change PIN
  </button>
)}
{adminMode && (
  <button
    type="button"
    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
    onClick={() => setManageNamesOpen(true)}
  >
    Manage Names
  </button>
)}

    <div className="text-xs text-gray-500">
      ID: <span className="font-mono">{categoryId}</span>
    </div>
  </div>
</div>


        <h1 className="text-2xl font-bold mb-4">{title || 'Items'}</h1>

        <div className="rounded-xl bg-white p-4 shadow mb-4">
          <label className="text-sm font-semibold">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. philips gu10 warm white"
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring"
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: brand + base + color + watts works best.
          </p>
        </div>
        {adminMode && (
  <button
    className="mb-4 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
    onClick={() => setAddOpen(true)}
  >
    + Add Item
  </button>
)}


        {loading && <p>Loading...</p>}

        {err && (
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-red-600">Error</p>
            <p className="text-sm text-gray-700 mt-1">{err}</p>
          </div>
        )}

        {!loading && !err && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Showing <b>{filtered.length}</b> item(s)
            </p>

            {filtered.map((it) => (
              <div key={it.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.search_text}</div>
                  </div>
                  <div className="text-right">
  <div className="text-xs text-gray-500">Stock</div>
  <div className="text-xl font-bold">{it.stock_count}</div>

{adminMode && (
  <button
    className="mt-2 rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
    onClick={() => {
      setSelectedItem({ id: it.id, name: it.name, stock_count: it.stock_count });
      setModalOpen(true);
    }}
  >
    Update stock
  </button>
)}
{adminMode && (
  <button
    className="mt-2 rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
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
    className="mt-2 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
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
              <div className="rounded-xl bg-white p-6 shadow text-center text-gray-600">
                No matches. Try “philips gu10 warm white”.
              </div>
            )}
          </div>
        )}
      </div>
      <UpdateStockModal
  open={modalOpen && adminMode}
  item={selectedItem}
  onClose={() => {
  setModalOpen(false);
  setSelectedItem(null);
}}
  onSuccess={async () => {
    if (!categoryId) return;

    setLoading(true);
    setErr(null);

    const res = await supabase
    .from('items')
    .select('id,name,stock_count,search_text')
    .eq('subcategory_id', categoryId)
    .eq('is_active', true)
    .limit(200);


    if (res.error) setErr(res.error.message);
    setItems(res.data ?? []);
    setLoading(false);
  }}
/>
<AddItemModal
  open={addOpen && adminMode}
  subcategoryId={categoryId!}
  onClose={() => setAddOpen(false)}
  onSuccess={async () => {
    setAddOpen(false);

    if (!categoryId) return;

    setLoading(true);
    setErr(null);

    const res = await supabase
      .from('items')
      .select('id,name,stock_count,search_text')
      .eq('subcategory_id', categoryId)
      .eq('is_active', true)
      .limit(200);

    if (res.error) setErr(res.error.message);
    setItems(res.data ?? []);
    setLoading(false);
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
{/*<ChangePinModal
  open={pinModalOpen && adminMode}
  onClose={() => setPinModalOpen(false)}
/>*/}
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
   .from('items')
   .select('id,name,stock_count,search_text')
   .eq('subcategory_id', categoryId)
   .eq('is_active', true)
   .limit(200);

    setItems(res.data ?? []);
  }}
/>

<ManageNamesModal
  open={manageNamesOpen && adminMode}
  onClose={() => setManageNamesOpen(false)}
/>

    </main>
  );
}
