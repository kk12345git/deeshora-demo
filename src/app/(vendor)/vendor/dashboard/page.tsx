// src/app/(vendor)/vendor/dashboard/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useVendorNotifications } from '@/hooks/useOrderTracking';
import Link from 'next/link';
import {
  Loader2, Clock, Package, ShoppingCart, IndianRupee,
  AlertCircle, TrendingUp, Bell, ArrowRight, CheckCircle,
  Truck, Star, Wallet, BarChart3, Zap,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import toast from 'react-hot-toast';
import { useState, useCallback } from 'react';

// ─── Pure SVG sparkline (no library needed) ───────────────────────────────────
function Sparkline({ data, color = '#f97316' }: { data: number[]; color?: string }) {
  if (!data.length || data.every(v => v === 0)) {
    return (
      <div className="flex items-end gap-0.5 h-12">
        {Array.from({ length: data.length || 7 }).map((_, i) => (
          <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: '4px' }} />
        ))}
      </div>
    );
  }
  const max = Math.max(...data, 1);
  const h = 48; // px total height
  const w = 100 / data.length;

  const points = data.map((v, i) => {
    const x = i * w + w / 2;
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
      {/* Fill area */}
      <polygon
        points={`0,${h} ${points.join(' ')} 100,${h}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      {/* Line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on latest */}
      {(() => {
        const last = points[points.length - 1].split(',');
        return <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

// ─── Revenue Chart Bar ────────────────────────────────────────────────────────
function RevenueBar({ series }: { series: { day: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...series.map(s => s.revenue), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {series.map((s, i) => {
        const pct = Math.max((s.revenue / max) * 100, s.orders > 0 ? 8 : 3);
        const isLast = i === series.length - 1;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-xl">
                ₹{s.revenue.toFixed(0)} · {s.orders} orders
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
            <div
              className={`w-full rounded-t-lg transition-all duration-300 ${
                isLast ? 'bg-orange-500' : 'bg-orange-200 group-hover:bg-orange-400'
              }`}
              style={{ height: `${pct}%` }}
            />
            <span className={`text-[9px] font-black uppercase ${isLast ? 'text-orange-500' : 'text-gray-400'}`}>
              {s.day}
            </span>
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

  if (vendorProfile?.status === 'PENDING') return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-amber-50 rounded-3xl border border-amber-100">
      <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mb-4">
        <Clock size={36} className="text-amber-400" />
      </div>
      <p className="text-xl font-black text-amber-800">Application Under Review</p>
      <p className="text-amber-600 text-sm mt-2 max-w-sm">Your vendor application is being reviewed. Usually within 24 hours.</p>
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
  const weekRevenue = dailySeries.reduce((s, d) => s + d.revenue, 0);
  const sparklineData = dailySeries.map(d => d.revenue);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Welcome back 👋</p>
          <h1 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{vendorProfile?.shopName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{vendorProfile?.category} — {vendorProfile?.city}</p>
        </div>
        <button
          onClick={() => setNewBell(false)}
          className="relative w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Bell size={20} className="text-gray-500" />
          {newBell && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />}
        </button>
      </div>

      {/* Alert banners */}
      {(stats?.pendingPayout ?? 0) > 0 && (
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-2xl">
          <Wallet size={20} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-700">
            <span className="font-black">₹{stats?.pendingPayout.toFixed(2)}</span> pending payout — will be settled in the next cycle.
          </p>
        </div>
      )}
      {(stats?.pendingOrders ?? 0) > 0 && (
        <Link href="/vendor/orders" className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-4 rounded-2xl hover:bg-amber-100 transition-colors group">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <Bell size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-800 text-sm">{stats?.pendingOrders} order{stats?.pendingOrders === 1 ? '' : 's'} waiting to be accepted!</p>
            <p className="text-xs text-amber-600 mt-0.5">Tap to manage orders now</p>
          </div>
          <ArrowRight size={18} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Today's Orders",
            value: stats?.todayOrders ?? 0,
            icon: <ShoppingCart size={20} />,
            sub: `${stats?.weeklyOrders ?? 0} this week`,
            colorBg: 'bg-orange-100', colorText: 'text-orange-600', colorBorder: 'border-orange-100',
          },
          {
            label: 'Pending',
            value: stats?.pendingOrders ?? 0,
            icon: <Clock size={20} />,
            sub: (stats?.pendingOrders ?? 0) > 0 ? '⚡ Need attention!' : '✅ All clear',
            colorBg: (stats?.pendingOrders ?? 0) > 0 ? 'bg-amber-100' : 'bg-gray-100',
            colorText: (stats?.pendingOrders ?? 0) > 0 ? 'text-amber-600' : 'text-gray-400',
            colorBorder: (stats?.pendingOrders ?? 0) > 0 ? 'border-amber-200' : 'border-gray-100',
          },
          {
            label: 'Total Revenue',
            value: `₹${(stats?.totalRevenue ?? 0).toFixed(0)}`,
            icon: <IndianRupee size={20} />,
            sub: 'All-time earnings',
            colorBg: 'bg-emerald-100', colorText: 'text-emerald-600', colorBorder: 'border-emerald-100',
          },
          {
            label: 'Pending Payout',
            value: `₹${(stats?.pendingPayout ?? 0).toFixed(0)}`,
            icon: <TrendingUp size={20} />,
            sub: 'Next settlement',
            colorBg: 'bg-blue-100', colorText: 'text-blue-600', colorBorder: 'border-blue-100',
          },
        ].map((card) => (
          <div key={card.label} className={`bg-white rounded-2xl border ${card.colorBorder} shadow-sm p-5`}>
            <div className={`w-10 h-10 ${card.colorBg} ${card.colorText} rounded-xl flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${card.colorText} mt-0.5`}>{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Summary Row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* 7-day revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <BarChart3 size={12} /> 7-Day Revenue
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                ₹{weekRevenue.toFixed(0)}
                <span className="text-sm font-bold text-gray-400 ml-2">this week</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">{stats?.weeklyOrders ?? 0} orders</p>
              <p className="text-[10px] text-gray-300 mt-0.5">last 7 days</p>
            </div>
          </div>
          {dailySeries.length > 0 ? (
            <RevenueBar series={dailySeries} />
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-300">
              <p className="text-xs font-bold">No paid orders in the last 7 days yet</p>
            </div>
          )}
        </div>

        {/* Earnings summary panel */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-6 flex flex-col justify-between text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5 mb-4">
              <Wallet size={11} /> Earnings Snapshot
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">Total Earned</span>
                <span className="font-black text-emerald-400 text-sm">₹{(stats?.totalRevenue ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">This Week</span>
                <span className="font-black text-orange-400 text-sm">₹{weekRevenue.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-800" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">Pending Payout</span>
                <span className="font-black text-blue-400 text-sm">₹{(stats?.pendingPayout ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-800">
            {sparklineData.length > 0 && <Sparkline data={sparklineData} color="#f97316" />}
            <p className="text-[10px] text-gray-600 mt-2 text-center">Revenue trend · last 7 days</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', href: '/vendor/products/new', icon: <Package size={18} />, hot: true },
            { label: 'Manage Products', href: '/vendor/products', icon: <Package size={18} /> },
            { label: 'View Orders', href: '/vendor/orders', icon: <ShoppingCart size={18} /> },
            { label: 'Settings', href: '/vendor/settings', icon: <Star size={18} /> },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group text-center ${
                action.hot
                  ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                  : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                action.hot
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'
              }`}>
                {action.icon}
              </div>
              <p className={`text-xs font-bold leading-tight ${action.hot ? 'text-white' : 'text-gray-600'}`}>{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Zap size={11} /> Recent Orders
          </p>
          <Link href="/vendor/orders" className="text-xs font-black text-orange-500 hover:text-orange-600 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {!recentOrders?.orders.length ? (
            <div className="py-12 text-center">
              <Truck size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No orders yet</p>
              <p className="text-xs text-gray-300 mt-1">Your orders will appear here in real-time</p>
            </div>
          ) : (
            recentOrders.orders.map(order => (
              <Link key={order.id} href="/vendor/orders" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.user.name} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900 text-sm">₹{order.total.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}