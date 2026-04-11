// src/app/(vendor)/vendor/dashboard/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useVendorNotifications } from '@/hooks/useOrderTracking';
import Link from 'next/link';
import {
  Loader2, Clock, Package, ShoppingCart, IndianRupee,
  AlertCircle, TrendingUp, Bell, ArrowRight, CheckCircle, Truck, Star,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/customer/OrderStatus';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function VendorDashboardPage() {
  const [newBell, setNewBell] = useState(false);
  const { data: vendorProfile, isLoading: isLoadingProfile, error: profileError } = trpc.vendor.myProfile.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.order.vendorStats.useQuery(undefined, { enabled: !!vendorProfile });
  const { data: recentOrders, refetch: refetchOrders } = trpc.order.vendorOrders.useQuery({ limit: 5 }, { enabled: !!vendorProfile });

  useVendorNotifications(vendorProfile?.id, (data: any) => {
    setNewBell(true);
    toast.custom((t) => (
      <div className={`flex items-center gap-3 bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl ${t.visible ? 'animate-in slide-in-from-top-4' : ''}`}>
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bell size={18} />
        </div>
        <div>
          <p className="font-black text-sm">New Order Received!</p>
          <p className="text-xs text-gray-400">From {data?.customerName ?? 'a customer'} · Check orders tab</p>
        </div>
      </div>
    ), { duration: 6000 });
    refetchStats();
    refetchOrders();
  });

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
      <p className="text-amber-600 text-sm mt-2 max-w-sm">Your vendor application is being reviewed by Deeshora. You'll be notified when approved — usually within 24 hours.</p>
    </div>
  );

  if (vendorProfile?.status === 'SUSPENDED') return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-red-50 rounded-3xl border border-red-100">
      <AlertCircle size={44} className="text-red-400 mb-4" />
      <p className="text-xl font-black text-red-700">Account Suspended</p>
      <p className="text-red-600 text-sm mt-2">Please contact Deeshora support for assistance.</p>
    </div>
  );

  const statCards = [
    {
      label: "Today's Orders",
      value: stats?.todayOrders ?? 0,
      icon: <ShoppingCart size={22} />,
      color: 'orange',
      sub: `${stats?.weeklyOrders ?? 0} this week`,
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders ?? 0,
      icon: <Clock size={22} />,
      color: stats?.pendingOrders ? 'amber' : 'gray',
      sub: stats?.pendingOrders ? 'Need your attention!' : 'All clear 🎉',
      alert: (stats?.pendingOrders ?? 0) > 0,
    },
    {
      label: 'Total Revenue',
      value: `₹${(stats?.totalRevenue ?? 0).toFixed(0)}`,
      icon: <IndianRupee size={22} />,
      color: 'emerald',
      sub: 'All-time earnings',
    },
    {
      label: 'Pending Payout',
      value: `₹${(stats?.pendingPayout ?? 0).toFixed(0)}`,
      icon: <TrendingUp size={22} />,
      color: 'blue',
      sub: 'Next settlement cycle',
    },
  ];

  const quickActions = [
    { label: 'Add New Product', href: '/vendor/products/new', icon: <Package size={18} />, color: 'orange' },
    { label: 'Manage Products', href: '/vendor/products', icon: <Package size={18} />, color: 'gray' },
    { label: 'View All Orders', href: '/vendor/orders', icon: <ShoppingCart size={18} />, color: 'gray' },
    { label: 'Shop Settings', href: '/vendor/settings', icon: <Star size={18} />, color: 'gray' },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Welcome back 👋</p>
          <h1 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{vendorProfile?.shopName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{vendorProfile?.category} — {vendorProfile?.city}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => { setNewBell(false); }}
            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Bell size={20} className="text-gray-500" />
          </button>
          {newBell && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />
          )}
        </div>
      </div>

      {/* Pending payout banner */}
      {(stats?.pendingPayout ?? 0) > 0 && (
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-2xl">
          <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-700">
            <span className="font-black">₹{stats?.pendingPayout.toFixed(2)}</span> pending payout — will be settled in the next cycle.
          </p>
        </div>
      )}

      {/* Pending order alert */}
      {(stats?.pendingOrders ?? 0) > 0 && (
        <Link href="/vendor/orders" className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-4 rounded-2xl hover:bg-amber-100 transition-colors group">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
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
        {statCards.map((card) => (
          <div key={card.label} className={`relative bg-white rounded-2xl border ${card.alert ? 'border-amber-200 shadow-amber-100' : 'border-gray-100'} shadow-sm p-5 overflow-hidden`}>
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br from-${card.color}-400 to-${card.color}-600`} />
            <div className={`w-10 h-10 bg-${card.color}-100 text-${card.color}-600 rounded-xl flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest text-${card.color}-600 mt-0.5`}>{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:border-orange-200 hover:shadow-md transition-all group text-center`}
            >
              <div className={`w-10 h-10 bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all`}>
                {action.icon}
              </div>
              <p className="text-xs font-bold text-gray-600 leading-tight">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Recent Orders</p>
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
              <Link key={order.id} href="/vendor/orders" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
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
                <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}