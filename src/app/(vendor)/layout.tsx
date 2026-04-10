// src/app/(vendor)/layout.tsx
"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, Loader2, Menu, X, Store } from "lucide-react";

const navItems = [
  { name: "Summary", href: "/vendor/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/vendor/products", icon: Package },
  { name: "Live Orders", href: "/vendor/orders", icon: ShoppingCart },
  { name: "Preferences", href: "/vendor/settings", icon: Settings },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isLoaded && user?.publicMetadata.role !== "VENDOR") {
    router.push('/');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <Link href="/vendor/dashboard" className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-lg shadow-md" />
          </div>
          <span className="font-bold text-gray-900 tracking-tighter">Vendor Panel</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 lg:hidden ${isSidebarOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
               <div className="relative w-10 h-10">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-lg" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tighter">Deeshora</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
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
                  pathname.startsWith(item.href)
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-6 border-t flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Shop Manager</span>
                <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{user?.firstName}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 bg-white border-r text-gray-600 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 transition-all group-hover:scale-105 duration-300">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl shadow-lg" />
            </div>
            <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black text-gray-900 tracking-tighter">Deeshora</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Vendor Studio</span>
            </div>
          </Link>
        </div>
        <nav className="p-6 flex-grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20"
                  : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              <item.icon size={22} />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-8 border-t bg-gray-50/50 flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">{user?.firstName}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Vendor</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex bg-white border-b py-4 px-8 justify-between items-center shadow-sm">
           <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <div className="w-2 h-2 rounded-full bg-orange-500" />
             Shop Online
           </div>
           <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
              <Store size={14} /> Visit Storefront
           </Link>
        </header>
        <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}