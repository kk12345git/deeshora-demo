'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Loader2, Download, FileText, Search, TrendingUp, 
  ArrowUpRight, AlertCircle, Calendar, Filter, Users,
  ShieldCheck, Receipt, BarChart3, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTaxPage() {
  const [period, setPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL'>('MONTHLY');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = trpc.admin.gstReport.useQuery({ period });

  const exportToCSV = () => {
    if (!data?.vendors) return;
    
    const headers = ['Shop Name', 'GSTIN', 'Taxable Turnover (₹)', 'GST Collected (₹)', 'Gross Total (₹)'];
    const rows = data.vendors.map(v => [
      v.shopName,
      v.gstNumber,
      v.taxableAmount.toFixed(2),
      v.gstAmount.toFixed(2),
      v.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Deeshora_GST_Report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded!');
  };

  const filteredVendors = data?.vendors.filter(v => 
    v.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Governance Protocol</p>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none uppercase">Tax Control</h1>
          <p className="text-gray-400 font-bold mt-3 text-sm flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Regulatory reconciliation and GST automated auditing
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20"
        >
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  period === p ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={exportToCSV}
            disabled={!data?.vendors.length}
            className="flex items-center gap-3 bg-gray-950 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-2xl active:scale-95 disabled:opacity-20"
          >
            <Download size={14} /> Commit Export
          </button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="relative">
             <div className="w-24 h-24 border-4 border-gray-50 border-t-orange-500 rounded-full animate-spin" />
             <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200" size={32} />
          </div>
          <p className="font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Aggregating Ledger Data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-950 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-gray-900/40"
            >
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all group-hover:rotate-12 duration-700">
                  <TrendingUp size={140} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-6">Aggregate Liability</p>
               <h3 className="text-6xl font-black flex items-start gap-1 tracking-tighter">
                 <span className="text-2xl mt-2 opacity-30">₹</span>
                 {data?.summary.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
               </h3>
               <div className="mt-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  Audit Period: {period} RECONCILIATION
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group"
            >
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6">Taxable Turnover</p>
               <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
                 <span className="text-xl mr-1 text-gray-200">₹</span>
                 {data?.summary.totalTaxable.toLocaleString('en-IN')}
               </h3>
               <div className="mt-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                    <ArrowUpRight size={10} /> Certified
                  </div>
                  <Users size={24} className="text-gray-100" />
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group"
            >
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6">Active Contributors</p>
               <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
                 {data?.summary.vendorsCount} <span className="text-xl text-gray-200 uppercase tracking-widest font-black ml-2">Partners</span>
               </h3>
               <div className="mt-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100">
                    <Filter size={10} /> Validated
                  </div>
                  <Receipt size={24} className="text-gray-100" />
               </div>
            </motion.div>
          </div>

          {/* Vendor Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-gray-200/30 overflow-hidden"
          >
            <div className="px-10 py-10 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
                  Liability Ledger
                  <span className="text-[10px] font-black text-emerald-500 px-3 py-1 bg-emerald-50 rounded-full tracking-widest">REAL-TIME SYNC</span>
                </h2>
                <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-widest">Individual Partner Tax Breakdown</p>
              </div>
              <div className="relative group">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                <input 
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="SEARCH MERCHANT OR GSTIN..." 
                   className="pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] w-full xl:w-[400px] font-black text-xs uppercase tracking-widest focus:border-orange-200 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Merchant Identity</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">GST Registration</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Taxable amount</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">GST collected</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Final Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filteredVendors?.map((v, i) => (
                      <motion.tr 
                        key={v.shopName}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50/80 transition-colors group cursor-default"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all uppercase">
                               {v.shopName[0]}
                            </div>
                            <p className="font-black text-gray-900 uppercase tracking-tight text-base">{v.shopName}</p>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-2">
                             <span className={`px-4 py-2 rounded-xl font-mono text-[10px] font-black tracking-widest ${v.gstNumber === 'No GSTIN' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                               {v.gstNumber}
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <p className="font-bold text-gray-400 text-sm tracking-tight">₹{v.taxableAmount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <p className="font-black text-gray-900 text-base tracking-tighter">₹{v.gstAmount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <div className="text-right">
                                <p className="font-black text-gray-900 text-lg tracking-tighter">₹{v.total.toLocaleString('en-IN')}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">Ready for Disbursal</p>
                             </div>
                             <ChevronRight size={16} className="text-gray-200 group-hover:text-orange-500 transition-all translate-x-0 group-hover:translate-x-1" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {!filteredVendors?.length && (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                           <AlertCircle className="text-gray-200" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ledger Inactive</h3>
                        <p className="font-black text-gray-400 uppercase tracking-[0.2em] mt-2">No merchant data found for the current filter criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}


