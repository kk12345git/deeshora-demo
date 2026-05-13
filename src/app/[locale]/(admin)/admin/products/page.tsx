// src/app/(admin)/admin/products/page.tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Trash2, Edit, Loader2, Store, Tag, Package, ChevronRight, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

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
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory Control</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketplace Catalog</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Managing <span className="text-gray-900 font-bold">{data?.total || 0} local items</span> across all active partner shops.</p>
        </div>
        <Link 
           href="/admin/products/new" 
           className="flex items-center justify-center gap-3 bg-gray-950 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-2xl shadow-gray-950/10 active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          List New Item
        </Link>
      </div>

      {/* Advanced Command Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-6 relative group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            placeholder="Quick search by product name, SKU or description..."
            className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-brand-500/5 focus:border-brand-400 outline-none transition-all font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="xl:col-span-3 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-lg pointer-events-none">
            <Store size={14} className="text-gray-400" />
          </div>
          <select
            className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-400 font-black text-[11px] uppercase tracking-wider appearance-none cursor-pointer"
            value={vendorId || ""}
            onChange={(e) => setVendorId(e.target.value || undefined)}
          >
            <option value="">All Partners</option>
            {vendors?.vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.shopName}</option>
            ))}
          </select>
          <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none" />
        </div>

        <div className="xl:col-span-3 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-lg pointer-events-none">
            <Tag size={14} className="text-gray-400" />
          </div>
          <select
            className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-400 font-black text-[11px] uppercase tracking-wider appearance-none cursor-pointer"
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">All Segments</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none" />
        </div>
      </div>

      {/* Catalog Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="relative">
             <Loader2 className="w-14 h-14 animate-spin text-brand-500" />
             <div className="absolute inset-0 blur-2xl bg-brand-500/20 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Syncing Master Inventory...</p>
        </div>
      ) : data?.products.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
             <Package size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Items Registered</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium">Try broadening your search or add a new product to the marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {data?.products.map((product, i) => {
            const currentComm = (product.commissionRate ?? product.category.commissionRate ?? product.vendor.commissionRate) * 100;
            const commSource = product.commissionRate ? 'Product' : product.category.commissionRate ? 'Category' : 'Vendor';
            
            return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:border-brand-100 transition-all duration-500 overflow-hidden"
              >
                <div className="flex flex-col xl:flex-row xl:items-center gap-8 p-6">
                  {/* Visual & Core Identity */}
                  <div className="flex items-center gap-6 xl:w-1/3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-[1.75rem] border border-gray-50 overflow-hidden bg-gray-50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <Image src={product.images[0]} alt={product.name} width={96} height={96} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-gray-50 rounded-xl shadow-lg flex items-center justify-center text-brand-500">
                         <Tag size={16} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[9px] font-black rounded-md uppercase tracking-widest">{product.category.name}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{product.vendor.shopName}</span>
                       </div>
                       <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight uppercase truncate">{product.name}</h3>
                       <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <MapPin size={12} className="text-brand-500/50" /> {product.vendor.city}
                       </div>
                    </div>
                  </div>

                  {/* Financial & Stock Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 py-6 xl:py-0 border-y xl:border-y-0 xl:border-x border-gray-50 xl:px-8">
                    <div>
                       <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">₹{product.price}</p>
                       <p className="text-[10px] font-black text-gray-400 line-through mt-1.5 uppercase tracking-widest">MRP {product.mrp}</p>
                    </div>
                    <div>
                       <p className="text-base font-black text-brand-600 tracking-tight leading-none">{currentComm.toFixed(1)}%</p>
                       <p className="text-[10px] font-black text-gray-400 mt-1.5 uppercase tracking-widest truncate">{commSource} Rate</p>
                    </div>
                    <div className="col-span-2">
                       <div className="flex items-center justify-between mb-2">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${product.stock > 10 ? 'text-emerald-600' : 'text-brand-600'}`}>
                             {product.stock} {product.unit}s In Stock
                          </p>
                          <span className="text-[9px] font-bold text-gray-300">{Math.min(100, Math.round((product.stock / 50) * 100))}%</span>
                       </div>
                       <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${product.stock > 10 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}
                          />
                       </div>
                    </div>
                  </div>

                  {/* Action Terminal */}
                  <div className="flex items-center gap-3 xl:w-48 justify-end">
                    <Link 
                       href={`/admin/products/edit/${product.id}`} 
                       className="flex-1 h-12 flex items-center justify-center gap-2 bg-gray-50 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                    <button 
                       onClick={() => handleDelete(product.id, product.name)}
                      className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
