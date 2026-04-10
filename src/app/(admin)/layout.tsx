// src/app/(admin)/layout.tsx
"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, ShoppingCart, CreditCard, Settings, Loader2, Menu, X, Package } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Vendors", href: "/admin/vendors", icon: Store },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Payouts", href: "/admin/payouts", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
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
    <div className="flex min-h-screen bg-gray-50 flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-lg shadow-md" />
          </div>
          <span className="font-bold text-white tracking-tighter">Deeshora Admin</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 lg:hidden ${isSidebarOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-2xl transition-transform duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-lg border border-white/10" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">Deeshora</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 bg-gray-800 text-gray-400 rounded-xl flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <nav className="p-6 overflow-y-auto flex-grow space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all ${
                  pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-6 border-t border-gray-800 flex items-center gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <UserButton afterSignOutUrl="/" />
            <span>Admin Control</span>
          </div>
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 bg-gray-900 text-gray-300 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 transition-all group-hover:scale-105 duration-300">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-lg border border-white/5" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black text-white tracking-tighter uppercase">Deeshora</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Admin Panel</span>
            </div>
          </Link>
        </div>
        <nav className="p-6 flex-grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all ${
                pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <item.icon size={22} />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-800 flex items-center gap-4 text-sm font-bold text-gray-400">
          <UserButton afterSignOutUrl="/" />
          <span>{user?.firstName || 'Admin'}</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex bg-white border-b py-4 px-8 justify-end shadow-sm">
           <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             System Online
           </div>
        </header>
        <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}