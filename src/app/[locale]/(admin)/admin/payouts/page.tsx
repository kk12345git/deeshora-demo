'use client';
// src/app/(admin)/admin/payouts/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Loader2, IndianRupee, CheckCircle, Clock, AlertTriangle,
  Hash, Send, Store, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPayoutsPage() {
  const { data: vendorsData, refetch: refetchVendors } = trpc.admin.vendors.useQuery({});
  const { data: payoutHistory, isLoading: historyLoading, refetch: refetchHistory } = trpc.admin.payouts.useQuery({});

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [processing, setProcessing] = useState(false);

  const processPayoutMutation = trpc.admin.processPayout.useMutation({
    onSuccess: () => {
      toast.success('Payout processed and recorded! ✅');
      refetchVendors();
      refetchHistory();
      setSelectedVendorId('');
      setUtrNumber('');
      setAmountInput('');
      setProcessing(false);
    },
    onError: err => { toast.error(err.message); setProcessing(false); },
  });

  const pendingVendors = (vendorsData?.vendors ?? []).filter(v => v.pendingPayout > 0);
  const selectedVendor = pendingVendors.find(v => v.id === selectedVendorId);

  // Auto-fill amount when vendor is selected
  const handleVendorSelect = (id: string) => {
    setSelectedVendorId(id);
    const v = pendingVendors.find(v => v.id === id);
    if (v) setAmountInput(v.pendingPayout.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !utrNumber || !amountInput) { toast.error('Fill all fields'); return; }
    setProcessing(true);
    processPayoutMutation.mutate({
      vendorId: selectedVendorId,
      amount: parseFloat(amountInput),
      utrNumber: utrNumber.trim(),
    });
  };

  const totalPending = pendingVendors.reduce((s, v) => s + v.pendingPayout, 0);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Finance</p>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">Payouts</h1>
        <p className="text-gray-400 text-sm mt-0.5">Settle vendor earnings and track payment history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-3">
            <Clock size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900">₹{totalPending.toFixed(0)}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-0.5">Total Pending</p>
          <p className="text-xs text-gray-400 mt-0.5">{pendingVendors.length} vendor{pendingVendors.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900">{payoutHistory?.payouts.length ?? 0}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5">Total Paid</p>
          <p className="text-xs text-gray-400 mt-0.5">All-time payouts</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-3">
            <IndianRupee size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900">
            ₹{(payoutHistory?.payouts.reduce((s, p) => s + p.amount, 0) ?? 0).toFixed(0)}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-0.5">Total Settled</p>
          <p className="text-xs text-gray-400 mt-0.5">All-time disbursed</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Pending Vendors + Form */}
        <div className="space-y-5">
          {/* Pending vendor cards */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Pending Payouts</p>
            {pendingVendors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-300 mb-2" />
                <p className="text-sm font-bold text-gray-400">All settled!</p>
                <p className="text-xs text-gray-300 mt-1">No pending payouts right now</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingVendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVendorSelect(v.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                      selectedVendorId === v.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 bg-white hover:border-orange-200'
                    }`}
                  >
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 font-black text-sm flex-shrink-0">
                      {v.shopName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">{v.shopName}</p>
                      <p className="text-xs text-gray-400 truncate">{v.city}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-amber-600 text-sm">₹{v.pendingPayout.toFixed(0)}</p>
                      <p className="text-[9px] text-gray-400">pending</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bank details if vendor selected */}
          {selectedVendor && (selectedVendor.bankAccount || selectedVendor.ifscCode) && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                🏦 Bank Details
              </p>
              {selectedVendor.bankAccount && (
                <p className="text-xs font-mono text-gray-700">{selectedVendor.bankAccount}</p>
              )}
              {selectedVendor.ifscCode && (
                <p className="text-xs font-mono text-gray-500">{selectedVendor.ifscCode}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Payout Form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Payout</p>
              <h2 className="font-black text-gray-900 text-lg mt-0.5">Process Payment</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Vendor select */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Vendor</label>
                <div className="relative">
                  <Store size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedVendorId}
                    onChange={e => handleVendorSelect(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 text-sm font-bold border-2 border-transparent bg-gray-50 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all appearance-none"
                  >
                    <option value="">— Select a vendor —</option>
                    {pendingVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.shopName} (₹{v.pendingPayout.toFixed(2)} pending)</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 text-sm font-bold border-2 border-transparent bg-gray-50 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all"
                  />
                </div>
                {selectedVendor && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <AlertTriangle size={9} className="text-amber-500" />
                    Full pending amount: <strong className="text-amber-600">₹{selectedVendor.pendingPayout.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              {/* UTR */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">UTR / Transaction ID</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    required
                    placeholder="e.g. UTR0987654321"
                    className="w-full pl-10 pr-4 py-3 text-sm font-bold border-2 border-transparent bg-gray-50 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || !selectedVendorId || !utrNumber || !amountInput}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Confirm Payout
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payout History */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Payout History</p>
        {historyLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : !payoutHistory?.payouts.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <p className="font-bold text-sm">No payouts processed yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {payoutHistory.payouts.map(payout => (
                <div key={payout.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">{payout.vendor.shopName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{payout.utrNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-emerald-600 text-sm">₹{payout.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}