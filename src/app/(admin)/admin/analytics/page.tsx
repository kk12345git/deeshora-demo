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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart2 size={12} /> Reports
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Sales performance across all vendors</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                period === p ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={11} />
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Summary Cards */}
      {isPlatformLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : platformData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Platform Revenue" value={`₹${platformData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            sub={`${PERIOD_LABELS[period]}`} icon={<IndianRupee size={20} />}
            colorBg="bg-orange-100" colorText="text-orange-600"
          />
          <StatCard
            title="Commission Earned" value={`₹${platformData.platformCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            sub="Platform's cut" icon={<TrendingUp size={20} />}
            colorBg="bg-emerald-100" colorText="text-emerald-600"
          />
          <StatCard
            title="Total Orders" value={platformData.totalOrders.toString()}
            sub="Paid orders" icon={<ShoppingCart size={20} />}
            colorBg="bg-purple-100" colorText="text-purple-600"
          />
          <StatCard
            title="New Customers" value={platformData.newUsers.toString()}
            sub={`${platformData.newVendors} new vendors`} icon={<Users size={20} />}
            colorBg="bg-blue-100" colorText="text-blue-600"
          />
        </div>
      )}

      {/* Revenue Chart + Top Vendors */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <TrendingUp size={12} /> Revenue Trend
              </p>
              <p className="text-lg font-black text-gray-900 mt-1">{PERIOD_LABELS[period]}</p>
            </div>
          </div>
          {isVendorLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-3 h-40">
              {vendorData?.monthlyBreakdown.map((m: any, i: number) => {
                const rev = Number(m.revenue);
                const pct = Math.max((rev / maxMonthlyRevenue) * 100, rev > 0 ? 6 : 2);
                const isLatest = i === vendorData.monthlyBreakdown.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10">
                      ₹{Math.round(rev).toLocaleString('en-IN')}<br />
                      <span className="text-gray-400">{m.orders} orders</span>
                    </div>
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${isLatest ? 'bg-orange-500' : 'bg-orange-200 group-hover:bg-orange-400'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className={`text-[10px] font-black uppercase ${isLatest ? 'text-orange-500' : 'text-gray-400'}`}>
                      {new Date(m.month + '-02').toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                );
              })}
              {(!vendorData?.monthlyBreakdown || vendorData.monthlyBreakdown.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-gray-300 text-sm font-bold">
                  No data for this period
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Vendors Leaderboard */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-5 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
            <Award size={12} /> Top Performers
          </p>
          {isPlatformLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {platformData?.topVendors.map((v: any, i: number) => (
                <div key={v.vendorId} className="flex items-center gap-3 bg-white/5 px-3 py-2.5 rounded-xl">
                  <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-800 text-white' : 'bg-white/10 text-gray-400'
                  }`}>{i + 1}</span>
                  <span className="text-sm font-bold flex-1 truncate text-gray-200">{v.shopName}</span>
                  <span className="text-xs font-black text-emerald-400">₹{Number(v._sum?.total ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
              {(!platformData?.topVendors || platformData.topVendors.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">No sales data yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Per-Vendor Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
          <Store size={16} className="text-orange-500" />
          <div>
            <p className="font-black text-gray-900">Vendor Performance Breakdown</p>
            <p className="text-xs text-gray-400 mt-0.5">{PERIOD_LABELS[period]} — sorted by revenue</p>
          </div>
        </div>

        {isVendorLoading ? (
          <div className="p-6 space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (vendorData?.vendorStats.length ?? 0) === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="font-bold text-gray-400">No sales data for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {vendorData?.vendorStats.map((vendor, i) => {
              const isExpanded = expandedVendor === vendor.vendorId;
              const barPct = Math.max((vendor.revenue / maxRevenue) * 100, vendor.revenue > 0 ? 3 : 0);
              return (
                <div key={vendor.vendorId}>
                  <button
                    onClick={() => setExpandedVendor(isExpanded ? null : vendor.vendorId)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors text-left"
                  >
                    {/* Rank */}
                    <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center flex-shrink-0 ${
                      i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-700 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>#{i + 1}</span>

                    {/* Shop name + revenue bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-black text-sm text-gray-900 truncate">{vendor.shopName}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full transition-all duration-700"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-sm">₹{vendor.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-sm">{vendor.orders}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600 text-sm">₹{vendor.vendorEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Earnings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-orange-500 text-sm">₹{vendor.commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Commission</p>
                      </div>
                    </div>

                    {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  </button>

                  {/* Expanded: Top Products */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Top Products ({PERIOD_LABELS[period]})</p>
                      {vendor.topProducts.length === 0 ? (
                        <p className="text-xs text-gray-400">No product data</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {vendor.topProducts.map((p, pi) => (
                            <div key={pi} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                              <Package size={13} className="text-orange-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-black text-gray-800">{p.name}</p>
                                <p className="text-[10px] text-gray-400">₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · {p.qty} sold</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mobile stats */}
                      <div className="sm:hidden grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="font-black text-gray-900">₹{vendor.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">Revenue</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="font-black text-gray-900">{vendor.orders}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">Orders</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="font-black text-emerald-600">₹{vendor.vendorEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">Earnings</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="font-black text-orange-500">₹{vendor.commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">Commission</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
