"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "@/navigation";
import toast from "react-hot-toast";
import {
  Crown,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Coins,
  Sparkles,
  Copy,
  Check,
  Loader2,
  QrCode,
  Info,
} from "lucide-react";

export default function MembershipPage() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.user.me.useQuery(undefined, {
    retry: false,
  });

  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpiDetails, setShowUpiDetails] = useState(false);

  const toggleAutopayMutation = trpc.user.toggleAutopay.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      toast.success("Autopay preferences updated successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const buyWithWalletMutation = trpc.user.buyMembershipWithWallet.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      toast.success("🎉 Welcome to the VIP Club! Your membership is now active.");
    },
    onError: (err) => toast.error(err.message),
  });

  const submitManualPaymentMutation =
    trpc.user.submitMembershipManualPayment.useMutation({
      onSuccess: () => {
        utils.user.me.invalidate();
        setUtr("");
        setShowUpiDetails(false);
        toast.success("Payment details submitted. Admin will verify it shortly!");
      },
      onError: (err) => toast.error(err.message),
    });

  const handleToggleAutopay = () => {
    if (!profile) return;
    toggleAutopayMutation.mutate({ autopay: !profile.subscriptionAutopay });
  };

  const handleBuyWithWallet = () => {
    if (confirm("Are you sure you want to purchase 1-Month VIP Membership for ₹29 from your wallet?")) {
      buyWithWalletMutation.mutate();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.length !== 12 || !/^\d+$/.test(utr)) {
      toast.error("UTR must be exactly a 12-digit number.");
      return;
    }
    submitManualPaymentMutation.mutate({ utr });
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("deeshware15-2@okicici");
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest">
            Loading VIP Club...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-950 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 animate-pulse">
            <Crown size={38} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Join Deeshora VIP</h1>
            <p className="text-gray-400 text-sm mt-2">
              Sign in to unlock free platform fees and premium benefits.
            </p>
          </div>
          <Link href="/sign-in" className="btn-primary w-full text-center block bg-indigo-600 hover:bg-indigo-700 py-3 rounded-2xl text-white font-bold shadow-lg shadow-indigo-600/20">
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  const isVip =
    profile.subscriptionStatus === "ACTIVE" &&
    profile.subscriptionExpiresAt &&
    new Date(profile.subscriptionExpiresAt) > new Date();

  const isPending = profile.subscriptionStatus === "PENDING";

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header and Background Glow */}
      <div className="relative overflow-hidden py-16 bg-gradient-to-b from-indigo-900/40 via-purple-950/20 to-transparent">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={14} className="animate-spin duration-3000" />
            Deeshora Elite Member Club
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-amber-200">
            VIP CLUB MEMBERSHIP
          </h1>
          <p className="mt-4 text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Upgrade to Deeshora VIP and say goodbye to platform fees on all checkouts. Order as much as you like, zero extra fees.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl grid md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Status / Purchase Panel */}
        <div className="md:col-span-7 space-y-6">
          {/* VIP Status Card */}
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 to-purple-950/50 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                  Your VIP Status
                </p>
                {isVip ? (
                  <h2 className="text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 flex items-center gap-2">
                    Active Member
                  </h2>
                ) : isPending ? (
                  <h2 className="text-3xl font-black mt-1 text-amber-400 flex items-center gap-2">
                    Pending Approval
                  </h2>
                ) : (
                  <h2 className="text-3xl font-black mt-1 text-gray-300">
                    Not Subscribed
                  </h2>
                )}
              </div>
              <div className={`p-4 rounded-2xl ${isVip ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-gray-800 border border-gray-700 text-gray-500"}`}>
                <Crown size={28} className={isVip ? "animate-bounce" : ""} />
              </div>
            </div>

            {isVip && profile.subscriptionExpiresAt && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} /> Expires On:
                  </span>
                  <span className="font-mono text-gray-200 font-bold">
                    {new Date(profile.subscriptionExpiresAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}

            {isPending && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs font-bold text-amber-300 uppercase">
                    Verification in Progress
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your UTR <span className="font-mono font-bold text-white">{profile.subscriptionUtr}</span> is submitted. Admin is verifying the payment. It usually takes 10-30 minutes.
                  </p>
                </div>
              </div>
            )}

            {!isVip && !isPending && (
              <div className="mt-8 space-y-4">
                <div className="flex items-baseline justify-between border-b border-gray-800 pb-4">
                  <span className="text-gray-400 text-sm">Monthly Plan</span>
                  <div className="text-right">
                    <span className="text-3xl font-black tracking-tight text-white">₹29</span>
                    <span className="text-gray-400 text-xs"> / month</span>
                  </div>
                </div>

                {/* Purchase Methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Wallet Option */}
                  <button
                    onClick={handleBuyWithWallet}
                    disabled={buyWithWalletMutation.isPending}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 hover:bg-indigo-950/50 hover:border-indigo-500/40 transition-all text-center group disabled:opacity-50"
                  >
                    <Wallet className="text-indigo-400 group-hover:scale-110 transition-transform mb-2" size={24} />
                    <span className="text-xs font-black uppercase tracking-wider">Buy via Wallet</span>
                    <span className="text-[10px] text-gray-400 mt-1">Bal: ₹{profile.walletBalance.toFixed(2)}</span>
                  </button>

                  {/* UPI Option */}
                  <button
                    onClick={() => setShowUpiDetails(true)}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border border-purple-500/20 bg-purple-950/20 hover:bg-purple-950/50 hover:border-purple-500/40 transition-all text-center group"
                  >
                    <QrCode className="text-purple-400 group-hover:scale-110 transition-transform mb-2" size={24} />
                    <span className="text-xs font-black uppercase tracking-wider">Pay via UPI</span>
                    <span className="text-[10px] text-gray-400 mt-1">Manual approval</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Autopay Control Card */}
          {isVip && (
            <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl flex justify-between items-center shadow-lg">
              <div className="space-y-1">
                <h3 className="font-bold flex items-center gap-1.5">
                  <Coins size={16} className="text-indigo-400" />
                  Auto-Renewal (Wallet AutoPay)
                </h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Enable autopay to renew subscription automatically for ₹29 every 30 days using your wallet balance.
                </p>
              </div>
              <button
                onClick={handleToggleAutopay}
                disabled={toggleAutopayMutation.isPending}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {profile.subscriptionAutopay ? (
                  <ToggleRight size={44} className="text-indigo-500" />
                ) : (
                  <ToggleLeft size={44} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Benefits Panel */}
        <div className="md:col-span-5 space-y-6">
          {/* VIP Benefits List */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900/30 p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              VIP Member Benefits
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-200">Zero Platform Fees</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Platform fee of ₹1 is completely waived for VIPs on every order.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-200">Instant Wallet Renewal</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Renew instantly using wallet balance. Fast and secure.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-200">Autopay Convenience</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Never worry about expiration with auto-renewal from wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 flex items-center gap-2 text-[10px] text-gray-400">
              <ShieldCheck size={14} className="text-indigo-400" />
              Secure payments & encrypted data protection
            </div>
          </div>
        </div>
      </div>

      {/* Manual UPI Overlay Modal */}
      {showUpiDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 relative">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <QrCode size={20} className="text-purple-400" />
              Pay via UPI (₹29)
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 text-center space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Admin UPI Address
                </p>
                <div className="flex items-center justify-center gap-2 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                  <span className="font-mono text-white font-bold select-all">deeshware15-2@okicici</span>
                  <button
                    onClick={copyUpiId}
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-2xl flex gap-3 text-xs text-indigo-300">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  Scan or transfer exactly <strong>₹29</strong> to the above UPI address, then input the 12-digit UPI transaction reference (UTR) below to activate subscription.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="utr" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    12-digit UTR Number
                  </label>
                  <input
                    id="utr"
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    maxLength={12}
                    placeholder="Enter UPI Reference / UTR Number"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpiDetails(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-800 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitManualPaymentMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {submitManualPaymentMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        Verify Payment <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
