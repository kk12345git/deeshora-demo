// src/app/(admin)/admin/page.tsx
import { api } from "@/lib/trpc-server";
import { Users, Store, ShoppingCart, IndianRupee, AlertTriangle } from "lucide-react";
import Link from "next/link";


export default async function AdminDashboardPage() {
  const stats = await api.admin.stats();


  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: <Users />, link: "/admin/users" },
    { title: "Approved Vendors", value: stats.totalVendors, icon: <Store />, link: "/admin/vendors" },
    { title: "Total Orders", value: stats.totalOrders, icon: <ShoppingCart />, link: "/admin/orders" },
    { title: "Platform Revenue", value: `₹${stats.platformRevenue.toFixed(2)}`, icon: <IndianRupee />, link: "#" },
  ];


  const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue), 1);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>


      {stats.pendingVendors > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="mr-3" />
            <p><span className="font-bold">{stats.pendingVendors} vendor application(s)</span> waiting for approval.</p>
          </div>
          <Link href="/admin/vendors?status=PENDING" className="btn-primary bg-yellow-500 hover:bg-yellow-600 text-sm">
            Review Now
          </Link>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => (
          <Link href={card.link} key={card.title} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100 text-gray-600">{card.icon}</div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>


      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold mb-4">Last 6 Months Revenue</h2>
          <div className="flex items-end h-64 space-x-4">
            {stats.monthlyRevenue.map(monthData => (
              <div key={monthData.month} className="flex-1 flex flex-col items-center">
                <div className="text-xs font-bold text-gray-700">₹{Math.round(monthData.revenue)}</div>
                <div className="w-full bg-orange-500 rounded-t-md mt-1" style={{ height: `${(monthData.revenue / maxRevenue) * 100}%` }}></div>
                <div className="text-xs text-gray-500 mt-2">{new Date(monthData.month + '-02').toLocaleString('default', { month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link href="/admin/vendors?status=PENDING" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">Approve Vendors</Link>
            <Link href="/admin/payouts" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">Process Payouts</Link>
            <Link href="/admin/settings" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">Site Settings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}