"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";

interface SwipeButtonProps {
  onComplete: () => void;
  label: string;
  successLabel: string;
  disabled?: boolean;
}

export default function SwipeButton({ onComplete, label, successLabel, disabled }: SwipeButtonProps) {
  const [complete, setComplete] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Width of the container minus the width of the handle (64px)
  const [constraints, setConstraints] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setConstraints(containerRef.current.offsetWidth - 64 - 8); // 8 is padding
    }
  }, []);

  const opacity = useTransform(x, [0, constraints], [1, 0]);
  const scale = useTransform(x, [0, constraints], [1, 1.1]);

  const handleDragEnd = async () => {
    if (x.get() >= constraints * 0.9) {
      setComplete(true);
      await controls.start({ x: constraints });
      onComplete();
    } else {
      await controls.start({ x: 0 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-16 bg-gray-900 rounded-2xl p-1 overflow-hidden border border-gray-800 flex items-center shadow-inner ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.span 
          style={{ opacity }}
          className="text-xs font-black uppercase tracking-[0.2em] text-gray-500"
        >
          {complete ? successLabel : label}
        </motion.span>
      </div>

      <motion.div
        drag={complete ? false : "x"}
        dragConstraints={{ left: 0, right: constraints }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, scale }}
        className={`relative z-10 w-14 h-14 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors ${
          complete ? "bg-green-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {complete ? (
          <Check size={24} strokeWidth={3} />
        ) : (
          <ChevronRight size={24} strokeWidth={3} />
        )}
      </motion.div>

      {/* Progress background indicator */}
      <motion.div 
        style={{ width: x }}
        className="absolute left-1 top-1 bottom-1 bg-blue-500/10 rounded-xl pointer-events-none"
      />
    </div>
  );
}
