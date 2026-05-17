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
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 theme-customer relative overflow-hidden">
      {/* Immersive 3D Backdrop Spotlights & Drifting Spheres */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-500 bg-white dark:bg-gray-950">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Pulsating colorful radial flares */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.45, 0.3],
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-500/5"
        />
        <motion.div
          animate={{
            scale: [1.1, 0.95, 1.1],
            opacity: [0.2, 0.35, 0.2],
            x: [0, -40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-pink-500/5 blur-[140px] dark:bg-pink-500/3"
        />

        {/* Orbiting Glassmorphic Spheres with dynamic drift */}
        <motion.div
          animate={{
            y: [0, -60, 0],
            x: [0, 30, 0],
            rotate: [0, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-12 w-24 h-24 rounded-full border border-gray-200/20 dark:border-gray-800/20 bg-white/2 dark:bg-white/1 backdrop-blur-[3px] shadow-[inset_10px_-10px_20px_rgba(0,0,0,0.02),10px_10px_20px_rgba(0,0,0,0.03)] hidden lg:block"
        />
        <motion.div
          animate={{
            y: [0, 80, 0],
            x: [0, -40, 0],
            rotate: [360, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-20 w-32 h-32 rounded-full border border-gray-200/20 dark:border-gray-800/20 bg-white/2 dark:bg-white/1 backdrop-blur-[4px] shadow-[inset_-10px_10px_30px_rgba(255,255,255,0.05),15px_15px_30px_rgba(0,0,0,0.03)] hidden lg:block"
        />
      </div>

      <Navbar />
      <main className="flex-grow relative z-10">
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
