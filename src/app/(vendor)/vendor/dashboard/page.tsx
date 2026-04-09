// src/app/(vendor)/vendor/dashboard/page.tsx
"use client";


import { trpc } from "@/lib/trpc";
import { useVendorNotifications } from "@/hooks/useOrderTracking";
import Link from "next/link";
import { Loader2, Clock, Package, ShoppingCart, IndianRupee, AlertCircle } from "lucide-react";
import { OrderStatusBadge } from "@/components/customer/OrderStatus";


export default function VendorDashboardPage() {
  const { data: vendorProfile, isLoading: isLoadingProfile, error: profileError } = trpc.vendor.myProfile.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.order.vendorStats.useQuery(undefined, { enabled: !!vendorProfile });
  const { data: recentOrders, refetch: refetchOrders } = trpc.order.vendorOrders.useQuery({ limit: 5 }, { enabled: !!vendorProfile });


  useVendorNotifications(vendorProfile?.id, () => {
    refetchStats();
    refetchOrders();
  });


  if (isLoadingProfile) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
  }


  if (profileError) {
    return (
      <div className="text-center py-16 card bg-red-50 border-red-200">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-medium text-red-800">You are not registered as a vendor.</h3>
        <p className="mt-1 text-sm text-red-700">Please register to access the vendor dashboard.</p>
        <div className="mt-6">
          <Link href="/vendor/register" className="btn-primary">
            Register as a Vendor
          </Link>
        </div>
      </div>
    );
  }


  if (vendorProfile?.status === 'PENDING') {
    return (
      <div className="text-center py-16 card bg-yellow-50 border-yellow-200">
        <Clock className="mx-auto h-12 w-12 text-yellow-400" />
        <h3 className="mt-2 text-lg font-medium text-yellow-800">Your application is under review.</h3>
        <p className="mt-1 text-sm text-yellow-700">We are currently reviewing your vendor application. You will be notified once it's approved.</p>
      </div>
    );
  }
  
  if (vendorProfile?.status === 'SUSPENDED') {
    return (
      <div className="text-center py-16 card bg-red-50 border-red-200">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-medium text-red-800">Your account has been suspended.</h3>
        <p className="mt-1 text-sm text-red-700">Please contact support for more information.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>


      {stats?.pendingPayout > 0 && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg" role="alert">
          <p className="font-bold">Pending Payout: ₹{stats.pendingPayout.toFixed(2)}</p>
          <p className="text-sm">This amount will be paid out in the next cycle.</p>
        </div>
      )}


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><ShoppingCart /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{stats?.totalOrders ?? '...'}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600"><ShoppingCart /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-2xl font-bold">{stats?.todayOrders ?? '...'}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Package /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{stats?.pendingOrders ?? '...'}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600"><IndianRupee /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold">₹{stats?.totalRevenue.toFixed(2) ?? '...'}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Recent Orders */}
      <div className="card">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders?.orders.map(order => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id.slice(-8)}</td>
                  <td className="px-4 py-3">{order.user.name}</td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold">₹{order.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}