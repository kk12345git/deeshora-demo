'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  X, Store, User, Phone, Mail, 
  MapPin, Tag, Loader2, Check, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateVendorModal({ isOpen, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    phone: '',
    email: '',
    city: 'Chennai',
    address: '',
    category: 'Groceries',
  });

  const { data: usersData, isLoading: isLoadingUsers } = trpc.admin.users.useQuery({ 
    search, 
    limit: 5 
  }, {
    enabled: search.length > 2
  });

  const createMutation = trpc.admin.createVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor created and approved! 🎉');
      onSuccess();
      onClose();
      // Reset form
      setSelectedUserId(null);
      setFormData({
        shopName: '',
        description: '',
        phone: '',
        email: '',
        city: 'Chennai',
        address: '',
        category: 'Groceries',
      });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen) return null;

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
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Onboard New Vendor</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Manual Registration</p>
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
          {/* Step 1: Select User */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">1</div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Identify Owner</h3>
            </div>

            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user by name or email (min 3 chars)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
              />
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold px-4">
                <Loader2 size={12} className="animate-spin" /> Searching users...
              </div>
            ) : usersData?.users && usersData.users.length > 0 ? (
              <div className="grid gap-2">
                {usersData.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setFormData(prev => ({ ...prev, email: user.email }));
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      selectedUserId === user.id 
                      ? 'border-orange-500 bg-orange-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900">{user.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    {selectedUserId === user.id && (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : search.length > 2 && (
              <p className="text-center py-4 text-xs font-bold text-gray-400 italic">No users found matching your search.</p>
            )}
          </section>

          {/* Step 2: Shop Details */}
          <section className={`space-y-6 transition-opacity ${!selectedUserId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">2</div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Shop Information</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter shop name"
                    value={formData.shopName}
                    onChange={(e) => setFormData(p => ({ ...p, shopName: e.target.value }))}
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
                    placeholder="10-digit mobile number"
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
                    placeholder="Shop email address"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                <textarea
                  placeholder="Street, Landmark, City, Pincode"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Admin Guarantee</p>
                <p className="text-[10px] text-blue-700 font-medium">As an admin, this vendor will be automatically approved and their user account will be granted Vendor access instantly.</p>
              </div>
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
            disabled={!selectedUserId || !formData.shopName || createMutation.isPending}
            onClick={() => createMutation.mutate({ ...formData, userId: selectedUserId! })}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-orange-600 hover:shadow-orange-500/20 transition-all disabled:bg-gray-200 disabled:shadow-none flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Finalizing...
              </>
            ) : (
              'Create Vendor Account'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
