// src/app/(admin)/admin/products/page.tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Trash2, Edit, Loader2, Store, Tag, Package, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = trpc.admin.products.useQuery({
    search: search || undefined,
    vendorId,
    categoryId,
  });

  const { data: vendors } = trpc.admin.vendors.useQuery({ limit: 100 });
  const { data: categories } = trpc.product.categories.useQuery();

  const deleteMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">Inventory Master</h1>
          <p className="text-gray-500 font-medium">Managing {data?.total || 0} local products across all vendors.</p>
        </div>
        <Link href="/admin/products/new" className="w-full md:w-auto btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-orange-500/20">
          <Plus size={20} className="mr-2 stroke-[3]" /> ADD PRODUCT
        </Link>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or description..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
            <select
                className="w-full h-14 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-sm appearance-none cursor-pointer"
                value={vendorId || ""}
                onChange={(e) => setVendorId(e.target.value || undefined)}
            >
                <option value="">All Vendors</option>
                {vendors?.vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.shopName}</option>
                ))}
            </select>
        </div>
        <div className="md:col-span-3">
            <select
                className="w-full h-14 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-sm appearance-none cursor-pointer"
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value || undefined)}
            >
                <option value="">All Categories</option>
                {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin mx-auto mb-4 w-12 h-12 text-orange-500" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Syncing Database...</p>
        </div>
      ) : data?.products.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
          <Package className="mx-auto mb-4 w-16 h-16 text-gray-200" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No items matching criteria</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Detail</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vendor Source</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pricing Status</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock Control</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.products.map((product) => (
                  <tr key={product.id} className="group hover:bg-orange-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Image src={product.images[0]} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-gray-950 uppercase tracking-tighter leading-none">{product.name}</p>
                          <span className="inline-flex items-center text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                            {product.category.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Store size={14} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{product.vendor.shopName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{product.vendor.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-lg font-black text-gray-950 tracking-tighter leading-none">₹{product.price}</p>
                        <p className="text-xs text-gray-400 line-through font-medium">MRP ₹{product.mrp}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <p className={`text-sm font-black tracking-tight ${product.stock > 10 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {product.stock} {product.unit}s Available
                        </p>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                            />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/products/edit/${product.id}`} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                          <Edit size={18} strokeWidth={2.5} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {data?.products.map((product) => (
              <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 active:scale-[0.98] transition-transform">
                <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex-shrink-0">
                        <Image src={product.images[0]} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{product.category.name}</p>
                                <h3 className="text-xl font-black text-gray-950 uppercase tracking-tighter leading-none mt-1">{product.name}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-gray-950 tracking-tighter">₹{product.price}</p>
                                <p className="text-[10px] text-gray-400 line-through font-bold uppercase tracking-widest">MRP {product.mrp}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 py-2 border-y border-gray-50 mt-2">
                            <Store size={12} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">{product.vendor.shopName}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto">{product.stock} Left</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Link href={`/admin/products/edit/${product.id}`} className="flex-1 h-12 flex items-center justify-center gap-2 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                <Edit size={14} /> Edit
                            </Link>
                            <button 
                                onClick={() => handleDelete(product.id, product.name)}
                                className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
