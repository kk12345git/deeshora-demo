"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Package, ClipboardList, User, IndianRupee } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    } else if (isLoaded && user?.publicMetadata?.role !== "DELIVERY" && user?.publicMetadata?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || !isSignedIn || (user?.publicMetadata?.role !== "DELIVERY" && user?.publicMetadata?.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  const tabs = [
    { name: "My Tasks", href: "/delivery", icon: ClipboardList },
    { name: "Pool", href: "/delivery/pool", icon: Package },
    { name: "Earnings", href: "/delivery/earnings", icon: IndianRupee },
    { name: "Profile", href: "/delivery/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">
                D
             </div>
             <h1 className="text-xl font-bold tracking-tight">Delivery Hub</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 overflow-hidden">
             {user.imageUrl && <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-3 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive ? "text-blue-500" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-blue-500/10" : ""}`}>
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
