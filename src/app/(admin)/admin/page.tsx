// src/app/(admin)/admin/page.tsx
import { api } from "@/lib/trpc-server";
import { Users, Store, ShoppingCart, IndianRupee, AlertTriangle, ArrowRight, TrendingUp, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const stats = await api.admin.stats();
  const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue), 1);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Control Centre</p>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Pending vendor alert */}
      {stats.pendingVendors > 0 && (
        <Link
          href="/admin/vendors"
          className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-4 rounded-2xl hover:bg-amber-100 transition-colors group"
        >
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-800 text-sm">
              {stats.pendingVendors} vendor application{stats.pendingVendors > 1 ? 's' : ''} waiting for review!
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Tap to approve or reject</p>
          </div>
          <ArrowRight size={18} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Users",
            value: stats.totalUsers,
            icon: <Users size={20} />,
            sub: "registered members",
            colorBg: "bg-blue-100", colorText: "text-blue-600", colorBorder: "border-blue-100",
            link: "/admin/users",
          },
          {
            title: "Active Vendors",
            value: stats.totalVendors,
            icon: <Store size={20} />,
            sub: `${stats.pendingVendors} pending approval`,
            colorBg: stats.pendingVendors > 0 ? "bg-amber-100" : "bg-emerald-100",
            colorText: stats.pendingVendors > 0 ? "text-amber-600" : "text-emerald-600",
            colorBorder: stats.pendingVendors > 0 ? "border-amber-100" : "border-emerald-100",
            link: "/admin/vendors",
          },
          {
            title: "Total Orders",
            value: stats.totalOrders,
            icon: <ShoppingCart size={20} />,
            sub: "all-time",
            colorBg: "bg-purple-100", colorText: "text-purple-600", colorBorder: "border-purple-100",
            link: "/admin/orders",
          },
          {
            title: "Platform Revenue",
            value: `₹${stats.platformRevenue.toFixed(0)}`,
            icon: <IndianRupee size={20} />,
            sub: "commission earned",
            colorBg: "bg-orange-100", colorText: "text-orange-600", colorBorder: "border-orange-100",
            link: "#",
          },
        ].map(card => (
          <Link
            href={card.link}
            key={card.title}
            className={`bg-white rounded-2xl border ${card.colorBorder} shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all`}
          >
            <div className={`w-10 h-10 ${card.colorBg} ${card.colorText} rounded-xl flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${card.colorText} mt-0.5`}>{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Revenue chart + Quick links */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <TrendingUp size={12} /> Revenue Trend
              </p>
              <p className="text-lg font-black text-gray-900 mt-1">Last 6 Months</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {stats.monthlyRevenue.map((monthData, i) => {
              const pct = Math.max((monthData.revenue / maxRevenue) * 100, monthData.revenue > 0 ? 6 : 2);
              const isLatest = i === stats.monthlyRevenue.length - 1;
              return (
                <div key={monthData.month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10">
                    ₹{Math.round(monthData.revenue).toLocaleString('en-IN')}
                  </div>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${isLatest ? 'bg-orange-500' : 'bg-orange-200 group-hover:bg-orange-400'}`}
                    style={{ height: `${pct}%` }}
                  />
                  <span className={`text-[10px] font-black uppercase ${isLatest ? 'text-orange-500' : 'text-gray-400'}`}>
                    {new Date(monthData.month + '-02').toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-5 text-white flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Quick Actions</p>
          {[
            { label: "Review Vendors", href: "/admin/vendors", icon: <Store size={15} />, hot: stats.pendingVendors > 0, badge: stats.pendingVendors > 0 ? String(stats.pendingVendors) : undefined },
            { label: "Process Payouts", href: "/admin/payouts", icon: <IndianRupee size={15} /> },
            { label: "Service Areas", href: "/admin/coverage", icon: <CheckCircle size={15} /> },
            { label: "Manage Orders",  href: "/admin/orders",  icon: <ShoppingCart size={15} /> },
            { label: "Users",          href: "/admin/users",   icon: <Users size={15} /> },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${link.hot ? 'bg-amber-500 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
            >
              <span className={link.hot ? 'text-white' : 'text-gray-500'}>{link.icon}</span>
              <span className="text-sm font-bold flex-1">{link.label}</span>
              {link.badge && <span className="text-[10px] font-black bg-white text-amber-600 px-2 py-0.5 rounded-full">{link.badge}</span>}
              <ArrowRight size={13} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}