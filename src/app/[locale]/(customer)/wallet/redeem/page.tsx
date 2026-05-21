"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useRouter } from "@/navigation";
import {
  ArrowLeft,
  Trophy,
  Coins,
  Sparkles,
  History,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Gift,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function RedeemPointsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: balance = 0, isLoading: isLoadingBalance } =
    trpc.wallet.getBalance.useQuery();
  const { data: points = 0, isLoading: isLoadingPoints } =
    trpc.wallet.getRedeemPoints.useQuery();
  const { data: transactions, isLoading: isLoadingTx } =
    trpc.wallet.getRedeemTransactions.useQuery();

  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successRedeemed, setSuccessRedeemed] = useState<number>(0);

  const redeemMutation = trpc.wallet.redeemPoints.useMutation({
    onSuccess: (data) => {
      toast.success("Points successfully converted to wallet cash! 🎉");
      setSuccessRedeemed(data.redeemed);
      setIsSuccess(true);
      setRedeemAmount("");
      utils.wallet.getBalance.invalidate();
      utils.wallet.getRedeemPoints.invalidate();
      utils.wallet.getRedeemTransactions.invalidate();
      utils.wallet.getTransactions.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to redeem points.");
    },
  });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(redeemAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount of points to redeem.");
      return;
    }
    if (amount > points) {
      toast.error("You cannot redeem more points than your current balance.");
      return;
    }
    redeemMutation.mutate({ points: amount });
  };

  const handleConvertAll = () => {
    if (points <= 0) {
      toast.error("You don't have any points to redeem.");
      return;
    }
    setRedeemAmount(Math.floor(points).toString());
  };

  // Convert input string to numeric value for checks
  const parsedRedeemAmount = parseFloat(redeemAmount) || 0;
  const isInputValid = parsedRedeemAmount > 0 && parsedRedeemAmount <= points;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* ─── Back Button & Header ─────────────────────────────────── */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-wider transition-colors border border-gray-100 dark:border-gray-800/80"
          >
            <ArrowLeft size={16} /> Back to Wallet
          </Link>
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-2 backdrop-blur-md">
            <Sparkles size={14} className="animate-pulse" /> 1 Point = ₹1 Cash
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic">
            REDEEM<span className="text-purple-600"> POINTS</span>
          </h1>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">
            Convert product reward points into spendable wallet balance
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* ─── Left Column: Balance & Convertor ─────────────────────── */}
          <div className="md:col-span-7 space-y-8">
            {/* Holographic Balance Card */}
            <div className="relative overflow-hidden rounded-[3rem] p-10 border border-purple-500/30 bg-gradient-to-br from-purple-600 via-indigo-700 to-brand-700 text-white shadow-2xl shadow-purple-500/20">
              {/* Dynamic light gradient overlays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 blur-[100px] rounded-full"
              />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Trophy className="text-yellow-300" size={32} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      Wallet Balance
                    </p>
                    <p className="text-xl font-black italic tracking-tight text-white">
                      ₹{isLoadingBalance ? "..." : balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">
                    Total Reward Points
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl md:text-7xl font-black italic tracking-tighter text-white">
                      {isLoadingPoints ? "..." : points.toFixed(2)}
                    </span>
                    <span className="text-sm font-black uppercase tracking-widest text-white/60">
                      pts
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Coins size={14} className="text-yellow-300" /> Auto-crediting active
                  </span>
                  <span>100% Secure Transfer</span>
                </div>
              </div>
            </div>

            {/* Redemption Converter Form */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800/80 p-8 md:p-10 shadow-xl shadow-black/5 relative">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic mb-8 uppercase">
                CONVERT POINTS <ChevronRight size={24} className="text-purple-600" />
              </h2>

              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="redeem-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleRedeem}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Amount to Convert
                        </label>
                        <button
                          type="button"
                          onClick={handleConvertAll}
                          className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest hover:underline"
                        >
                          Convert All Points
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="1"
                          max={points}
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="Enter amount (e.g. 50)"
                          className="w-full h-20 bg-gray-50 dark:bg-gray-850 border-2 border-gray-100 dark:border-gray-800 rounded-3xl px-8 pr-24 text-2xl font-black italic tracking-tight text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          Points
                        </span>
                      </div>
                    </div>

                    {/* Conversion Live Calculation Display */}
                    <div className="h-20 bg-gray-50 dark:bg-gray-850/50 rounded-3xl p-5 flex items-center justify-between border border-gray-100/50 dark:border-gray-800/50">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Total wallet cash to receive
                        </p>
                        <p className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-white mt-0.5">
                          +₹{parsedRedeemAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Remaining points
                        </p>
                        <p className="text-xs font-black text-gray-600 dark:text-gray-300 mt-1">
                          {(points - parsedRedeemAmount).toFixed(2)} pts
                        </p>
                      </div>
                    </div>

                    {/* Warning if converting more than owned */}
                    {parsedRedeemAmount > points && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30">
                        <AlertCircle size={16} />
                        You cannot redeem more points than you own.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={redeemMutation.isPending || !isInputValid}
                      className="group w-full h-20 bg-gray-950 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 transition-all flex items-center justify-center gap-4 text-base relative overflow-hidden"
                    >
                      {redeemMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          <span className="relative z-10 flex items-center gap-3">
                            CONVERT TO WALLET CASH{" "}
                            <ChevronRight
                              size={20}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-80" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                      <CheckCircle2 size={44} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white uppercase">
                        Redemption Successful!
                      </h3>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Converted {successRedeemed} Points to ₹{successRedeemed} Wallet Cash
                      </p>
                    </div>
                    <div className="flex gap-4 max-w-sm mx-auto">
                      <button
                        onClick={() => setIsSuccess(false)}
                        className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 transition-colors"
                      >
                        Convert More
                      </button>
                      <Link
                        href="/wallet"
                        className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        Go to Wallet <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── Right Column: Points Ledger History ─────────────────── */}
          <div className="md:col-span-5">
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800/80 p-8 md:p-10 shadow-xl shadow-black/5 sticky top-28">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic uppercase">
                  LEDGER <History className="text-purple-600" />
                </h2>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Points History
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
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-850/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <Trophy size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
                    No points transactions
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1 px-4">
                    Earn 1% reward points on every product purchase
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                            tx.type === "EARNED"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
                          }`}
                        >
                          {tx.type === "EARNED" ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white line-clamp-1">
                            {tx.description}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString(
                              undefined,
                              { day: "numeric", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <p
                          className={`text-sm font-black italic tracking-tight ${
                            tx.type === "EARNED"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-purple-600 dark:text-purple-400"
                          }`}
                        >
                          {tx.type === "EARNED" ? "+" : ""}
                          {tx.points.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="w-full mt-8 pt-6 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] text-center border-t border-gray-50 dark:border-gray-800">
                Purchase more to earn more rewards
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
