'use client';
// src/app/(vendor)/vendor/products/page.tsx

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, ToggleLeft, ToggleRight, Trash2, Loader2, Package,
  Edit3, IndianRupee, Box, Star, AlertCircle, CheckCircle,
  LayoutGrid, List, Search, Save, X, TrendingDown, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'bulk';

export default function VendorProductsPage() {
  const { data, isLoading, refetch } = trpc.product.vendorProducts.useQuery({ limit: 100 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  // Bulk stock edit: map of productId -> pending stock value
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState<string | null>(null);

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => { toast.success('Saved!'); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => { toast.success('Product deleted!'); refetch(); setDeleteId(null); },
    onError: (err) => toast.error(err.message),
  });

  const products = data?.products ?? [];
  const activeCount = products.filter(p => p.isActive).length;
  const lowStockItems = products.filter(p => p.stock <= 5);

  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const handleBulkSave = async (productId: string) => {
    const val = stockEdits[productId];
    if (val === undefined) return;
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) { toast.error('Invalid stock value'); return; }
    setSavingStock(productId);
    try {
      await updateMutation.mutateAsync({ id: productId, stock: n });
      setStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
    } finally {
      setSavingStock(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-gray-400 text-sm mt-1">
            {products.length} products ·{' '}
            <span className="text-emerald-600 font-bold">{activeCount} live</span>
            {lowStockItems.length > 0 && (
              <> · <span className="text-amber-600 font-bold">{lowStockItems.length} low stock</span></>
            )}
          </p>
        </div>
        <Link
          href="/vendor/products/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <TrendingDown size={18} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-700">
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low (≤5 units)
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lowStockItems.map(p => p.name).join(', ')}
            </p>
          </div>
          {viewMode === 'grid' && (
            <button
              onClick={() => setViewMode('bulk')}
              className="text-xs font-black text-amber-700 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl flex-shrink-0"
            >
              Restock →
            </button>
          )}
        </div>
      )}

      {/* Toolbar: search + view toggle */}
      {products.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={13} /> Grid
            </button>
            <button
              onClick={() => setViewMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'bulk' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={13} /> Bulk Edit
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-4">
            <Package size={36} className="text-orange-400" />
          </div>
          <p className="text-xl font-black text-gray-800">No products yet</p>
          <p className="text-gray-400 text-sm mt-2 max-w-xs">Start by adding your first product so customers can order from your shop.</p>
          <Link href="/vendor/products/new" className="btn-primary mt-6">+ Add Your First Product</Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ─────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(product => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${!product.isActive ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div className="relative h-44 bg-gray-50">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={44} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle size={9} /> Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                      Hidden
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                      <Sparkles size={9} /> Featured
                    </span>
                  )}
                </div>
                {product.stock <= 5 && (
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${product.stock === 0 ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'}`}>
                      {product.stock === 0 ? '⚠ Out of stock' : `Low: ${product.stock}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-[11px] text-orange-500 font-bold uppercase tracking-wider mt-0.5">{product.category.name}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <IndianRupee size={14} className="text-gray-700" />
                    <span className="font-black text-gray-900 text-lg">{product.price}</span>
                    {product.mrp > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Box size={13} />
                    <span className="font-bold">{product.stock} {product.unit}</span>
                  </div>
                </div>

                {product.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="font-bold">{product.rating.toFixed(1)}</span>
                    <span className="text-gray-400">({product.reviewCount})</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                  <button
                    onClick={() => updateMutation.mutate({ id: product.id, isActive: !product.isActive })}
                    disabled={updateMutation.isPending}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all flex-1 justify-center ${
                      product.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {product.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {product.isActive ? 'Live' : 'Hidden'}
                  </button>

                  <Link
                    href={`/vendor/products/${product.id}/edit`}
                    className="w-9 h-9 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-500 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Edit3 size={15} />
                  </Link>

                  {deleteId === product.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate({ id: product.id })}
                        disabled={deleteMutation.isPending}
                        className="text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg"
                      >
                        {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm?'}
                      </button>
                      <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(product.id)}
                      className="w-9 h-9 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Search size={28} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold">No products match "{search}"</p>
            </div>
          )}
        </div>
      ) : (
        /* ── BULK STOCK EDIT VIEW ──────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <AlertCircle size={15} className="text-amber-500" />
            <p className="text-xs font-bold text-gray-500">
              Edit stock quantities below. Press <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono">Save</kbd> per row to apply.
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map(product => {
              const pendingValue = stockEdits[product.id];
              const isDirty = pendingValue !== undefined && pendingValue !== product.stock.toString();
              const isSaving = savingStock === product.id;

              return (
                <div key={product.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isDirty ? 'bg-orange-50/40' : 'hover:bg-gray-50/50'}`}>
                  {/* Thumbnail */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-bold">{product.category.name}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      {product.isActive ? (
                        <span className="text-[10px] font-black text-emerald-600">● Live</span>
                      ) : (
                        <span className="text-[10px] font-black text-gray-400">○ Hidden</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="font-black text-gray-800 text-sm">₹{product.price}</p>
                    {product.mrp > product.price && (
                      <p className="text-xs text-gray-400 line-through">₹{product.mrp}</p>
                    )}
                  </div>

                  {/* Stock editor */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={pendingValue ?? product.stock}
                        onChange={e => setStockEdits(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className={`w-20 text-center font-black text-sm border-2 rounded-xl py-2 outline-none transition-all ${
                          isDirty ? 'border-orange-400 bg-white text-gray-900' : 'border-transparent bg-gray-100 text-gray-700'
                        } ${product.stock <= 5 ? 'text-amber-600' : ''}`}
                      />
                      <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-gray-400 font-bold">{product.unit}</span>
                    </div>

                    {isDirty ? (
                      <button
                        onClick={() => handleBulkSave(product.id)}
                        disabled={isSaving}
                        className="flex items-center gap-1 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-xl transition-all"
                      >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                    ) : (
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="w-8 h-8 bg-gray-100 hover:bg-orange-50 hover:text-orange-500 text-gray-400 rounded-xl flex items-center justify-center transition-all"
                        title="Full edit"
                      >
                        <Edit3 size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p className="font-bold text-sm">No products match "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}