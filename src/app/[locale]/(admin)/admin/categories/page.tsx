// src/app/(admin)/admin/categories/page.tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Loader2, Tag, Percent, Image as ImageIcon, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">Category Engine</h1>
          <p className="text-gray-500 font-medium">Manage platform-wide defaults and commission overrides.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Slug</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission (%)</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-orange-500" />
                </td>
              </tr>
            ) : categories?.map((cat) => (
              <tr key={cat.id} className="group hover:bg-orange-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden bg-white relative">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    {isEditing === cat.id ? (
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input-style h-10 w-48"
                      />
                    ) : (
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                   {isEditing === cat.id ? (
                      <input 
                        type="text" 
                        value={editForm.slug} 
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="input-style h-10 w-40"
                      />
                    ) : (
                      <code className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{cat.slug}</code>
                    )}
                </td>
                <td className="px-8 py-6">
                   {isEditing === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={editForm.commissionRate} 
                          onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                          className="input-style h-10 w-20"
                        />
                        <Percent size={14} className="text-gray-400" />
                      </div>
                    ) : (
                      <span className="font-black text-orange-600">{((cat.commissionRate ?? 0) * 100).toFixed(1)}%</span>
                    )}
                </td>
                <td className="px-8 py-6">
                   {isEditing === cat.id ? (
                      <button 
                        onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                        className={`h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors ${editForm.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                      >
                        {editForm.isActive ? 'Active' : 'Disabled'}
                      </button>
                    ) : (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${cat.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {cat.isActive ? 'Live' : 'Hidden'}
                      </span>
                    )}
                </td>
                <td className="px-8 py-6 text-right">
                  {isEditing === cat.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleSave(cat.id)} className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setIsEditing(null)} className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(cat)} className="w-10 h-10 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl flex items-center justify-center transition-all">
                      <Edit size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
