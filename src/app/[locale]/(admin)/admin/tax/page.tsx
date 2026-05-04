// src/app/(admin)/admin/tax/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Loader2, Download, FileText, Search, TrendingUp, 
  ArrowUpRight, AlertCircle, Calendar, Filter, Users 
} from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
             <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Compliance Hub</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Tax Center</h1>
          <p className="text-gray-400 font-bold mt-2 text-sm">Regulatory reporting and GST reconciliation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 p-1 rounded-2xl shadow-sm">
            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  period === p ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={exportToCSV}
            disabled={!data?.vendors.length}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
             <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-200" size={24} />
          </div>
          <p className="font-black text-gray-400 uppercase tracking-widest animate-pulse">Aggregating Tax Data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={80} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Total GST Collected</p>
               <h3 className="text-5xl font-black mt-3 flex items-start gap-1">
                 <span className="text-2xl mt-1.5 opacity-50">₹</span>
                 {data?.summary.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
               </h3>
               <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Calendar size={14} className="text-orange-500" />
                  <span>Reported as of {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group mt-4 md:mt-0">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Taxable Turnover</p>
               <h3 className="text-4xl font-black text-gray-900 mt-2">
                 ₹{data?.summary.totalTaxable.toLocaleString('en-IN')}
               </h3>
               <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ArrowUpRight size={10} /> Compliant
                  </div>
                  <Users size={20} className="text-gray-100" />
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group mt-4 md:mt-0">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Vendors Reporting</p>
               <h3 className="text-4xl font-black text-gray-900 mt-2">
                 {data?.summary.vendorsCount} <span className="text-lg text-gray-300">Partners</span>
               </h3>
               <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Filter size={10} /> Structured
                  </div>
                  <FileText size={20} className="text-gray-100" />
               </div>
            </div>
          </div>

          {/* Vendor Table */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                Vendor Liabilities <span className="text-xs font-bold text-gray-300 px-2 py-0.5 border rounded-lg">LIVE</span>
              </h2>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="Search vendor or GSTIN..." 
                   className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl w-full sm:w-72 font-bold text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor / Shop</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">GSTIN</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Taxable amount</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">GST collected</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Total settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVendors?.map((v) => (
                    <tr key={v.shopName} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase tracking-tight text-sm">{v.shopName}</p>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${v.gstNumber === 'No GSTIN' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {v.gstNumber}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <p className="font-bold text-gray-500 text-sm">₹{v.taxableAmount.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <p className="font-black text-gray-900 text-sm">₹{v.gstAmount.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                           <p className="font-black text-gray-900 text-sm">₹{v.total.toLocaleString('en-IN')}</p>
                           <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Disbursable</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredVendors?.length && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <AlertCircle className="mx-auto text-gray-200 mb-4" size={40} />
                        <p className="font-black text-gray-400 uppercase tracking-widest">No reporting vendors found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
