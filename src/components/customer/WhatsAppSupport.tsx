// src/components/customer/WhatsAppSupport.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getWhatsAppUrl, WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { usePathname } from "next/navigation";

export function WhatsAppSupport() {
  const pathname = usePathname();
  const { data: config } = trpc.admin.getSettings.useQuery();
  
  // Hide on checkout or admin/vendor/delivery pages if necessary
  // For now, keep it on all customer-facing pages
  const isExcludedPage = pathname.includes('/checkout') || 
                         pathname.startsWith('/admin') || 
                         pathname.startsWith('/vendor') || 
                         pathname.startsWith('/delivery');

  const businessNumber = config?.find((c: any) => c.key === 'business_whatsapp')?.value || '918939318865';
  
  const isPartnerPage = pathname.startsWith('/vendor') || pathname.startsWith('/delivery') || pathname.startsWith('/admin');
  
  const handleSupportClick = () => {
    const message = isPartnerPage 
      ? `Hello Deeshora Partner Support! I need help with my ${pathname.split('/')[1]} dashboard.` 
      : WHATSAPP_TEMPLATES.ENGLISH.GENERAL_SUPPORT();
    const url = getWhatsAppUrl(businessNumber, message);
    window.open(url, '_blank');
  };

  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setConstraints({
        left: -window.innerWidth + 100,
        right: 0,
        top: -window.innerHeight + 100,
        bottom: 0
      });
    }
  }, []);

  if (isExcludedPage && !pathname.startsWith('/vendor') && !pathname.startsWith('/delivery') && !pathname.startsWith('/admin')) return null;

  return (
    <motion.div
      drag
      dragConstraints={constraints}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9, cursor: 'grabbing' }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-4 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          className="bg-white/80 backdrop-blur-xl px-4 py-3 rounded-[2rem] shadow-2xl border border-white/50 text-gray-900 text-[11px] font-black pointer-events-none uppercase tracking-widest flex items-center gap-2 whitespace-nowrap"
        >
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          {isPartnerPage ? 'Partner Help' : 'Chat with us!'}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={handleSupportClick}
        className="relative group outline-none"
        aria-label="Contact Support on WhatsApp"
      >
        <div className={`w-16 h-16 ${isPartnerPage ? 'bg-gray-950' : 'bg-[#25D366]'} text-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(37,211,102,0.3)] group-hover:shadow-[0_20px_60px_rgba(37,211,102,0.5)] transition-all duration-500 overflow-hidden`}>
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              repeatDelay: 3
            }}
          >
            <MessageCircle size={30} fill="currentColor" />
          </motion.div>
          
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Outer pulse effect */}
        <div className="absolute inset-0 -z-10 bg-[#25D366]/20 rounded-[2rem] animate-ping opacity-20 scale-125" />
        
        {/* Notification indicator */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border-4 border-white rounded-full shadow-lg" />
      </button>
    </motion.div>
  );
}
