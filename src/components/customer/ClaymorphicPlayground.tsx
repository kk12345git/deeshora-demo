// src/components/customer/ClaymorphicPlayground.tsx
"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { 
  ShoppingBag, 
  Coins, 
  CalendarDays, 
  Zap, 
  Sparkles, 
  MousePointerClick 
} from "lucide-react";

// // ─── 3D Claymorphic Gold Cashback Coin ──────────────────────────────────────────
function GoldCoin() {
  return (
    <div className="relative animate-float-gentle select-none pointer-events-none">
      <svg 
        viewBox="0 0 100 100" 
        className="w-20 h-20 md:w-28 md:h-28 drop-shadow-[0_15px_30px_rgba(245,158,11,0.55)] animate-spin-3d-y"
      >
        {/* Gold Coin Core Shading */}
        <circle cx="50" cy="50" r="45" fill="url(#goldGrad)" stroke="url(#goldOuterStroke)" strokeWidth="3" />
        <circle cx="50" cy="50" r="37" fill="url(#goldInnerGrad)" stroke="url(#goldInnerStroke)" strokeWidth="1.5" />
        
        {/* Specular Highlight (High 3D Gloss) */}
        <path d="M22,35 C32,20 68,20 78,35 C68,26 32,26 22,35 Z" fill="url(#goldHighlight)" opacity="0.8" />
        <circle cx="35" cy="30" r="4" fill="rgba(255,255,255,0.75)" filter="blur(1px)" />

        {/* 3D Carved Text */}
        <text 
          x="51" 
          y="59" 
          fontFamily="Plus Jakarta Sans, var(--font-plus-jakarta), sans-serif" 
          fontWeight="900" 
          fontSize="23" 
          fill="#78350f" 
          textAnchor="middle"
          filter="drop-shadow(0px 2px 0px rgba(255,255,255,0.25))"
        >
          1%
        </text>
        <text 
          x="50" 
          y="58" 
          fontFamily="Plus Jakarta Sans, var(--font-plus-jakarta), sans-serif" 
          fontWeight="900" 
          fontSize="23" 
          fill="#f59e0b" 
          textAnchor="middle"
          filter="drop-shadow(0px -1px 1px rgba(0,0,0,0.8))"
        >
          1%
        </text>

        {/* Dynamic Gradients definition */}
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="goldOuterStroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="goldInnerGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="goldInnerStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#fef08a" opacity="0.8" />
          </linearGradient>
          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── 3D Claymorphic Grocery Basket ──────────────────────────────────────────────
function ClayBasket() {
  return (
    <div className="relative animate-float-slow select-none pointer-events-none">
      <svg 
        viewBox="0 0 130 130" 
        className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_20px_40px_rgba(75,0,130,0.35)]"
      >
        {/* Basket Back Rim */}
        <path d="M15,60 C15,25 115,25 115,60" fill="none" stroke="url(#basketHandleGrad)" strokeWidth="7" strokeLinecap="round" />
        
        {/* Apple (Red Clay Sphere) */}
        <g transform="translate(32, 45)">
          <circle cx="15" cy="15" r="16" fill="url(#appleGrad)" />
          <path d="M7,7 C12,2 20,4 23,9 C18,6 10,4 7,7 Z" fill="#ffffff" opacity="0.4" />
          <circle cx="11" cy="9" r="3.5" fill="#ffffff" opacity="0.8" />
          {/* Apple Stem */}
          <path d="M15,-2 C17,-6 20,-4 18,-2 Z" fill="#78350f" />
          <path d="M18,-5 C23,-7 22,-2 18,-2 Z" fill="#22c55e" />
        </g>

        {/* Milk Carton (3D Blocks) */}
        <g transform="translate(56, 12)">
          {/* Roof */}
          <path d="M4,20 L16,12 L28,20 L16,25 Z" fill="url(#milkRoofGrad)" />
          <path d="M16,12 L28,12 L28,20 L16,20 Z" fill="#e2e8f0" />
          {/* Front Side */}
          <path d="M4,20 L16,25 L16,58 L4,53 Z" fill="url(#milkFrontGrad)" />
          {/* Side Panel */}
          <path d="M16,25 L28,20 L28,53 L16,58 Z" fill="url(#milkSideGrad)" />
          {/* Specular Shines */}
          <path d="M6,22 L14,25 L14,55 L6,51 Z" fill="#ffffff" opacity="0.15" />
          <circle cx="10" cy="30" r="3.5" fill="url(#blueLogoGrad)" />
        </g>

        {/* Fresh Orange (Orange Clay Sphere) */}
        <g transform="translate(20, 52)">
          <circle cx="15" cy="15" r="14" fill="url(#orangeGrad)" />
          <circle cx="10" cy="10" r="3" fill="#ffffff" opacity="0.7" />
        </g>

        {/* Bunch of Grapes (Purple Clay Spheres) */}
        <g transform="translate(74, 52)" fill="url(#grapeGrad)">
          <circle cx="8" cy="8" r="7.5" />
          <circle cx="18" cy="10" r="7" />
          <circle cx="12" cy="18" r="8" />
          <circle cx="13" cy="12" r="2.5" fill="#ffffff" opacity="0.6" />
        </g>

        {/* Basket Body (Clay Front) */}
        <path d="M10,60 L120,60 L108,102 C106,110 98,116 90,116 L40,116 C32,116 24,110 22,102 Z" fill="url(#basketBodyGrad)" />
        
        {/* Basket Ribbing Pattern (For Tactile 3D Depth) */}
        <path d="M22,68 L108,68" stroke="url(#basketLineGrad)" strokeWidth="3" fill="none" opacity="0.3" />
        <path d="M26,80 L104,80" stroke="url(#basketLineGrad)" strokeWidth="3" fill="none" opacity="0.3" />
        <path d="M30,92 L100,92" stroke="url(#basketLineGrad)" strokeWidth="3" fill="none" opacity="0.3" />
        <path d="M34,104 L96,104" stroke="url(#basketLineGrad)" strokeWidth="3" fill="none" opacity="0.3" />

        {/* Highlights & Gradients */}
        <defs>
          <linearGradient id="basketHandleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="basketBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="30%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#31105e" />
          </linearGradient>
          <linearGradient id="basketLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <radialGradient id="appleGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="orangeGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="80%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <radialGradient id="grapeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="30%" stopColor="#a855f7" />
            <stop offset="85%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4a044e" />
          </radialGradient>
          <linearGradient id="milkFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="milkSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="milkRoofGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="blueLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── 3D Claymorphic Delivery Rocket ─────────────────────────────────────────────
function DeliveryRocket() {
  return (
    <div className="relative animate-float-gentle select-none pointer-events-none">
      <svg 
        viewBox="0 0 120 120" 
        className="w-20 h-20 md:w-28 md:h-28 drop-shadow-[0_15px_30px_rgba(244,63,94,0.5)]"
      >
        {/* Boost Fire */}
        <g fill="url(#boostFireGrad)">
          <path d="M46,80 C36,110 56,102 50,112 C56,102 76,110 66,80 Z" />
          <path d="M51,80 C45,100 59,96 55,104 C59,96 73,100 61,80 Z" fill="#fb7185" opacity="0.8" />
          <circle cx="56" cy="98" r="3.5" fill="#fef08a" />
        </g>
        
        {/* Left Wing */}
        <path d="M36,62 L18,78 L34,73 Z" fill="url(#wingGrad)" />
        
        {/* Right Wing */}
        <path d="M76,62 L94,78 L78,73 Z" fill="url(#wingGrad)" />

        {/* Rocket Main Fuselage */}
        <path d="M36,75 C31,52 38,20 56,8 C74,20 81,52 76,75 C68,78 44,78 36,75 Z" fill="url(#rocketBodyGrad)" />
        <path d="M45,76 L67,76" stroke="#475569" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

        {/* Rocket Tip Cone */}
        <path d="M43,26 C49,15 56,8 56,8 C56,8 63,15 69,26 C61,29 51,29 43,26 Z" fill="url(#rocketTipGrad)" />

        {/* Glass Porthole Window */}
        <circle cx="56" cy="46" r="11.5" fill="url(#windowRing)" />
        <circle cx="56" cy="46" r="8.5" fill="url(#windowGlass)" />
        <circle cx="53" cy="43" r="2.5" fill="#ffffff" opacity="0.75" />

        <defs>
          <linearGradient id="boostFireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f8fafc" />
            <stop offset="75%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="rocketTipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="30%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="windowRing" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="windowGlass" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Main Playground Component ──────────────────────────────────────────────────
export default function ClaymorphicPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState<number>(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Mouse coordinate states for general perspective tracking
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // range: [-0.5, 0.5]
    const y = (e.clientY - rect.top) / rect.height - 0.5;  // range: [-0.5, 0.5]
    setCoords({ x, y });
  };

  // Card stack details representing local features
  const cards = [
    {
      id: 0,
      title: "1% Instant Cashback",
      subtitle: "Wallet Reward Boost",
      desc: "Earn 1% cash credited automatically to your Deeshora Wallet on every shop order.",
      icon: Coins,
      color: "from-amber-400/90 to-orange-500/90",
      glowColor: "rgba(245,158,11,0.5)",
      badge: "WALLET SCHEME",
      visual: <GoldCoin />
    },
    {
      id: 1,
      title: "Hometown Fresh Basket",
      subtitle: "Locally Sourced Goods",
      desc: "Direct neighborhood shops and markets serving Thiruvottriyur daily.",
      icon: ShoppingBag,
      color: "from-violet-500/90 to-brand-700/90",
      glowColor: "rgba(109,40,217,0.5)",
      badge: "HYPERLOCAL",
      visual: <ClayBasket />
    },
    {
      id: 2,
      title: "Lightning 15m Delivery",
      subtitle: "Hyper-Fast Logistics",
      desc: "Rider dispatch on purchase. Sourced and delivered straight within 15 minutes.",
      icon: Zap,
      color: "from-rose-500/90 to-pink-600/90",
      glowColor: "rgba(244,63,94,0.5)",
      badge: "ZAP LOGISTICS",
      visual: <DeliveryRocket />
    },
    {
      id: 3,
      title: "Subscribe & Save 15%",
      subtitle: "Recurring Schedule Orders",
      desc: "Set and forget daily essential subscriptions (Milk, Bread, Fruits). Cancel anytime.",
      icon: CalendarDays,
      color: "from-blue-500/90 to-indigo-600/90",
      glowColor: "rgba(59,130,246,0.5)",
      badge: "SUBSCRIBE",
      visual: (
        <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl relative animate-float-gentle">
          <CalendarDays className="w-10 h-10 text-white" />
          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest shadow-lg">15% Off</span>
        </div>
      )
    }
  ];

  // Specific 3D Mouse Tilt calculations for active card
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rx = ((y - yc) / yc) * -16; // Up to 16 deg X tilt
    const ry = ((x - xc) / xc) * 16;  // Up to 16 deg Y tilt

    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleGlobalMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCoords({ x: 0, y: 0 });
      }}
      className="relative w-full h-[580px] md:h-[650px] flex items-center justify-center select-none"
    >
      {/* ─── Glowing Background Aura ────────────────────────────────────── */}
      <div 
        className="absolute w-[80%] h-[80%] rounded-full blur-[140px] opacity-40 transition-all duration-1000 ease-out pointer-events-none animate-pulse-glowing"
        style={{
          background: `radial-gradient(circle, ${cards[hoveredCard !== null ? hoveredCard : activeCard].glowColor} 0%, rgba(0,0,0,0) 70%)`,
          transform: `translate(${coords.x * 50}px, ${coords.y * 50}px)`,
        }}
      />

      {/* Floating 3D Semi-Transparent Spheres */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sphere 1 */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            rotate: [0, 360],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] w-12 h-12 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-md shadow-2xl flex items-center justify-center"
          style={{
            transform: `translate(${coords.x * -30}px, ${coords.y * -30}px) rotate(45deg)`,
          }}
        >
          <Sparkles className="w-5 h-5 text-white/50" />
        </motion.div>

        {/* Sphere 2 */}
        <motion.div
          animate={{
            y: [12, -12, 12],
            x: [6, -6, 6],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[15%] right-[5%] w-16 h-16 rounded-full border border-white/10 bg-gradient-to-br from-pink-500/10 to-transparent backdrop-blur-md shadow-2xl"
          style={{
            transform: `translate(${coords.x * 40}px, ${coords.y * 40}px)`,
          }}
        />
        
        {/* Decorative Grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/5 border-dashed rounded-full pointer-events-none" />
      </div>

      {/* ─── The Interactive 3D Card Stack ─────────────────────────────── */}
      <div className="relative w-[340px] md:w-[420px] h-[360px] md:h-[420px] perspective-1000 preserve-3d">
        {cards.map((card, index) => {
          // Calculate stack rendering based on active item
          const isActive = card.id === activeCard;
          const isHoveredState = card.id === hoveredCard;
          
          // Cards are stacked behind the active card
          let offsetZ = -60;
          let offsetY = 30;
          let rotateX = -10;
          let scale = 0.82;
          let opacity = 0.35;
          let zIndex = cards.length - Math.abs(card.id - activeCard);

          if (isActive) {
            offsetZ = 30;
            offsetY = 0;
            rotateX = 0;
            scale = 1;
            opacity = 1;
            zIndex = 50;
          } else {
            // Cards styled dynamically relative to activeCard position
            const diff = card.id - activeCard;
            zIndex = 40 - Math.abs(diff);
            scale = 1 - Math.abs(diff) * 0.08;
            offsetZ = -Math.abs(diff) * 50;
            offsetY = diff * 25;
            rotateX = -5 - Math.abs(diff) * 4;
            opacity = 0.9 - Math.abs(diff) * 0.25;
          }

          // Override for hovering states on stacked items
          if (isHoveredState && !isActive) {
            scale += 0.03;
            opacity = 1;
            offsetZ += 20;
          }

          return (
            <div
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              onMouseMove={(e) => isActive && handleCardMouseMove(e, card.id)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={(e) => {
                if (isActive) handleCardMouseLeave(e);
                setHoveredCard(null);
              }}
              className={`absolute inset-0 rounded-[3rem] cursor-pointer transition-all duration-500 ease-out select-none preserve-3d ${
                isActive ? "clay-card-light dark:clay-card-dark" : "bg-slate-900/90 border border-white/5 shadow-2xl"
              }`}
              style={{
                transform: isActive 
                  ? `translate3d(0px, 0px, ${offsetZ}px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale3d(${scale}, ${scale}, 1)`
                  : `translate3d(0px, ${offsetY}px, ${offsetZ}px) rotateX(${rotateX}deg) rotateY(${coords.x * 12}deg) scale3d(${scale}, ${scale}, 1)`,
                opacity: opacity,
                zIndex: zIndex,
                boxShadow: isActive 
                  ? `0px 40px 80px -20px ${card.glowColor}, 0px 4px 30px rgba(255,255,255,0.08) inset`
                  : `0px 20px 40px rgba(0,0,0,0.4)`
              }}
            >
              {/* Highlight specular lens reflect flare */}
              {isActive && (
                <div className="absolute inset-0 rounded-[3rem] specular-shine pointer-events-none opacity-90" />
              )}

              {/* Card Contents */}
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between preserve-3d">
                
                {/* Top Row: Icon + Badge */}
                <div className="flex items-center justify-between pointer-events-none">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-xl shadow-black/10`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <span className="badge border border-white/10 bg-white/5 text-white/50 text-[8px] tracking-[0.2em] font-black px-4 py-1.5 rounded-full">
                    {card.badge}
                  </span>
                </div>

                {/* Center Visual Component with 3D projection */}
                <div 
                  className="flex items-center justify-center py-6 pointer-events-none transition-transform duration-300"
                  style={{
                    transform: isActive ? "translateZ(40px) scale(1.05)" : "translateZ(0px)"
                  }}
                >
                  {card.visual}
                </div>

                {/* Bottom Row: Text content */}
                <div className="space-y-2 pointer-events-none">
                  <h4 
                    className={`text-2xl md:text-3xl font-black italic tracking-tighter leading-none transition-colors ${
                      isActive ? "text-gray-950 dark:text-white" : "text-white"
                    }`}
                  >
                    {card.title}
                  </h4>
                  <p 
                    className={`text-[10px] uppercase font-bold tracking-[0.2em] ${
                      isActive ? "text-brand-600 dark:text-brand-400" : "text-white/40"
                    }`}
                  >
                    {card.subtitle}
                  </p>
                  <p 
                    className={`text-xs md:text-sm font-semibold leading-relaxed line-clamp-2 mt-2 ${
                      isActive ? "text-gray-600 dark:text-gray-300" : "text-white/50"
                    }`}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>

              {/* Tap Indicator for background cards */}
              {!isActive && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-[3rem] flex items-center justify-center opacity-0 hover:opacity-100 duration-300">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                    <MousePointerClick className="w-3.5 h-3.5" /> Toggle View
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Stack Selection Dot Bar ───────────────────────────────────── */}
      <div className="absolute bottom-2 flex items-center gap-3 bg-gray-900/50 backdrop-blur-xl border border-white/5 px-5 py-2.5 rounded-full z-50">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveCard(card.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              card.id === activeCard 
                ? "bg-brand-500 w-6 shadow-[0_0_8px_rgb(244,63,94)]" 
                : "bg-white/20 hover:bg-white/55"
            }`}
            aria-label={`Show slide ${card.id + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
