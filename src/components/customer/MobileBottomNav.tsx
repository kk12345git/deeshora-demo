// src/components/customer/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
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
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                isActive ? "text-orange-600 scale-110" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-orange-500/30">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
