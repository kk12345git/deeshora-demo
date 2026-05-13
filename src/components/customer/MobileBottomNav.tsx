// src/components/customer/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Package, Users } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Community", href: "/communities", icon: Users },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: cart.itemCount() },
    { name: "Account", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
                isActive
                  ? "text-brand-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-brand-50/50 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div
                className={`relative transition-transform duration-300 ${isActive ? "scale-110 -translate-y-1" : ""}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-brand-600 text-white text-[8px] font-black flex items-center justify-center shadow-lg shadow-brand-500/30">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-black mt-1 uppercase tracking-[0.1em] transition-all ${isActive ? "opacity-100 scale-105" : "opacity-60"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
