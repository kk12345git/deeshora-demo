// src/app/[locale]/(customer)/profile/addresses/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  MapPin, Plus, Trash2, Home, Briefcase, 
  Navigation, Loader2, ArrowLeft, ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function MyAddressesPage() {
  const utils = trpc.useUtils();
  const { data: addresses = [], isLoading } = trpc.user.myAddresses.useQuery();
  const [isAdding, setIsAdding] = useState(false);
  
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: 'Thiruvottriyur',
    state: 'Tamil Nadu',
    pincode: '',
    isDefault: false
  });

  const addMutation = trpc.user.addAddress.useMutation({
    onSuccess: () => {
      toast.success('Address added!');
      utils.user.myAddresses.invalidate();
      setIsAdding(false);
      setNewAddr({ label: 'Home', line1: '', line2: '', city: 'Thiruvottriyur', state: 'Tamil Nadu', pincode: '', isDefault: false });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = trpc.user.deleteAddress.useMutation({
    onSuccess: () => {
      toast.success('Address removed');
      utils.user.myAddresses.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const labels = ['Home', 'Work', 'Other'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px] mt-0.5">Manage your delivery locations</p>
        </div>
      </div>

      {/* Add Button */}
      {!isAdding && (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center gap-3 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
            <Plus size={18} />
          </div>
          <span className="font-black text-sm uppercase tracking-widest">Add New Address</span>
        </button>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white rounded-[2rem] border-2 border-orange-200 shadow-xl shadow-orange-500/5 p-6 space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900">New Address</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><Trash2 size={18} /></button>
          </div>

          <div className="space-y-4">
            {/* Label Selector */}
            <div className="flex gap-2">
              {labels.map(l => (
                <button
                  key={l}
                  onClick={() => setNewAddr(p => ({ ...p, label: l }))}
                  className={`flex-1 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    newAddr.label === l 
                      ? 'border-orange-500 bg-orange-50 text-orange-600' 
                      : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {l === 'Home' && <Home size={12} className="inline mr-1.5 -mt-0.5" />}
                  {l === 'Work' && <Briefcase size={12} className="inline mr-1.5 -mt-0.5" />}
                  {l}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address / House No *</label>
              <input
                value={newAddr.line1}
                onChange={e => setNewAddr(p => ({ ...p, line1: e.target.value }))}
                placeholder="e.g. #12, Rose Garden Apt"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-300 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area / Landmark (Optional)</label>
              <input
                value={newAddr.line2}
                onChange={e => setNewAddr(p => ({ ...p, line2: e.target.value }))}
                placeholder="e.g. Near Bus Stop, Kathivakkam High Road"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-300 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                <input
                  value={newAddr.city}
                  onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-300 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                <input
                  value={newAddr.pincode}
                  onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="600019"
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-300 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              onClick={() => addMutation.mutate(newAddr)}
              disabled={addMutation.isPending || !newAddr.line1}
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
              Save Address
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100 p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No saved addresses</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 flex items-start gap-4 hover:shadow-xl hover:shadow-gray-500/5 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                {addr.label === 'Home' ? <Home size={22} /> : addr.label === 'Work' ? <Briefcase size={22} /> : <MapPin size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{addr.label}</h3>
                  {addr.isDefault && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Default</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tighter">{addr.city} - {addr.pincode}</p>
              </div>
              <button 
                onClick={() => deleteMutation.mutate({ id: addr.id })}
                disabled={deleteMutation.isPending}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 mt-0.5" />
        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
          Quickly select these addresses during checkout for a faster shopping experience. We prioritize delivery to these saved locations.
        </p>
      </div>
    </div>
  );
}
