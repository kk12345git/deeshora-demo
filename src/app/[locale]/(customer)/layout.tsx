"use client";

import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/customer/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 theme-customer">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}