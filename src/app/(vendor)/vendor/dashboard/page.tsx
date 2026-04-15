// src/app/(vendor)/vendor/dashboard/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useVendorNotifications } from '@/hooks/useOrderTracking';
import Link from 'next/link';
import {
  Loader2, Clock, Package, ShoppingCart, IndianRupee,
  AlertCircle, TrendingUp, Bell, ArrowRight, CheckCircle,
  Truck, Star, Wallet, BarChart3, Zap, ShoppingBag, ArrowUpRight, FileText
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import toast from 'react-hot-toast';
import { useState, useCallback } from 'react';

// ─── Pure SVG sparkline (no library needed) ───────────────────────────────────
function Sparkline({ data, color = '#f97316' }: { data: number[]; color?: string }) {
  if (!data.length || data.every(v => v === 0)) {
    return (
      <div className="flex items-end gap-0.5 h-12 px-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex-1 bg-gray-100/10 rounded-t" style={{ height: '4px' }} />
        ))}
      </div>
    );
  }
  const max = Math.max(...data, 1);
  const h = 48; // px total height
  const w = 100 / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * w;
    const y = h - (v / max) * (h - 4);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 100 ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points.join(' ')} 100,${h}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Revenue Chart Bar ────────────────────────────────────────────────────────
function RevenueBar({ series }: { series: { date: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...series.map(s => s.revenue), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-end gap-1.5 h-32 w-full pt-12">
      {series.map((s, i) => {
        const pct = Math.max((s.revenue / max) * 100, s.orders > 0 ? 8 : 3);
        const isToday = i === series.length - 1;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-xl border border-white/10">
                ₹{s.revenue.toLocaleString()} · {s.orders} orders
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
            <div
              className={`w-full rounded-t-lg transition-all duration-300 ${
                isToday ? 'bg-orange-500' : 'bg-gray-200 group-hover:bg-orange-400'
              }`}
              style={{ height: `${pct}%` }}
            />
            {/* Show label every 3 days to avoid clutter on 14-day view */}
            {(i % 3 === 0 || isToday) ? (
              <span className={`text-[8px] font-black uppercase mt-1 ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                {s.date}
              </span>
            ) : <div className="h-3" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const [newBell, setNewBell] = useState(false);

  const { data: vendorProfile, isLoading: isLoadingProfile, error: profileError } = trpc.vendor.myProfile.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.order.vendorStats.useQuery(undefined, { enabled: !!vendorProfile });
  const { data: recentOrders, refetch: refetchOrders } = trpc.order.vendorOrders.useQuery({ limit: 5 }, { enabled: !!vendorProfile });

  const handleNewOrder = useCallback((data: any) => {
    setNewBell(true);
    toast.custom((t) => (
      <div className={`flex items-center gap-3 bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl ${t.visible ? 'animate-in slide-in-from-top-4' : ''}`}>
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
          <Bell size={18} />
        </div>
        <div>
          <p className="font-black text-sm">New Order Received! 🔔</p>
          <p className="text-xs text-gray-400">From {data?.customerName ?? 'a customer'} · Check orders tab</p>
        </div>
      </div>
    ), { duration: 6000 });
    refetchStats();
    refetchOrders();
  }, [refetchStats, refetchOrders]);

  useVendorNotifications(vendorProfile?.id, handleNewOrder);

  if (isLoadingProfile) return (
    <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-10 h-10 text-orange-500" /></div>
  );

  if (profileError) return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
        <AlertCircle size={36} className="text-red-400" />
      </div>
      <p className="text-xl font-black text-gray-800">Not registered as a vendor</p>
      <p className="text-gray-400 text-sm mt-2 max-w-xs">Please register your shop to access the vendor dashboard.</p>
      <Link href="/vendor/register" className="btn-primary mt-6">Register Your Shop</Link>
    </div>
  );


  if (vendorProfile?.status === 'SUSPENDED') return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-red-50 rounded-3xl border border-red-100">
      <AlertCircle size={44} className="text-red-400 mb-4" />
      <p className="text-xl font-black text-red-700">Account Suspended</p>
      <p className="text-red-600 text-sm mt-2">Please contact Deeshora support.</p>
    </div>
  );

  const dailySeries = stats?.dailySeries ?? [];
  const fourteenDayRevenue = dailySeries.reduce((s, d) => s + d.revenue, 0);
  const sparklineData = dailySeries.map(d => d.revenue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           {vendorProfile?.logo ? (
              <div className="relative w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-orange-500/10 shadow-xl">
                 <img src={vendorProfile.logo} alt="Shop Logo" className="object-cover w-full h-full" />
              </div>
           ) : (
              <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
                {vendorProfile?.shopName.charAt(0)}
              </div>
           )}
           <div>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Business Insights</p>
              <h1 className="text-4xl font-black text-gray-900 mt-1 tracking-tighter uppercase leading-none">{vendorProfile?.shopName}</h1>
              <p className="text-gray-400 font-bold text-sm mt-2">{vendorProfile?.category} · {vendorProfile?.city} hub</p>
           </div>
        </div>
        
        <button
          onClick={() => { setNewBell(false); refetchStats(); refetchOrders(); }}
          className="relative w-14 h-14 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-gray-200/50 hover:bg-gray-50 transition-all active:scale-95"
        >
          <Bell size={24} className={newBell ? "text-orange-500" : "text-gray-400"} />
          {newBell && <span className="absolute top-4 right-4 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-bounce" />}
        </button>
      </div>

      {/* Pending Approval Banner */}
      {vendorProfile?.status === 'PENDING' && (
        <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center shrink-0">
            <Clock size={32} className="text-amber-500 animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">Shop Under Review</h3>
            <p className="text-sm text-amber-700 font-medium mt-1 leading-relaxed">
              Your vendor application is currently being verified. You can already start adding products and setting up your catalog, 
              but they will only go live on the storefront once your shop is approved (usually within 24h).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <Link href="/vendor/products/new" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95">
                Add Items
             </Link>
          </div>
        </div>
      )}

      {/* Action Banners */}
      <div className="grid lg:grid-cols-2 gap-4">
        {(stats?.pendingPayout ?? 0) > 0 && (
          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 px-6 py-5 rounded-3xl">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 shrink-0">
               <Wallet size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Settlement Pending</p>
              <p className="text-sm font-bold text-emerald-700">
                <span className="font-black text-lg block text-emerald-900">₹{stats?.pendingPayout.toLocaleString()}</span>
                Ready for next payout cycle.
              </p>
            </div>
          </div>
        )}
        {(stats?.pendingOrders ?? 0) > 0 && (
          <Link href="/vendor/orders" className="flex items-center gap-4 bg-orange-500 text-white px-6 py-5 rounded-3xl hover:bg-orange-600 transition-all group shadow-xl shadow-orange-500/20">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <Zap size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg leading-tight uppercase tracking-tight">{stats?.pendingOrders} Orders Waiting!</p>
              <p className="text-xs text-orange-100 font-bold opacity-80">Tap to start fulfilling orders now</p>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Products */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/20 p-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <BarChart3 size={12} className="text-orange-500" /> Revenue Growth
                </p>
                <div className="flex items-baseline gap-3 mt-2">
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                    ₹{fourteenDayRevenue.toLocaleString()}
                  </h3>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${(stats?.growthRate ?? 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {(stats?.growthRate ?? 0) >= 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                    {stats?.growthRate ?? 0}%
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 mt-1">Gross sales over the last 14 days</p>
              </div>
            </div>
            
            {dailySeries.length > 0 ? (
              <RevenueBar series={dailySeries} />
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                <p className="text-sm font-bold uppercase tracking-widest">No transaction history</p>
              </div>
            )}
          </div>

          {/* Advanced Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6">
             {/* Speed Card */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-xl shadow-gray-200/20 flex flex-col justify-between h-56">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fulfillment Speed</p>
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center flex-shrink-0">
                         <Clock size={28} />
                      </div>
                      <div>
                        <span className="text-3xl font-black text-gray-900">
                          {stats?.avgFulfillmentMinutes ?? 0}
                          <span className="text-sm font-bold text-gray-400 ml-1">mins</span>
                        </span>
                        <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 mt-0.5">
                           <Zap size={10} /> Elite Performance
                        </p>
                      </div>
                   </div>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Average time from order placement to customer delivery in Thiruvottriyur.
                </p>
             </div>

             {/* Retention Card */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-xl shadow-gray-200/20 flex flex-col justify-between h-56">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer Loyalty</p>
                   <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-gray-100"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="text-orange-500"
                            strokeDasharray={`${stats?.retentionRate ?? 0}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-xs">
                          {stats?.retentionRate ?? 0}%
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg leading-tight uppercase">Repeat Buyers</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Community Trust Level</p>
                      </div>
                   </div>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Neighbors who ordered from your shop more than once.
                </p>
             </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/20 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Best Sellers</h2>
                   <p className="text-xs text-gray-400 font-bold mt-1">Most popular items by volume</p>
                </div>
                <ShoppingBag size={24} className="text-gray-100" />
             </div>
             <div className="divide-y divide-gray-50">
                {stats?.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((p, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-xs">
                           0{idx + 1}
                        </div>
                        <div>
                           <p className="font-black text-gray-900 uppercase tracking-tight text-sm">{p.name}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-gray-900 text-sm">₹{p.revenue.toLocaleString()}</p>
                         <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Highly Profitable</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center">
                     <Package size={32} className="mx-auto text-gray-200 mb-4" />
                     <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No product data yet</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Cards & Earnings */}
        <div className="space-y-8">
           {/* Earnings Card */}
           <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Total Settlement</p>
              <h3 className="text-5xl font-black mt-3 tracking-tighter">
                <span className="text-2xl mt-1.5 opacity-50 mr-1">₹</span>
                {(stats?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
              
              <div className="mt-8 space-y-4 relative z-10">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">14d Volume</span>
                    <span className="font-black text-orange-400">₹{fourteenDayRevenue.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">Next Payout</span>
                    <span className="font-black text-blue-400">₹{(stats?.pendingPayout ?? 0).toLocaleString()}</span>
                 </div>
              </div>

              <div className="mt-10">
                 {sparklineData.length > 0 && <Sparkline data={sparklineData} color="#f97316" />}
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-3 text-center">14-day pulse monitor</p>
              </div>
           </div>

           {/* SEO Visibility Score */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">SEO Presence</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search discoverability</p>
                 </div>
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ${(stats?.seoScore ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {stats?.seoScore ?? 0}%
                 </div>
              </div>
              
              <div className="space-y-3">
                 {[
                   { label: 'Branding Logo', complete: !!vendorProfile?.logo },
                   { label: 'Store Bio (50+ words)', complete: (vendorProfile?.description?.length || 0) > 50 },
                   { label: 'Cover Art', complete: !!vendorProfile?.coverImage },
                   { label: 'Active Catalog (5+ Items)', complete: (vendorProfile?._count.products || 0) >= 5 },
                 ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                       <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${item.complete ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-100 text-gray-200'}`}>
                          {item.complete && <CheckCircle size={10} />}
                       </div>
                       <span className={`text-[11px] font-bold ${item.complete ? 'text-gray-900' : 'text-gray-300'}`}>{item.label}</span>
                    </div>
                 ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50">
                 <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase">
                    Our AI Agents require these to feature your shop in local searches.
                 </p>
              </div>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                     <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{stats?.todayOrders}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                     <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{stats?.pendingOrders}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                  </div>
               </div>
           </div>

           {/* Quick Actions */}
           <div className="grid gap-3">
              {[
                { label: 'Add Item', href: '/vendor/products/new', icon: <PlusIcon size={18} />, hot: true },
                { label: 'Manage Stock', href: '/vendor/products', icon: <Package size={18} /> },
                { label: 'View Reports', href: '/vendor/invoices', icon: <FileText size={18} /> },
              ].map(action => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                    action.hot
                      ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                      : 'bg-white border-gray-100 hover:border-orange-200 shadow-sm text-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    action.hot ? 'bg-white/20' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500'
                  }`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-black uppercase tracking-tight">{action.label}</span>
                </Link>
              ))}
           </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/20 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Activity</h2>
             <Link href="/vendor/orders" className="text-xs font-black text-orange-500 hover:underline uppercase tracking-widest">View History</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentOrders?.orders.length ? (
              <div className="py-20 text-center">
                <Truck size={40} className="text-gray-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Waiting for orders...</p>
              </div>
            ) : (
              recentOrders.orders.map(order => (
                <Link key={order.id} href="/vendor/orders" className="flex items-center gap-5 p-6 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                     <ShoppingBag size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-gray-900 uppercase">#{order.id.slice(-8)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {order.user.name} · {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">₹{order.total.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            )}
          </div>
      </div>
    </div>
  );
}

function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-7-7v14" />
    </svg>
  );
}