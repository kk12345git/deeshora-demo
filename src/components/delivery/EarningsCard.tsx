'use client';

import { TrendingUp, Award, Wallet, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface EarningsCardProps {
  todayEarnings: number;
  completedToday: number;
  totalEarnings: number;
}

export default function EarningsCard({ todayEarnings, completedToday, totalEarnings }: EarningsCardProps) {
  const goal = 500; // Mock daily goal
  const progress = Math.min((todayEarnings / goal) * 100, 100);

  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-6 border border-gray-800 shadow-2xl overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Today&apos;s Earnings</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-400">₹</span>
            <span className="text-4xl font-black text-gray-100 tracking-tighter">{todayEarnings}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
          <Wallet size={24} />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
            <span className="text-gray-500">Daily Goal (₹{goal})</span>
            <span className={progress >= 100 ? 'text-green-500' : 'text-blue-400'}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
            />
          </div>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-orange-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase">Orders</span>
            </div>
            <p className="text-lg font-black text-gray-200">{completedToday}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase">Total</span>
            </div>
            <p className="text-lg font-black text-gray-200">₹{Math.round(totalEarnings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
