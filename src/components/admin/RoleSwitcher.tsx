'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Store, Truck, LayoutDashboard, 
  ChevronUp, X, ExternalLink, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function RoleSwitcher() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Only show for ADMIN users
  if (!isLoaded || user?.publicMetadata?.role !== 'ADMIN') {
    return null;
  }

  const currentRole = pathname.startsWith('/admin') ? 'ADMIN' : 
                     pathname.startsWith('/vendor') ? 'VENDOR' :
                     pathname.startsWith('/delivery') ? 'DELIVERY' : 'CUSTOMER';

  const roles = [
    { 
      name: 'Admin Console', 
      href: '/admin', 
      icon: Shield, 
      color: 'bg-orange-500', 
      active: currentRole === 'ADMIN',
      desc: 'System & Operations'
    },
    { 
      name: 'Vendor Studio', 
      href: '/vendor/dashboard', 
      icon: Store, 
      color: 'bg-emerald-500', 
      active: currentRole === 'VENDOR',
      desc: 'Inventory & Shop'
    },
    { 
      name: 'Delivery Hub', 
      href: '/delivery', 
      icon: Truck, 
      color: 'bg-blue-500', 
      active: currentRole === 'DELIVERY',
      desc: 'Logistics & Tasks'
    },
    { 
      name: 'Storefront', 
      href: '/', 
      icon: LayoutDashboard, 
      color: 'bg-purple-500', 
      active: currentRole === 'CUSTOMER',
      desc: 'Customer Experience'
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[-1]"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900/80 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl mb-4 w-72 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white italic">Admin View</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Role Surfing</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-2">
                {roles.map((role) => (
                  <Link 
                    key={role.href} 
                    href={role.href}
                    onClick={() => setIsOpen(false)}
                    className={`group relative flex items-center gap-4 p-3 rounded-2xl transition-all ${
                      role.active 
                      ? 'bg-white/10 ring-1 ring-white/20' 
                      : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${role.color}`}>
                      <role.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{role.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold">{role.desc}</p>
                    </div>
                    {role.active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  Master Access Enabled
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 rotate-0 hover:rotate-6 ${
          isOpen 
          ? 'bg-white text-gray-900' 
          : 'bg-gray-900 text-white border border-white/10'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} className="relative">
              <Sparkles size={24} className="text-orange-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
