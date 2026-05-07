'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  X, Store, Phone, Mail, 
  MapPin, Tag, Loader2, Shield, Percent
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendor: any; // Using any for simplicity, but ideally typed
}

export function EditVendorModal({ isOpen, onClose, onSuccess, vendor }: Props) {
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    category: '',
    commissionRate: 15,
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        shopName: vendor.shopName || '',
        description: vendor.description || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        city: vendor.city || 'Chennai',
        address: vendor.address || '',
        category: vendor.category || 'Groceries',
        commissionRate: (vendor.commissionRate || 0.15) * 100,
      });
    }
  }, [vendor]);

  const updateMutation = trpc.admin.updateVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor details updated successfully! 🪄');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Vendor Details</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Oversight Control</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => setFormData(p => ({ ...p, shopName: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commission Rate (%)</label>
                <div className="relative">
                  <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData(p => ({ ...p, commissionRate: parseFloat(e.target.value) }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all appearance-none"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Vegetables">Vegetables & Fruits</option>
                    <option value="Meat">Meat & Fish</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home Decor">Home Decor</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Gifts">Gifts & Sweets</option>
                    <option value="Health">Health & Wellness</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                rows={2}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all resize-none"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ 
              id: vendor.id, 
              ...formData, 
              commissionRate: formData.commissionRate / 100 
            })}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:bg-gray-200 disabled:shadow-none flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
