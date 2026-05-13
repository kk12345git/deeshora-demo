// src/app/[locale]/(customer)/profile/referrals/page.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Users, Gift, Copy, Share2, 
  CheckCircle, ArrowLeft, Loader2, TrendingUp, IndianRupee, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ReferralDashboard() {
  const { data: profile, isLoading } = trpc.user.me.useQuery();
  const [isCopying, setIsCopying] = useState(false);

  const copyToClipboard = () => {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    setIsCopying(true);
    toast.success('Referral code copied!');
    setTimeout(() => setIsCopying(false), 2000);
  };

  const shareLink = () => {
    if (!profile?.referralCode) return;
    const text = `Join me on Deeshora and get amazing local deliveries! Use my code: ${profile.referralCode}`;
    const url = `${window.location.origin}/sign-up?ref=${profile.referralCode}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Deeshora Referral', text, url });
    } else {
      copyToClipboard();
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Invite & Earn</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px] mt-0.5">Spread the word, get rewards</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-brand-500 to-rose-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Gift size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black leading-tight">Get ₹50 for every friend!</h2>
            <p className="text-brand-100 text-sm font-medium">When your friend places their first order, we&apos;ll send a ₹50 coupon straight to your wallet.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center gap-4 border border-white/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-100">Your Referral Code</p>
            <div className="flex items-center gap-3 w-full">
               <div className="flex-1 bg-white rounded-2xl py-4 text-center">
                 <span className="text-2xl font-black text-gray-900 tracking-widest uppercase">{profile?.referralCode || '------'}</span>
               </div>
               <button 
                 onClick={copyToClipboard}
                className="w-14 h-14 bg-brand-400 hover:bg-brand-300 rounded-2xl flex items-center justify-center transition-colors shadow-lg"
               >
                 {isCopying ? <CheckCircle size={24} /> : <Copy size={24} />}
               </button>
            </div>
            <button 
               onClick={shareLink}
              className="w-full py-4 bg-white text-brand-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> Share Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-1">
            <Users size={24} />
          </div>
          <p className="text-2xl font-black text-gray-900">{profile?._count.referrals || 0}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Friends Joined</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1">
            <TrendingUp size={24} />
          </div>
          <p className="text-2xl font-black text-gray-900">₹{(profile?._count.referrals || 0) * 50}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Potential Earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 space-y-6">
        <h3 className="font-black text-gray-900 flex items-center gap-2">
          <Sparkles size={18} className="text-brand-500" /> How it works
        </h3>
        <div className="space-y-6">
          <Step 
             number="01" 
             title="Share your code" 
             desc="Send your unique referral code or link to your friends and family." 
           />
          <Step 
             number="02" 
             title="They sign up" 
             desc="Your friend joins Deeshora using your link or code during registration." 
           />
          <Step 
             number="03" 
             title="You both win" 
             desc="Once they complete their first delivery, you get a ₹50 discount coupon!" 
           />
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl font-black text-brand-100 leading-none">{number}</div>
      <div>
        <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">{title}</h4>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
