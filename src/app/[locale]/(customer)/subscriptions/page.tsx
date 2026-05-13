"use client";

import { trpc } from "@/lib/trpc";
import {
  Calendar,
  RotateCcw,
  Trash2,
  Plus,
  ShoppingBag,
  Clock,
  ChevronRight,
  Loader2,
  Bell,
  Sparkles,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useState } from "react";

export default function SubscriptionsPage() {
  const utils = trpc.useUtils();
  const { data: subs, isLoading } = trpc.subscription.list.useQuery();

  const toggleMutation = trpc.subscription.toggle.useMutation({
    onSuccess: () => {
      toast.success("Subscription status updated!");
      utils.subscription.list.invalidate();
    },
  });

  const deleteMutation = trpc.subscription.delete.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled");
      utils.subscription.list.invalidate();
    },
  });

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAUSED">("ACTIVE");

  const filteredSubs = subs?.filter((s) =>
    activeTab === "ACTIVE" ? s.isActive : !s.isActive,
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">
              My Subscriptions
            </h1>
            <Link
              href="/"
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:scale-110 transition-transform"
            >
              <Plus className="text-brand-500" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-1.5">
              <Sparkles size={12} /> Personalized Schedule
            </div>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
              <RotateCcw size={12} /> Recurring Savings
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white mb-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-black italic tracking-tight mb-2">
                Smart Subscriptions
              </h2>
              <p className="text-gray-400 text-sm font-medium max-w-xs">
                Set it once, and we'll deliver it on your schedule. No more
                last-minute runs!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center p-4 bg-white/5 rounded-3xl border border-white/10 w-28 text-center">
                <p className="text-brand-400 font-black text-xl italic">₹0</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Del. Fee
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-white/5 rounded-3xl border border-white/10 w-28 text-center">
                <p className="text-blue-400 font-black text-xl italic">10%</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Off Extra
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "ACTIVE" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab("PAUSED")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "PAUSED" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
          >
            Paused
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-40 bg-gray-100 animate-pulse rounded-[2.5rem]"
              />
            ))}
          </div>
        ) : filteredSubs?.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              No {activeTab.toLowerCase()} subscriptions
            </h3>
            <p className="text-gray-500 mt-2 text-sm">
              Add daily essentials like milk, bread or eggs to save more.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 btn-primary px-8"
            >
              Start Subscribing <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubs?.map((sub) => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Info */}
                  <div className="relative w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                    <Image
                      src={sub.product.images[0]}
                      alt={sub.product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                      {sub.frequency}
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
                          {sub.product.name}
                        </h3>
                        <p className="text-2xl font-black text-brand-600">
                          ₹{sub.product.price * sub.quantity}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                          <RotateCcw size={14} className="text-brand-500" />
                          <span>Qty: {sub.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                          <Clock size={14} className="text-blue-500" />
                          <span>
                            Next: {new Date(sub.nextOrder).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {sub.address && (
                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50/50 p-3 rounded-2xl border border-dashed border-gray-200">
                          <MapPin
                            size={14}
                            className="shrink-0 mt-0.5 text-gray-300"
                          />
                          <div>
                            <p className="font-black uppercase tracking-widest text-[9px] mb-0.5">
                              Delivering To: {sub.address.label}
                            </p>
                            <p className="font-medium line-clamp-1">
                              {sub.address.line1}, {sub.address.city}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <button
                        onClick={() => toggleMutation.mutate({ id: sub.id })}
                        className={`flex-grow h-12 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${sub.isActive ? "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"}`}
                      >
                        {sub.isActive ? (
                          <>
                            <PauseCircle size={18} /> Pause Order
                          </>
                        ) : (
                          <>
                            <PlayCircle size={18} /> Resume Order
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Cancel this subscription?"))
                            deleteMutation.mutate({ id: sub.id });
                        }}
                        className="w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Support */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-white">
              <Bell size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                Need Changes?
              </p>
              <p className="text-[10px] font-bold text-gray-400">
                Update frequency or address via support.
              </p>
            </div>
            <Link
              href="/help"
              className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
