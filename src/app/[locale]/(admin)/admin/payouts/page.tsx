'use client';
// src/app/(admin)/admin/payouts/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Loader2, IndianRupee, CheckCircle, Clock, AlertTriangle,
  Hash, Send, Store, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Financial Operations</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Vendor Settlements</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Disburse earnings to <span className="text-gray-900 font-bold">{pendingVendors.length} active partners</span> with pending balances.</p>
        </div>
      </div>

      {/* High-Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1">Pending Liquidity</p>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
             <span className="text-xs font-bold text-gray-400">{pendingVendors.length} shop{pendingVendors.length !== 1 ? 's' : ''} awaiting</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle size={24} />
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">{payoutHistory?.payouts.length ?? 0}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Successful Payouts</p>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
             <span className="text-xs font-bold text-gray-400">Total processed instances</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
            <IndianRupee size={24} />
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">
            ₹{(payoutHistory?.payouts.reduce((s, p) => s + p.amount, 0) ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-1">Disbursed Volume</p>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
             <span className="text-xs font-bold text-gray-400">All-time settled amount</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Settlement Pipeline */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Payment Pipeline</p>
             <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-black rounded-md uppercase tracking-widest">{pendingVendors.length} Action Items</span>
          </div>

          {pendingVendors.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Vault Balanced</h3>
              <p className="text-gray-400 text-xs mt-2 font-medium">No pending settlements detected in the system.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVendors.map((v, i) => (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleVendorSelect(v.id)}
                  className={`w-full group flex items-center gap-4 p-4 rounded-[1.75rem] border-2 transition-all duration-300 text-left ${
                    selectedVendorId === v.id
                      ? 'border-orange-500 bg-white shadow-xl shadow-gray-200/50 scale-[1.02]'
                      : 'border-white bg-white shadow-sm hover:border-orange-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${
                    selectedVendorId === v.id ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {v.shopName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{v.shopName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{v.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-sm">₹{v.pendingPayout.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Due Now</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Secure Bank Terminal */}
          {selectedVendor && (selectedVendor.bankAccount || selectedVendor.ifscCode) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-950 text-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Store size={80} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                 Secure Bank Details
              </p>
              <div className="space-y-4">
                 {selectedVendor.bankAccount && (
                   <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Account Number</p>
                      <p className="text-lg font-black tracking-[0.2em] text-blue-400 font-mono">{selectedVendor.bankAccount}</p>
                   </div>
                 )}
                 {selectedVendor.ifscCode && (
                   <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">IFSC Identifier</p>
                      <p className="text-sm font-black tracking-widest font-mono text-gray-300">{selectedVendor.ifscCode}</p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Transaction Terminal */}
        <div className="xl:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Action Module</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Disbursement Terminal</h2>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <Send size={20} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vendor Field */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Selection Authority</label>
                  <div className="relative group">
                    <Store size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <select
                      value={selectedVendorId}
                      onChange={e => handleVendorSelect(e.target.value)}
                      required
                      className="w-full h-16 pl-14 pr-12 text-sm font-black uppercase tracking-wider border-2 border-gray-50 bg-gray-50 rounded-2xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all appearance-none"
                    >
                      <option value="">— Choose Vendor —</option>
                      {pendingVendors.map(v => (
                        <option key={v.id} value={v.id}>{v.shopName} (₹{v.pendingPayout.toLocaleString()})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                  </div>
                </div>

                {/* Amount Field */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Settlement Volume (INR)</label>
                  <div className="relative group">
                    <IndianRupee size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="number"
                      step="0.01"
                      min={0.01}
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full h-16 pl-14 pr-6 text-xl font-black tracking-tight border-2 border-gray-50 bg-gray-50 rounded-2xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  {selectedVendor && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 ml-1"
                    >
                      <AlertTriangle size={12} className="text-amber-500" />
                      Pending Liability: <span className="text-gray-900">₹{selectedVendor.pendingPayout.toLocaleString()}</span>
                    </motion.p>
                  )}
                </div>
              </div>

              {/* UTR Identifier */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Universal Transaction Reference (UTR)</label>
                <div className="relative group">
                  <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    required
                    placeholder="Enter official bank reference code..."
                    className="w-full h-16 pl-14 pr-6 text-sm font-black tracking-widest border-2 border-gray-50 bg-gray-50 rounded-2xl focus:outline-none focus:border-orange-400 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || !selectedVendorId || !utrNumber || !amountInput}
                className="w-full h-16 bg-gray-950 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gray-950/20 hover:bg-orange-600 disabled:opacity-20 active:scale-95"
              >
                {processing ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />}
                Authorize Disbursement
              </button>
            </form>
          </motion.div>

          {/* Ledger History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transaction Ledger</p>
               <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Real-time History</span>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
            ) : !payoutHistory?.payouts.length ? (
              <div className="bg-white rounded-[3rem] p-12 text-center border border-gray-50">
                <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No historical records found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {payoutHistory.payouts.map((payout, i) => (
                  <motion.div 
                    key={payout.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-6 px-6 py-5 bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-500 group-hover:scale-105 transition-transform">
                      <CheckCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                         <p className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{payout.vendor.shopName}</p>
                         <span className="w-1 h-1 rounded-full bg-gray-200" />
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{payout.status}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono tracking-wider truncate">{payout.utrNumber}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-gray-900 text-base">₹{payout.amount.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">
                        {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}