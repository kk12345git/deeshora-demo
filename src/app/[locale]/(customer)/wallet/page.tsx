"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "@/navigation";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  ShieldCheck,
  Loader2,
  Sparkles,
  Zap,
  Gift,
  Trophy,
  Crown,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletPage() {
  const utils = trpc.useUtils();
  const { data: balance = 0, isLoading: isLoadingBalance } =
    trpc.wallet.getBalance.useQuery();
  const { data: transactions, isLoading: isLoadingTx } =
    trpc.wallet.getTransactions.useQuery();
  const { data: isWelcomeOfferEligible = false } =
    trpc.wallet.isWelcomeOfferEligible.useQuery();
  const { data: redeemPoints = 0, isLoading: isLoadingPoints } =
    trpc.wallet.getRedeemPoints.useQuery();

  const [rechargeAmount, setRechargeAmount] = useState<number>(100);

  // 3D Tilt Coordinates and Touch-Drag state handlers
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const x = Math.max(-0.5, Math.min(0.5, dx / rect.width));
    const y = Math.max(-0.5, Math.min(0.5, dy / rect.height));
    setCoords({ x, y });
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const rotateX = isHovered ? -coords.y * 22 : 0;
  const rotateY = isHovered ? coords.x * 22 : 0;
  const lightX = isHovered ? (coords.x + 0.5) * 100 : 50;
  const lightY = isHovered ? (coords.y + 0.5) * 100 : 50;

  const rechargeMutation = trpc.wallet.addMoney.useMutation({
    onSuccess: () => {
      toast.success("Wallet recharged successfully! 🚀");
      utils.wallet.getBalance.invalidate();
      utils.wallet.getTransactions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRecharge = () => {
    rechargeMutation.mutate({ amount: rechargeAmount });
  };

  const rechargeOptions = [100, 200, 500, 1000];
  const bonusAmount = isWelcomeOfferEligible ? Math.floor(rechargeAmount / 100) * 10 : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic">
              Deeshora<span className="text-brand-500"> Wallet</span>
            </h1>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">
              Smart Spending • Bigger Rewards
            </p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Joined by 10k+ locals
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ─── Left: Balance & Recharge ───────────────────────────── */}
          <div className="lg:col-span-7 space-y-10">
            {/* Premium Balance Card */}
            <div className="perspective-1000 w-full select-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
                  transformStyle: "preserve-3d",
                  transition: isHovered ? "transform 0.05s ease-out, box-shadow 0.3s ease" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                  setIsHovered(false);
                  setCoords({ x: 0, y: 0 });
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative aspect-[4/3] xs:aspect-[16/9] sm:aspect-auto sm:h-80 rounded-[3rem] xs:rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-brand-500/20 bg-gray-950 cursor-grab active:cursor-grabbing"
              >
                <div className="absolute inset-0 bg-gray-950" />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/40 via-transparent to-pink-600/40 opacity-50" />
                
                {/* Specular plastic glint flare */}
                <div
                  style={{
                    background: `radial-gradient(circle 220px at ${lightX}% ${lightY}%, rgba(255,255,255,0.18), transparent 75%)`,
                  }}
                  className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 mix-blend-overlay ${isHovered ? "opacity-100" : "opacity-0"}`}
                />

                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-[50%] -right-[20%] w-[100%] h-[100%] bg-brand-500/10 blur-[120px] rounded-full"
                />

                <div className="relative h-full p-6 sm:p-10 md:p-14 flex flex-col justify-between z-10 text-white select-none pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
                  <div className="flex items-center justify-between" style={{ transform: "translateZ(25px)", transformStyle: "preserve-3d" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                        <Wallet className="text-brand-400" size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          Tier Status
                        </p>
                        <p className="text-sm font-black flex items-center gap-2">
                          <Crown size={16} className="text-yellow-400" /> Deeshora
                          Platinum
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-brand-500/20 border border-brand-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-400 flex items-center gap-2 backdrop-blur-md">
                      <Sparkles size={14} className="animate-pulse" /> Verified
                      Holder
                    </div>
                  </div>

                  <div className="space-y-1" style={{ transform: "translateZ(40px)" }}>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
                      Total Value
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black italic tracking-tighter">
                        ₹{isLoadingBalance ? "..." : balance.toFixed(0)}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-white/40">
                        INR
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[10px] font-black text-white/40 uppercase tracking-widest pt-6 border-t border-white/5" style={{ transform: "translateZ(20px)" }}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-brand-400" />{" "}
                      Protected by SSL
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-brand-400" /> Instant
                      Settlement
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Premium Redeem Points Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-[3rem] p-6 sm:p-8 border border-brand-500/20 bg-gradient-to-r from-brand-50/50 to-purple-50/50 dark:from-brand-950/20 dark:to-purple-950/20 shadow-xl backdrop-blur-xl group hover:border-brand-500/40 transition-all duration-300"
            >
              {/* Glowing Background Blob */}
              <div className="absolute -right-20 -top-20 w-60 h-60 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-brand-500/10 dark:bg-brand-400/10 rounded-2xl flex items-center justify-center border border-brand-500/20 dark:border-brand-400/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <Trophy className="text-brand-500 dark:text-brand-400" size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
                      Redeemable Points
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black italic tracking-tighter text-gray-900 dark:text-white">
                        {isLoadingPoints ? "..." : redeemPoints.toFixed(2)}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest text-brand-500">
                        Points
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-0.5">
                      Equivalent to ₹{isLoadingPoints ? "..." : redeemPoints.toFixed(2)} Cash • 1% on every product
                    </p>
                  </div>
                </div>
                
                <Link
                  href="/wallet/redeem"
                  className="inline-flex items-center justify-center h-14 px-8 bg-gray-900 hover:bg-gray-805 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg hover:shadow-brand-500/10 transition-all duration-300 gap-2 group/btn"
                >
                  Redeem Now
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Quick Recharge Section */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-6 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic">
                  POWER UP <ChevronRight size={24} className="text-brand-500" />
                </h2>
                {isWelcomeOfferEligible ? (
                  <div className="flex items-center gap-2 text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-2xl">
                    <Trophy size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      10% Welcome Offer Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-50 dark:bg-gray-850/50 px-4 py-2 rounded-2xl">
                    <Gift size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      Welcome Offer Claimed
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {rechargeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setRechargeAmount(opt)}
                    className={`relative overflow-hidden group py-6 rounded-[2rem] border-2 transition-all ${
                      rechargeAmount === opt
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-lg shadow-brand-500/10 scale-105"
                        : "border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-400"
                    }`}
                  >
                    {rechargeAmount === opt && (
                      <div className="absolute top-0 right-0 p-2">
                        <CheckCircle2 size={14} className="text-brand-500" />
                      </div>
                    )}
                    <p
                      className={`text-xl font-black italic tracking-tighter transition-colors ${rechargeAmount === opt ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-600"}`}
                    >
                      ₹{opt}
                    </p>
                    <p
                      className={`text-[8px] font-black uppercase tracking-widest mt-1 ${rechargeAmount === opt ? "text-brand-400" : "text-gray-500"}`}
                    >
                      Select Plan
                    </p>
                  </button>
                ))}
              </div>

              {/* Bonus Power-up Visualization */}
              <motion.div
                key={rechargeAmount}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative h-24 rounded-3xl overflow-hidden mb-10 shadow-lg"
              >
                {bonusAmount > 0 ? (
                  <>
                    <div className="absolute inset-0 bg-brand-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-pink-600" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gray-900" />
                )}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Gift size={64} />
                </div>
                <div className="relative h-full px-8 flex items-center justify-between text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <Zap size={24} fill={bonusAmount > 0 ? "white" : "none"} className={bonusAmount > 0 ? "" : "text-white"} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {bonusAmount > 0 ? "Instant Welcome Bonus Applied" : "Standard Wallet Top-Up"}
                      </p>
                      <h4 className="text-xl font-black italic tracking-tighter">
                        Get ₹{rechargeAmount + bonusAmount} Total Value
                      </h4>
                    </div>
                  </div>
                  {bonusAmount > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="text-3xl font-black italic tracking-tighter">
                        +₹{bonusAmount}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        Free Credits
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              <button
                onClick={handleRecharge}
                disabled={rechargeMutation.isPending}
                className="group w-full h-20 bg-gray-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-950/20 hover:bg-black hover:shadow-brand-500/20 transition-all flex items-center justify-center gap-4 text-lg overflow-hidden relative"
              >
                {rechargeMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-3">
                      CONFIRM TOP-UP{" "}
                      <ArrowUpRight
                        size={24}
                        className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                      />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-pink-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-50" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── Right: History ─────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 p-8 md:p-10 shadow-xl shadow-black/5 sticky top-28">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic">
                  HISTORY <History className="text-brand-500" />
                </h2>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Last 30 Days
                </div>
              </div>

              {isLoadingTx ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-2xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-lg w-3/4" />
                        <div className="h-3 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-lg w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions?.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                    No Transactions
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions?.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-[2rem] border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:shadow-lg transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 ${
                            tx.amount > 0
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                              : "bg-red-50 dark:bg-red-900/20 text-red-600"
                          }`}
                        >
                          {tx.amount > 0 ? (
                            <ArrowDownLeft size={22} />
                          ) : (
                            <ArrowUpRight size={22} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                            {tx.description}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(tx.createdAt).toLocaleDateString(
                              undefined,
                              { day: "numeric", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-black italic tracking-tighter ${tx.amount > 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {tx.amount > 0 ? "+" : ""}₹
                          {Math.abs(tx.amount).toFixed(0)}
                        </p>
                        {tx.amount > 100 &&
                          tx.amount % 100 === 0 &&
                          tx.amount > 0 && (
                            <p className="text-[8px] font-black text-brand-500 uppercase tracking-widest">
                              +Bonus Included
                            </p>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <button className="w-full mt-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-brand-500 transition-colors border-t border-gray-50 dark:border-gray-800">
                View Full Statement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckCircle2 = ({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
