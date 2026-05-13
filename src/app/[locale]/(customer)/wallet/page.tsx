"use client";

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShieldCheck, 
  Loader2, 
  IndianRupee,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function WalletPage() {
  const utils = trpc.useUtils();
  const { data: balance = 0, isLoading: isLoadingBalance } = trpc.wallet.getBalance.useQuery();
  const { data: transactions, isLoading: isLoadingTx } = trpc.wallet.getTransactions.useQuery();
  
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  
  const rechargeMutation = trpc.wallet.addMoney.useMutation({
    onSuccess: () => {
      toast.success('Wallet recharged successfully! 🚀');
      utils.wallet.getBalance.invalidate();
      utils.wallet.getTransactions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRecharge = () => {
    rechargeMutation.mutate({ amount: rechargeAmount });
  };

  const rechargeOptions = [100, 200, 500, 1000];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">Daily1 Wallet</h1>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Manage your funds & get rewards</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Balance & Recharge */}
          <div className="md:col-span-3 space-y-6">
            {/* Balance Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-950 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-brand-500/20"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-500/30 transition-all duration-1000" />
              
              <div className="relative z-10 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Wallet className="text-brand-400" />
                   </div>
                   <div className="px-3 py-1 bg-brand-500/20 border border-brand-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-400 flex items-center gap-1.5">
                      <Sparkles size={12} /> Active Member
                   </div>
                </div>

                <div>
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Available Balance</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black italic tracking-tighter">₹{isLoadingBalance ? '...' : balance.toFixed(2)}</span>
                   </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                   <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-brand-400" /> 100% Secure
                   </div>
                   <div className="w-1 h-1 bg-white/10 rounded-full" />
                   <div>Personalized for You</div>
                </div>
              </div>
            </motion.div>

            {/* Quick Top-up */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
               <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Plus className="text-brand-500" /> Add Money
               </h2>

               <div className="grid grid-cols-4 gap-3 mb-8">
                  {rechargeOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setRechargeAmount(opt)}
                      className={`py-3 rounded-2xl border-2 font-black text-sm transition-all ${
                        rechargeAmount === opt 
                          ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-md' 
                          : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-brand-200'
                      }`}
                    >
                      ₹{opt}
                    </button>
                  ))}
               </div>

               <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                     <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                     <p className="text-xs font-black uppercase tracking-widest text-brand-600">Daily1 Bonus Offer</p>
                     <p className="text-sm font-bold text-gray-700">Get <span className="text-brand-600 font-black">₹{Math.floor(rechargeAmount / 100) * 10}</span> extra bonus instantly!</p>
                  </div>
               </div>

               <button
                 onClick={handleRecharge}
                 disabled={rechargeMutation.isPending}
                 className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
               >
                 {rechargeMutation.isPending ? <Loader2 className="animate-spin" /> : <>Confirm Recharge <ArrowUpRight size={18} /></>}
               </button>
            </div>
          </div>

          {/* Right: History */}
          <div className="md:col-span-2">
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm h-full">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                   <History className="text-brand-500" /> History
                </h2>

                {isLoadingTx ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl" />)}
                  </div>
                ) : transactions?.length === 0 ? (
                  <div className="text-center py-12">
                     <p className="text-gray-400 text-sm font-bold">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions?.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-900 line-clamp-1">{tx.description}</p>
                              <p className="text-[10px] font-bold text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <span className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                           {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
