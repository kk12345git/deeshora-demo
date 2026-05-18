// src/components/layout/BottomNav.tsx
"use client";

import { Link, usePathname } from "@/navigation";
import {
  Home,
  Search,
  Grid,
  ShoppingCart,
  Package,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";

export default function BottomNav() {
  const { isSignedIn } = useUser();
  const cart = useCart();
  const pathname = usePathname();

  // Navigation tabs for quick touch access
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Categories", href: "/categories", icon: Grid },
    { name: "Search", href: "/search", icon: Search },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "Cart", href: "/cart", icon: ShoppingCart, badge: cart.itemCount() },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/70 dark:bg-gray-950/70 backdrop-blur-3xl border-t border-gray-100 dark:border-gray-900 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around py-2.5 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center relative py-1 px-2.5 min-w-[60px] active:scale-95 transition-transform"
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-all duration-300 ${
                    isActive
                      ? "text-brand-500 scale-110"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Notification Bubble for Cart Items */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4.5 w-4.5 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center shadow-md shadow-brand-500/30 border border-white dark:border-gray-950">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span
                className={`text-[9px] font-black uppercase tracking-wider mt-1 transition-all ${
                  isActive
                    ? "text-brand-600 font-extrabold"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.name}
              </span>

              {/* Active Slide Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomActiveDot"
                  className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-500"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
