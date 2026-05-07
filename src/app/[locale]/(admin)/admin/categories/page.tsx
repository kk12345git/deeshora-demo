// src/app/(admin)/admin/categories/page.tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Loader2, Tag, Percent, Image as ImageIcon, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AdminCategoriesPage() {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    commissionRate: "0",
    isActive: true,
  });

  const { data: categories, isLoading, refetch } = trpc.product.listAllCategories.useQuery();
  
  const updateMutation = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Category updated!");
      setIsEditing(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (cat: any) => {
    setIsEditing(cat.id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      commissionRate: ((cat.commissionRate ?? 0) * 100).toString(),
      isActive: cat.isActive,
    });
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({
      id,
      name: editForm.name,
      slug: editForm.slug,
      commissionRate: parseFloat(editForm.commissionRate) / 100,
      isActive: editForm.isActive,
    });
  };

  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Architecture Control</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Category Engine</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Configure platform-wide taxonomies and <span className="text-gray-900 font-bold">commission overrides</span>.</p>
        </div>
      </div>

      {/* Categories Ledger */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Segment</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">System Slug</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Yield Rate (%)</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Visibility</th>
              <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-32">
                   <div className="flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                         <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                         <div className="absolute inset-0 blur-2xl bg-orange-500/20 animate-pulse" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Taxonomies...</p>
                   </div>
                </td>
              </tr>
            ) : categories?.map((cat, i) => (
              <motion.tr 
                key={cat.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-orange-50/20 transition-colors"
              >
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner border border-gray-100 group-hover:scale-110 transition-transform duration-500 bg-gray-50 flex items-center justify-center">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-200" />
                      )}
                    </div>
                    {isEditing === cat.id ? (
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-12 px-4 bg-gray-50 border-2 border-orange-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-all w-64"
                      />
                    ) : (
                      <span className="text-base font-black text-gray-950 uppercase tracking-tight">{cat.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-6">
                   {isEditing === cat.id ? (
                      <input 
                        type="text" 
                        value={editForm.slug} 
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="h-12 px-4 bg-gray-50 border-2 border-orange-200 rounded-xl font-mono text-xs outline-none focus:border-orange-500 transition-all w-48"
                      />
                    ) : (
                      <code className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{cat.slug}</code>
                    )}
                </td>
                <td className="px-10 py-6">
                   {isEditing === cat.id ? (
                      <div className="flex items-center gap-2 relative">
                        <input 
                          type="number" 
                          value={editForm.commissionRate} 
                          onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                          className="h-12 px-4 pr-10 bg-gray-50 border-2 border-orange-200 rounded-xl font-black text-sm outline-none focus:border-orange-500 transition-all w-28"
                        />
                        <Percent size={14} className="absolute right-4 text-gray-400" />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-orange-600 tracking-tighter">{((cat.commissionRate ?? 0) * 100).toFixed(1)}%</span>
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Yield Multiplier</span>
                      </div>
                    )}
                </td>
                <td className="px-10 py-6">
                   {isEditing === cat.id ? (
                      <button 
                        onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                        className={`h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 ${
                          editForm.isActive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        {editForm.isActive ? 'Active' : 'Disabled'}
                      </button>
                    ) : (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-current opacity-70 ${
                        cat.isActive 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                      }`}>
                         <span className="w-1 h-1 rounded-full bg-current" />
                         <span className="text-[9px] font-black uppercase tracking-widest">{cat.isActive ? 'Live' : 'Hidden'}</span>
                      </div>
                    )}
                </td>
                <td className="px-10 py-6 text-right">
                  {isEditing === cat.id ? (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleSave(cat.id)} className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg active:scale-90">
                        <Check size={20} />
                      </button>
                      <button onClick={() => setIsEditing(null)} className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(cat)} className="w-12 h-12 text-gray-300 hover:text-orange-600 hover:bg-orange-50 rounded-2xl flex items-center justify-center transition-all group-hover:bg-white active:scale-90">
                      <Edit size={20} />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
