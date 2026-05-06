// src/app/(admin)/layout.tsx
"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, ShoppingCart, CreditCard, Settings, Loader2, Menu, X, Package, MapPin, Tag, BarChart2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "Vendors",   href: "/admin/vendors",  icon: Store },
  { name: "Categories",href: "/admin/categories",icon: Tag },
  { name: "Products",  href: "/admin/products", icon: Package },
  { name: "Users",     href: "/admin/users",    icon: Users },
  { name: "Orders",    href: "/admin/orders",   icon: ShoppingCart },
  { name: "Tax Center",href: "/admin/tax",     icon: FileText },
  { name: "Payouts",   href: "/admin/payouts",  icon: CreditCard },
  { name: "Coupons",   href: "/admin/coupons",  icon: Tag },
  { name: "Coverage",  href: "/admin/coverage", icon: MapPin },
  { name: "Settings",  href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isLoaded && user?.publicMetadata.role !== "ADMIN") {
    router.push('/');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] flex-col lg:flex-row theme-admin selection:bg-orange-100 selection:text-orange-900">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-gray-950 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-lg shadow-md border border-white/10" />
          </div>
          <span className="font-black text-white tracking-tighter uppercase text-sm">Deeshora Admin</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" 
              onClick={() => setIsSidebarOpen(false)} 
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-gray-950 border-r border-white/5 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-lg border border-white/10" />
                  </div>
                  <span className="text-xl font-black text-white tracking-tighter uppercase">Deeshora</span>
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="w-10 h-10 bg-white/5 text-gray-400 rounded-xl flex items-center justify-center hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="p-6 overflow-y-auto flex-grow space-y-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all relative group ${
                        isActive
                          ? "text-white"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div layoutId="nav-pill-mobile" className="absolute inset-0 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/20" />
                      )}
                      <span className="relative z-10">
                        <item.icon size={20} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />
                      </span>
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-white/5 flex items-center gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest bg-white/5">
                <UserButton afterSignOutUrl="/" />
                <span>Admin Terminal</span>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 bg-gray-950 text-gray-300 flex-col sticky top-0 h-screen border-r border-white/5 shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 transition-all group-hover:scale-105 duration-500">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-2xl border border-white/10" />
                <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Deeshora</span>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em] mt-1">Admin Panel</span>
            </div>
          </Link>
        </div>
        <nav className="p-6 flex-grow space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all relative group overflow-hidden ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill-desktop" 
                    className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl shadow-xl shadow-orange-600/20" 
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                )}
                <span className="relative z-10">
                  <item.icon size={22} className={`${isActive ? "text-white" : "group-hover:scale-110 transition-transform duration-300"}`} />
                </span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/5 flex items-center gap-4 text-sm font-bold text-gray-400 bg-white/[0.02]">
          <div className="relative">
            <UserButton afterSignOutUrl="/" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-gray-950 rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs">{user?.firstName || 'Administrator'}</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-600">Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px]" />
        </div>

        <header className="hidden lg:flex bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-8 justify-between sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                Terminal Ready
              </span>
              <span className="w-px h-3 bg-gray-200" />
              <span>v2.0.4-stable</span>
           </div>
           <div className="flex items-center gap-6 text-xs font-bold text-gray-500">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Clock size={14} className="text-orange-500" />
                <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
           </div>
        </header>

        <main className="flex-grow p-4 md:p-8 lg:p-10 xl:p-12 overflow-x-hidden relative z-10">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
        </main>
      </div>
    </div>
  );
}