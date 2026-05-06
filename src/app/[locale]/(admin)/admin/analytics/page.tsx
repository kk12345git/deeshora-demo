// src/app/(admin)/admin/analytics/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import {
  BarChart2, TrendingUp, Store, ShoppingCart, IndianRupee,
  Users, Package, Award, Loader2, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';

type Period = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

const PERIOD_LABELS: Record<Period, string> = {
  MONTHLY: 'This Month',
  QUARTERLY: 'Last 3 Months',
  HALF_YEARLY: 'Last 6 Months',
  ANNUAL: 'Last 12 Months',
};

const PERIOD_OPTIONS: Period[] = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'];

function StatCard({ title, value, sub, icon, colorBg, colorText }: {
  title: string; value: string; sub: string;
  icon: React.ReactNode; colorBg: string; colorText: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 ${colorBg} ${colorText} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className={`text-[10px] font-black uppercase tracking-widest ${colorText} mt-0.5`}>{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('QUARTERLY');
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const { data: platformData, isLoading: isPlatformLoading } = trpc.admin.platformAnalytics.useQuery({ period });
  const { data: vendorData, isLoading: isVendorLoading } = trpc.admin.vendorAnalytics.useQuery({ period });

  const maxRevenue = Math.max(...(vendorData?.vendorStats.map(v => v.revenue) ?? [1]), 1);
  const maxMonthlyRevenue = Math.max(...(vendorData?.monthlyBreakdown.map((m: any) => Number(m.revenue)) ?? [1]), 1);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black rounded-md uppercase tracking-widest">Financials</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Market Intelligence</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Platform Insights</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Detailed analysis of marketplace growth and vendor performance.</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                period === p 
                  ? 'bg-gray-950 text-white shadow-xl shadow-gray-950/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={12} className={period === p ? 'text-blue-400' : ''} />
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Summary Cards */}
      {isPlatformLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : platformData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Gross Merchandise Value" 
            value={`₹${platformData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            sub={`Volume for ${PERIOD_LABELS[period]}`} 
            icon={<ShoppingCart size={22} />}
            colorBg="bg-blue-500" colorText="text-white"
          />
          <StatCard
            title="Platform Commission" 
            value={`₹${platformData.platformCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            sub="Net earnings" 
            icon={<IndianRupee size={22} />}
            colorBg="bg-emerald-500" colorText="text-white"
          />
          <StatCard
            title="Total Order Count" 
            value={platformData.totalOrders.toString()}
            sub="Successful transactions" 
            icon={<Package size={22} />}
            colorBg="bg-purple-500" colorText="text-white"
          />
          <StatCard
            title="Customer Growth" 
            value={platformData.newUsers.toString()}
            sub={`${platformData.newVendors} vendors joined`} 
            icon={<Users size={22} />}
            colorBg="bg-orange-500" colorText="text-white"
          />
        </div>
      )}

      {/* Primary Insights Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform pointer-events-none">
            <TrendingUp size={240} />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                <TrendingUp size={12} /> Revenue Flow
              </p>
              <h2 className="text-2xl font-black text-gray-900 mt-1">Growth Trajectory</h2>
            </div>
          </div>

          {isVendorLoading ? (
            <div className="h-56 bg-gray-50 rounded-[1.5rem] animate-pulse" />
          ) : (
            <div className="flex items-end gap-5 h-56 relative z-10">
              {vendorData?.monthlyBreakdown.map((m: any, i: number) => {
                const rev = Number(m.revenue);
                const pct = Math.max((rev / maxMonthlyRevenue) * 100, rev > 0 ? 8 : 2);
                const isLatest = i === vendorData.monthlyBreakdown.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-3 group/bar relative">
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-gray-950 text-white text-[10px] font-black px-3 py-2 rounded-xl whitespace-nowrap z-20 shadow-2xl -translate-y-2 group-hover/bar:translate-y-0 text-center">
                      <p className="text-blue-400">₹{Math.round(rev).toLocaleString('en-IN')}</p>
                      <p className="text-gray-500">{m.orders} Orders</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
                    </div>
                    
                    <div className="w-full relative flex flex-col justify-end h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                        className={`w-full rounded-t-[1rem] transition-all duration-300 relative overflow-hidden ${
                          isLatest 
                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                            : 'bg-blue-50 group-hover/bar:bg-blue-100'
                        }`}
                      >
                        {isLatest && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                      </motion.div>
                    </div>
                    
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLatest ? 'text-blue-600' : 'text-gray-400'}`}>
                      {new Date(m.month + '-02').toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* High Performers Leaderboard */}
        <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-950/20 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Leaderboard</p>
            <Award size={16} className="text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
          </div>

          {isPlatformLoading ? (
            <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3 relative z-10">
              {platformData?.topVendors.map((v: any, i: number) => (
                <motion.div 
                  key={v.vendorId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] px-4 py-3.5 rounded-2xl transition-all group/v"
                >
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-lg ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 
                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 
                    i === 2 ? 'bg-gradient-to-br from-orange-800 to-red-950 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate text-gray-100 group-hover/v:text-white transition-colors uppercase tracking-tight">{v.shopName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{v._count?.orders ?? 0} Transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-400 tracking-tighter">₹{Math.round(Number(v._sum?.total ?? 0)).toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group">
        <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <Store size={20} />
             </div>
             <div>
                <h3 className="font-black text-gray-900 tracking-tight">Partner Performance Breakdown</h3>
                <p className="text-xs text-gray-400 font-medium">Comparative analysis of active marketplace vendors.</p>
             </div>
          </div>
          <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {PERIOD_LABELS[period]}
          </div>
        </div>

        {isVendorLoading ? (
          <div className="p-8 space-y-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-[1.5rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {vendorData?.vendorStats.map((vendor, i) => {
              const isExpanded = expandedVendor === vendor.vendorId;
              const barPct = Math.max((vendor.revenue / maxRevenue) * 100, vendor.revenue > 0 ? 3 : 0);
              return (
                <div key={vendor.vendorId} className={`transition-all ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                  <button
                    onClick={() => setExpandedVendor(isExpanded ? null : vendor.vendorId)}
                    className="w-full flex items-center gap-6 px-8 py-6 text-left group/row"
                  >
                    <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 transition-transform group-hover/row:scale-110 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                    }`}>#{i + 1}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-sm text-gray-900 uppercase tracking-tight truncate">{vendor.shopName}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full max-w-md shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-blue-500 rounded-full relative"
                        >
                           <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="hidden xl:grid grid-cols-4 gap-8 flex-shrink-0 pr-8 border-r border-gray-100">
                      <div className="text-right min-w-[100px]">
                        <p className="font-black text-gray-900 text-base tracking-tighter">₹{Math.round(vendor.revenue).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="font-black text-gray-900 text-base tracking-tighter">{vendor.orders}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Orders</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-black text-emerald-600 text-base tracking-tighter">₹{Math.round(vendor.vendorEarnings).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Profit</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-black text-blue-600 text-base tracking-tighter">₹{Math.round(vendor.commission).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Our Cut</p>
                      </div>
                    </div>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>
                       <ChevronDown size={20} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8 pt-2">
                           <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xl shadow-blue-500/5">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                                 <Package size={14} /> Product Velocity Breakdown
                              </p>
                              {vendor.topProducts.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 font-bold text-sm">No transaction data available.</div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                  {vendor.topProducts.map((p: any, pi: number) => (
                                    <div key={pi} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] p-4 group/p hover:bg-white hover:border-blue-200 transition-all">
                                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover/p:scale-110 transition-transform">
                                        <Package size={20} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{p.name}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                          <p className="text-[10px] font-black text-blue-600">₹{Math.round(p.revenue).toLocaleString('en-IN')}</p>
                                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                                          <p className="text-[10px] font-bold text-gray-400">{p.qty} Sold</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
          </div>
        )}
      </div>
    </div>
  );
}
