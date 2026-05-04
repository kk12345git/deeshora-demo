// src/components/PWAInstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:bottom-10 md:left-auto md:right-10 z-[100] md:w-80"
      >
        <div className="bg-orange-600 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-4 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
             <Smartphone size={80} />
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="relative z-10">
            <h3 className="font-black text-lg leading-tight">Install Deeshora App</h3>
            <p className="text-orange-100 text-xs font-bold mt-1">Get the best experience with our app on your home screen!</p>
          </div>

          <button
            onClick={handleInstall}
            className="relative z-10 w-full py-3.5 bg-white text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} /> Install Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
