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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Marketing</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">Promo Codes</h1>
          <p className="text-gray-400 text-sm mt-0.5">{activeCoupons.length} active · {expiredCoupons.length} disabled</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Code'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Codes',   value: coupons.length, icon: <Tag size={18} />, color: 'blue' },
          { label: 'Active',        value: activeCoupons.length, icon: <CheckCircle size={18} />, color: 'emerald' },
          { label: 'Total Uses',    value: coupons.reduce((s, c) => s + c.usedCount, 0), icon: <Users size={18} />, color: 'purple' },
          { label: 'Disabled',      value: expiredCoupons.length, icon: <AlertTriangle size={18} />, color: 'gray' },
        ].map(card => (
          <div key={card.label} className={`bg-${card.color}-50 border border-${card.color}-100 rounded-2xl p-4`}>
            <div className={`w-9 h-9 bg-${card.color}-100 rounded-xl flex items-center justify-center text-${card.color}-600 mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest text-${card.color}-600 mt-0.5`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border-2 border-orange-300 shadow-xl p-6 space-y-5 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-lg">Create New Code</h2>
            <button type="button" onClick={() => setShowForm(false)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"><X size={15} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <FormField label="Promo Code *">
              <input
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="e.g. DEESHORA50"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all font-mono tracking-wider"
                required
              />
            </FormField>

            {/* Type */}
            <FormField label="Discount Type *">
              <div className="flex gap-2">
                {(['FIXED', 'PERCENT'] as DiscountType[]).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-black transition-all ${
                      form.type === t
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-orange-200'
                    }`}
                  >
                    {t === 'FIXED' ? <><IndianRupee size={12} /> Fixed ₹</> : <><Percent size={12} /> Percent %</>}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Value */}
            <FormField label={form.type === 'FIXED' ? 'Discount Amount (₹) *' : 'Discount Percent (%) *'}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {form.type === 'FIXED' ? <IndianRupee size={13} /> : <Percent size={13} />}
                </span>
                <input
                  type="number" min={1} max={form.type === 'PERCENT' ? 100 : undefined} step={form.type === 'PERCENT' ? 1 : 0.01}
                  value={form.value}
                  onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  placeholder={form.type === 'FIXED' ? '50' : '10'}
                  className="input-style pl-10"
                  required
                />
              </div>
            </FormField>

            {/* Min order */}
            <FormField label="Minimum Order (₹)">
              <div className="relative">
                <IndianRupee size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number" min={0}
                  value={form.minOrder}
                  onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
                  placeholder="0 = no minimum"
                  className="input-style pl-10"
                />
              </div>
            </FormField>

            {/* Max uses */}
            <FormField label="Max Uses">
              <div className="relative">
                <Users size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number" min={0}
                  value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="0 = unlimited"
                  className="input-style pl-10"
                />
              </div>
            </FormField>

            {/* Expiry */}
            <FormField label="Expires At (optional)">
              <div className="relative">
                <Calendar size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="input-style pl-10"
                />
              </div>
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1 h-11 rounded-xl flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Create Coupon
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary h-11 px-5 rounded-xl">Cancel</button>
          </div>
        </form>
      )}

      {/* Coupon list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Tag size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400">No promo codes yet</p>
          <p className="text-xs text-gray-300 mt-1">Create your first code above</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {coupons.map(coupon => {
            const isExpiredByDate = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
            const isMaxed = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
            const usagePct = coupon.maxUses > 0 ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : null;

            return (
              <div key={coupon.id} className={`flex items-center gap-4 px-5 py-4 ${!coupon.isActive ? 'opacity-50' : ''}`}>
                {/* Type icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  coupon.type === 'FIXED' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {coupon.type === 'FIXED' ? <IndianRupee size={18} /> : <Percent size={18} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-gray-900 text-sm tracking-wider">{coupon.code}</span>
                    {!coupon.isActive && <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Disabled</span>}
                    {isExpiredByDate && <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Expired</span>}
                    {isMaxed && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Maxed</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-bold text-orange-500">
                      {coupon.type === 'FIXED' ? `₹${coupon.value} off` : `${coupon.value}% off`}
                    </span>
                    {coupon.minOrder > 0 && <span className="text-[10px] text-gray-400">min ₹{coupon.minOrder}</span>}
                    <span className="text-[10px] text-gray-400">
                      {coupon.usedCount} used{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ''}
                    </span>
                    {coupon.expiresAt && (
                      <span className="text-[10px] text-gray-400">
                        expires {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  {usagePct !== null && (
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden w-40">
                      <div className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-400' : 'bg-orange-400'}`} style={{ width: `${usagePct}%` }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                    title={coupon.isActive ? 'Disable' : 'Enable'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      coupon.isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'
                    }`}
                  >
                    {coupon.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>

                  {/* Delete */}
                  {deleteConfirm === coupon.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate({ id: coupon.id })}
                        disabled={deleteMutation.isPending}
                        className="text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
                      >
                        {deleteMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : 'Confirm'}
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-1.5 py-1.5">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(coupon.id)}
                      className="w-9 h-9 bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
