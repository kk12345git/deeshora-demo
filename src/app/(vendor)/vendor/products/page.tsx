// src/app/(vendor)/vendor/products/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, ToggleLeft, ToggleRight, Trash2, Loader2, Package,
  Edit3, IndianRupee, Box, Star, AlertCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorProductsPage() {
  const { data, isLoading, refetch } = trpc.product.vendorProducts.useQuery({ limit: 100 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => { toast.success('Product updated!'); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => { toast.success('Product deleted!'); refetch(); setDeleteId(null); },
    onError: (err) => toast.error(err.message),
  });

  const products = data?.products ?? [];
  const activeCount = products.filter(p => p.isActive).length;
  const lowStock = products.filter(p => p.stock <= 5).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Products</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} products · {activeCount} active</p>
        </div>
        <Link href="/vendor/products/new" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Low stock warning */}
      {lowStock > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-700">{lowStock} product{lowStock > 1 ? 's' : ''} running low on stock (≤5 units).</p>
        </div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-4">
            <Package size={36} className="text-orange-400" />
          </div>
          <p className="text-xl font-black text-gray-800">No products yet</p>
          <p className="text-gray-400 text-sm mt-2 max-w-xs">Start by adding your first product so customers can order from your shop.</p>
          <Link href="/vendor/products/new" className="btn-primary mt-6">+ Add Your First Product</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(product => (
            <div key={product.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md ${!product.isActive ? 'opacity-60' : ''}`}>
              {/* Product Image */}
              <div className="relative h-44 bg-gray-50">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={44} className="text-gray-300" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-3 left-3">
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle size={9} /> Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                {/* Stock badge */}
                {product.stock <= 5 && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      {product.stock === 0 ? 'Out of stock' : `Low: ${product.stock}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
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
                    <span className="text-gray-400">({product.reviewCount} reviews)</span>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                  {/* Toggle Active */}
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

                  {/* Edit */}
                  <Link
                    href={`/vendor/products/${product.id}/edit`}
                    className="w-9 h-9 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-500 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Edit3 size={15} />
                  </Link>

                  {/* Delete with confirm */}
                  {deleteId === product.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate({ id: product.id })}
                        disabled={deleteMutation.isPending}
                        className="text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg"
                      >
                        {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Delete?'}
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
        </div>
      )}
    </div>
  );
}