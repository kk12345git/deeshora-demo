'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  X, Store, Phone, Mail, MapPin, 
  ChevronRight, Loader2, IndianRupee, Tag 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Groceries', 'Fruits & Vegetables', 'Meat & Fish', 
  'Bakery & Dairy', 'Pharmacy', 'Electronics', 
  'Fashion', 'Home & Kitchen', 'Pet Care'
];

export function CreateVendorModal({ isOpen, onClose, user, onSuccess }: CreateVendorModalProps) {
  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    city: '',
    categories: [] as string[],
    commissionRate: 15,
  });

  const createVendorMutation = trpc.admin.createVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor created successfully!');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVendorMutation.mutate({
      userId: user.id,
      email: user.email,
      ...formData,
    });
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-brand-500 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Promote to Vendor</h2>
            <p className="text-white/80 font-bold text-sm mt-1">Onboarding {user.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Store size={12} className="text-brand-500" /> Shop Name
              </label>
              <input 
                required
                type="text"
                value={formData.shopName}
                onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="Enter shop name"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-brand-500" /> Business Phone
              </label>
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9189393..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} className="text-brand-500" /> City / Location
              </label>
              <input 
                required
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Thiruvottriyur"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Commission */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-brand-500" /> Commission (%)
              </label>
              <input 
                required
                type="number"
                value={formData.commissionRate}
                onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} className="text-brand-500" /> Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    formData.categories.includes(cat)
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105'
                      : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-brand-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-sm text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              disabled={createVendorMutation.isPending || formData.categories.length === 0}
              className="flex-[2] bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-black text-sm py-4 rounded-2xl transition-all shadow-xl shadow-brand-500/20 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {createVendorMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
