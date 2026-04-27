// src/components/customer/WhatsAppSupport.tsx
"use client";

import { MessageCircle } from "lucide-react";
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

  if (isExcludedPage && !pathname.startsWith('/vendor') && !pathname.startsWith('/delivery') && !pathname.startsWith('/admin')) return null;

  const businessNumber = config?.find((c: any) => c.key === 'business_whatsapp')?.value || '918939318865';
  
  const isPartnerPage = pathname.startsWith('/vendor') || pathname.startsWith('/delivery') || pathname.startsWith('/admin');
  
  const handleSupportClick = () => {
    const message = isPartnerPage 
      ? `Hello Deeshora Partner Support! I need help with my ${pathname.split('/')[1]} dashboard.` 
      : WHATSAPP_TEMPLATES.ENGLISH.GENERAL_SUPPORT();
    const url = getWhatsAppUrl(businessNumber, message);
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleSupportClick}
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2"
      aria-label="Contact Support on WhatsApp"
    >
      <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 text-gray-700 text-[10px] font-black opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none uppercase tracking-widest">
        {isPartnerPage ? 'Partner Support' : 'Need help? Chat with us!'}
      </div>
      <div className={`w-14 h-14 ${isPartnerPage ? 'bg-gray-900' : 'bg-[#25D366]'} text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300`}>
        <MessageCircle size={28} fill="currentColor" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce" />
      </div>
    </button>
  );
}
