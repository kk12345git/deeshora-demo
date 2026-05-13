'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  X, Store, Phone, MapPin, 
  Loader2, IndianRupee, Tag, CreditCard,
  Building2, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Groceries', 'Fruits & Vegetables', 'Meat & Fish', 
  'Bakery & Dairy', 'Pharmacy', 'Electronics', 
  'Fashion', 'Home & Kitchen', 'Pet Care'
];

export function EditVendorModal({ isOpen, onClose, vendor, onSuccess }: EditVendorModalProps) {
  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    city: '',
    categories: [] as string[],
    commissionRate: 15,
    bankAccount: '',
    ifscCode: '',
    upiId: '',
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        shopName: vendor.shopName || '',
        phone: vendor.phone || '',
        city: vendor.city || '',
        categories: vendor.categories || [],
        commissionRate: Math.round(vendor.commissionRate * 100),
        bankAccount: vendor.bankAccount || '',
        ifscCode: vendor.ifscCode || '',
        upiId: vendor.upiId || '',
      });
    }
  }, [vendor]);

  const updateCommissionMutation = trpc.admin.updateVendorCommission.useMutation({
    onSuccess: () => {
      toast.success('Settings updated!');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen || !vendor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommissionMutation.mutate({
      vendorId: vendor.id,
      rate: formData.commissionRate,
    });
    // Note: Other fields would need a more generic update mutation if required
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
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-3xl -mr-16 -mt-16 rounded-full" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Edit Vendor Settings</h2>
            <p className="text-gray-400 font-bold text-sm mt-1">{formData.shopName} · {vendor.user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Store size={12} /> Shop Name
              </label>
              <input 
                type="text"
                value={formData.shopName}
                onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900"
              />
            </div>

            {/* Commission */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-brand-500" /> Platform Commission (%)
              </label>
              <input 
                type="number"
                value={formData.commissionRate}
                onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-brand-100 rounded-2xl px-5 py-3 text-sm font-black text-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Bank Acc */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={12} /> Bank Account
              </label>
              <input 
                type="text"
                value={formData.bankAccount}
                onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold"
              />
            </div>

            {/* IFSC */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} /> IFSC Code
              </label>
              <input 
                type="text"
                value={formData.ifscCode}
                onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold"
              />
            </div>

            {/* UPI */}
            <div className="col-span-full space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={12} className="text-blue-500" /> Merchant UPI ID (for direct payments)
              </label>
              <input 
                type="text"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="vendor@upi"
                className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-3 text-sm font-bold text-blue-700"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} /> Shop Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    formData.categories.includes(cat)
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-500 border border-gray-100'
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
              disabled={updateCommissionMutation.isPending}
              className="flex-[2] bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-black text-sm py-4 rounded-2xl transition-all shadow-xl shadow-black/20 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {updateCommissionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
