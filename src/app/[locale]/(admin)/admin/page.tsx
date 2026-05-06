// src/app/(admin)/admin/page.tsx
export const dynamic = 'force-dynamic';
import { api } from "@/lib/trpc-server";
import { Users, Store, ShoppingCart, IndianRupee, AlertTriangle, ArrowRight, TrendingUp, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const stats = await api.admin.stats();
  const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue), 1);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-widest rounded-md">Live</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Overview</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Command Center</h1>
          <p className="text-gray-500 text-sm font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform Status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-700 uppercase">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.pendingVendors > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Link
            href="/admin/vendors"
            className="flex items-center gap-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 p-5 rounded-[2rem] hover:shadow-xl hover:shadow-amber-500/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
              <AlertTriangle size={120} />
            </div>
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1 relative z-10">
              <p className="font-black text-amber-900 text-lg leading-tight">
                {stats.pendingVendors} Pending Application{stats.pendingVendors > 1 ? 's' : ''}
              </p>
              <p className="text-amber-700 text-sm font-medium mt-0.5">Action required to onboard new vendors to the platform.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl text-amber-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-white transition-colors">
              Review Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: stats.totalUsers,
            icon: <Users size={22} />,
            sub: "Registered members",
            gradient: "from-blue-500 to-indigo-600",
            link: "/admin/users",
          },
          {
            title: "Active Vendors",
            value: stats.totalVendors,
            icon: <Store size={22} />,
            sub: `${stats.pendingVendors} pending review`,
            gradient: stats.pendingVendors > 0 ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600",
            link: "/admin/vendors",
          },
          {
            title: "Orders Today",
            value: stats.todayOrders,
            icon: <ShoppingCart size={22} />,
            sub: "Since midnight",
            gradient: "from-purple-500 to-pink-600",
            link: "/admin/orders",
          },
          {
            title: "Total Revenue",
            value: `₹${stats.platformRevenue.toLocaleString('en-IN')}`,
            icon: <IndianRupee size={22} />,
            sub: "Lifetime commission",
            gradient: "from-orange-500 to-red-600",
            link: "/admin/analytics",
          },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={card.link}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1.5 transition-all group block h-full"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{card.value}</p>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{card.title}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{card.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform pointer-events-none">
            <TrendingUp size={240} />
          </div>
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                <TrendingUp size={12} /> Market Analytics
              </p>
              <h2 className="text-2xl font-black text-gray-900 mt-1">Revenue Performance</h2>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
              6 Month Window
            </div>
          </div>

          <div className="flex items-end gap-5 h-56 relative z-10">
            {stats.monthlyRevenue.map((monthData, i) => {
              const pct = Math.max((monthData.revenue / maxRevenue) * 100, monthData.revenue > 0 ? 8 : 2);
              const isLatest = i === stats.monthlyRevenue.length - 1;
              return (
                <div key={monthData.month} className="flex-1 flex flex-col items-center gap-3 group/bar relative">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap z-20 shadow-xl -translate-y-2 group-hover/bar:translate-y-0">
                    ₹{Math.round(monthData.revenue).toLocaleString('en-IN')}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                  
                  <div className="w-full relative flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className={`w-full rounded-t-[1rem] transition-all duration-300 relative overflow-hidden ${
                        isLatest 
                          ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                          : 'bg-orange-100 group-hover/bar:bg-orange-200'
                      }`}
                    >
                      {isLatest && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                    </motion.div>
                  </div>
                  
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isLatest ? 'text-orange-500' : 'text-gray-400'}`}>
                    {new Date(monthData.month + '-02').toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Feed */}
        <div className="space-y-6">
          <div className="bg-gray-950 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-950/20 text-white relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] group-hover:bg-orange-600/20 transition-all" />
            
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 relative z-10">Quick Control</p>
            
            <div className="space-y-3 relative z-10">
              {[
                { label: "Review Vendors", href: "/admin/vendors", icon: <Store size={16} />, hot: stats.pendingVendors > 0, badge: stats.pendingVendors > 0 ? String(stats.pendingVendors) : undefined },
                { label: "Process Payouts", href: "/admin/payouts", icon: <IndianRupee size={16} /> },
                { label: "Service Areas", href: "/admin/coverage", icon: <CheckCircle size={16} /> },
                { label: "Platform Users", href: "/admin/users", icon: <Users size={16} /> },
              ].map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.5 }}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group/btn ${
                      link.hot 
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/20' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                    }`}
                  >
                    <span className={link.hot ? 'text-white' : 'text-gray-500 group-hover/btn:text-white transition-colors'}>{link.icon}</span>
                    <span className="text-sm font-black flex-1 uppercase tracking-wider">{link.label}</span>
                    {link.badge && (
                      <span className="text-[10px] font-black bg-white text-orange-600 px-2.5 py-0.5 rounded-lg shadow-sm">
                        {link.badge}
                      </span>
                    )}
                    <ArrowRight size={14} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Logs</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <div className="space-y-4">
                <div className="flex gap-3">
                   <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={14} className="text-blue-500" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800">New Order Received</p>
                      <p className="text-[10px] text-gray-400 truncate">System processed a transaction for ₹2,450</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-emerald-500" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800">Vendor Approved</p>
                      <p className="text-[10px] text-gray-400 truncate">"Organic Farms" joined the marketplace</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}