'use client';
// src/app/(admin)/admin/coupons/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { DiscountType } from '@prisma/client';
import {
  Tag, Plus, Loader2, ToggleLeft, ToggleRight, Trash2,
  IndianRupee, Percent, Calendar, Users, X, CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_FORM = {
  code: '', type: 'FIXED' as DiscountType, value: '', minOrder: '', maxUses: '', expiresAt: '',
};

export default function AdminCouponsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: coupons = [], isLoading, refetch } = trpc.coupon.list.useQuery();

  const createMutation = trpc.coupon.create.useMutation({
    onSuccess: () => {
      toast.success('Coupon created! 🎉');
      setForm(INITIAL_FORM);
      setShowForm(false);
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const toggleMutation = trpc.coupon.toggle.useMutation({
    onSuccess: () => refetch(),
    onError: err => toast.error(err.message),
  });

  const deleteMutation = trpc.coupon.delete.useMutation({
    onSuccess: () => { toast.success('Coupon deleted'); setDeleteConfirm(null); refetch(); },
    onError: err => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) { toast.error('Code and value are required'); return; }
    createMutation.mutate({
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : 0,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });
  };

  const activeCoupons  = coupons.filter(c => c.isActive);
  const expiredCoupons = coupons.filter(c => !c.isActive);

  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Promotion Engine</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketing Incentives</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Directing <span className="text-gray-900 font-bold">{activeCoupons.length} active campaigns</span> to drive customer conversion.</p>
        </div>
        
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center justify-center gap-3 bg-gray-950 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-gray-950/10 active:scale-95 group"
        >
          {showForm ? <X size={18} /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
          {showForm ? 'Abort Operation' : 'Create Campaign'}
        </button>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Codes',   value: coupons.length, icon: <Tag size={20} />, color: 'blue' },
          { label: 'Active States', value: activeCoupons.length, icon: <CheckCircle size={20} />, color: 'emerald' },
          { label: 'System Reach',  value: coupons.reduce((s, c) => s + c.usedCount, 0), icon: <Users size={20} />, color: 'purple' },
          { label: 'Stale Assets',  value: expiredCoupons.length, icon: <AlertTriangle size={20} />, color: 'gray' },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
               card.color === 'blue' ? 'bg-blue-50 text-blue-500' :
               card.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
               card.color === 'purple' ? 'bg-purple-50 text-purple-500' :
               'bg-gray-50 text-gray-400'
            }`}>
              {card.icon}
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{card.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Campaign Architect */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] border-2 border-orange-500/20 shadow-2xl p-10 space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Tag size={120} />
          </div>
          
          <div className="flex items-center justify-between border-b border-gray-50 pb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Architect Module</p>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Configure New Incentive</h2>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FormField label="Campaign Identifier">
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  placeholder="E.G. FESTIVAL50"
                  className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl font-mono text-sm font-black tracking-widest outline-none focus:border-orange-400 focus:bg-white transition-all uppercase"
                  required
                />
              </FormField>

              <FormField label="Discount Mechanism">
                <div className="flex gap-3 h-16">
                  {(['FIXED', 'PERCENT'] as DiscountType[]).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                        form.type === t
                          ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-orange-200'
                      }`}
                    >
                      {t === 'FIXED' ? <IndianRupee size={14} /> : <Percent size={14} />}
                      {t === 'FIXED' ? 'Flat INR' : 'Percent'}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Yield Value">
                <div className="relative group">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      {form.type === 'FIXED' ? <IndianRupee size={16} /> : <Percent size={16} />}
                   </div>
                   <input
                     type="number" min={1} max={form.type === 'PERCENT' ? 100 : undefined} step={form.type === 'PERCENT' ? 1 : 0.01}
                     value={form.value}
                     onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                     placeholder="0.00"
                     className="w-full h-16 pl-12 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl font-black text-lg outline-none focus:border-orange-400 focus:bg-white transition-all"
                     required
                   />
                </div>
              </FormField>

              <FormField label="Min. Activation Threshold">
                <div className="relative group">
                  <IndianRupee size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number" min={0}
                    value={form.minOrder}
                    onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
                    placeholder="None"
                    className="w-full h-16 pl-12 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl font-black text-sm outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>
              </FormField>

              <FormField label="Usage Capacity">
                <div className="relative group">
                  <Users size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number" min={0}
                    value={form.maxUses}
                    onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full h-16 pl-12 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl font-black text-sm outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>
              </FormField>

              <FormField label="System Expiration">
                <div className="relative group">
                  <Calendar size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full h-16 pl-12 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-orange-400 focus:bg-white transition-all appearance-none"
                  />
                </div>
              </FormField>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-16 flex-1 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gray-950/20 hover:bg-orange-600 disabled:opacity-20 active:scale-95"
              >
                {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                Deploy Incentive
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="h-16 px-8 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Asset Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Campaign Directory</p>
           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Real-time Management</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Syncing Promo Assets...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 p-16 text-center shadow-sm">
            <Tag size={48} className="mx-auto text-gray-100 mb-4" />
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">No active campaigns</h3>
            <p className="text-gray-400 text-sm mt-3 font-medium">Initiate your first promo code to accelerate platform growth.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {coupons.map((coupon, i) => {
              const isExpiredByDate = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
              const isMaxed = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
              const usagePct = coupon.maxUses > 0 ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : null;

              return (
                <motion.div 
                  key={coupon.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-8 transition-all hover:shadow-xl hover:shadow-gray-200/50 ${!coupon.isActive ? 'grayscale opacity-60' : ''}`}
                >
                  {/* Status Visual */}
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 ${
                    coupon.type === 'FIXED' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                  }`}>
                    {coupon.type === 'FIXED' ? <IndianRupee size={24} /> : <Percent size={24} />}
                  </div>

                  {/* Core Data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono font-black text-gray-950 text-lg tracking-widest uppercase">{coupon.code}</span>
                      <div className="flex gap-2">
                        {!coupon.isActive && <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">Suspended</span>}
                        {isExpiredByDate && <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">Expired</span>}
                        {isMaxed && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">Depleted</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-orange-600 tracking-tight leading-none">
                            {coupon.type === 'FIXED' ? `₹${coupon.value.toLocaleString()} Instant` : `${coupon.value}% Yield`}
                         </span>
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">Incentive Tier</span>
                      </div>
                      
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-gray-900 tracking-tight leading-none">
                            {coupon.minOrder > 0 ? `₹${coupon.minOrder.toLocaleString()}` : 'None'}
                         </span>
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">Min. Order</span>
                      </div>

                      <div className="flex flex-col">
                         <span className="text-sm font-black text-gray-900 tracking-tight leading-none">
                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '∞'}
                         </span>
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5">Availability</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Matrix */}
                  <div className="md:w-48">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{coupon.usedCount} Redemptions</span>
                       <span className="text-[9px] font-bold text-gray-300">{usagePct !== null ? `${Math.round(usagePct)}%` : 'Active'}</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${usagePct ?? 100}%` }}
                         transition={{ duration: 1 }}
                         className={`h-full rounded-full ${usagePct !== null && usagePct >= 90 ? 'bg-red-500' : 'bg-orange-500'}`} 
                       />
                    </div>
                  </div>

                  {/* Operational Terminal */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        coupon.isActive 
                        ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' 
                        : 'bg-gray-50 text-gray-300 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {coupon.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    {deleteConfirm === coupon.id ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                        <button
                          onClick={() => deleteMutation.mutate({ id: coupon.id })}
                          disabled={deleteMutation.isPending}
                          className="h-12 px-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-500/20 active:scale-95"
                        >
                          {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-900"><X size={18} /></button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(coupon.id)}
                        className="w-12 h-12 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      {children}
    </div>
  );
}
