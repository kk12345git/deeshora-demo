"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserRound, Store, Truck, ArrowRight, Loader2, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const setRoleMutation = trpc.user.setRole.useMutation({
    onSuccess: async (res) => {
      toast.success("Role selected successfully!");
      if (user) await user.reload();
      
      if (res.role === "VENDOR") {
        router.push("/vendor/register");
      } else if (res.role === "DELIVERY_PARTNER") {
        router.push("/delivery/register");
      } else {
        router.push("/");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    }
  });

  const roles = [
    {
      id: "CUSTOMER",
      title: "Customer",
      subtitle: "Shopping Enthusiast",
      description: "Discover unique products from local shops and get them delivered to your doorstep.",
      icon: UserRound,
      color: "from-blue-500 to-indigo-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      features: ["Instant Delivery", "Local Specialties", "Easy Tracking"]
    },
    {
      id: "VENDOR",
      title: "Vendor",
      subtitle: "Local Hero",
      description: "List your products, reach thousands of local customers, and grow your business digitally.",
      icon: Store,
      color: "from-orange-500 to-red-600",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      features: ["Shop Analytics", "Inventory Control", "Daily Payouts"]
    },
    {
      id: "DELIVERY_PARTNER",
      title: "Delivery Hub",
      subtitle: "Delivery Warrior",
      description: "Join our delivery network, choose your own hours, and earn money for every delivery.",
      icon: Truck,
      color: "from-emerald-500 to-teal-600",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      features: ["Flexible Hours", "Weekly Earnings", "Partner Rewards"]
    }
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    setRoleMutation.mutate({ role: selectedRole as any });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 md:p-12">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Welcome to Deeshora
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4"
          >
            Tell us who <span className="text-orange-500">you are.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium"
          >
            Select your role to personalize your experience. This helps us provide the right tools for your journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -8 }}
              onClick={() => setSelectedRole(role.id)}
              className={`relative cursor-pointer group p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col h-full ${
                selectedRole === role.id
                  ? `bg-white dark:bg-gray-900 border-orange-500 shadow-2xl shadow-orange-500/10 scale-105 ring-4 ring-orange-500/5`
                  : "bg-white/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900"
              }`}
            >
              {/* Icon Container */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                selectedRole === role.id ? `bg-gradient-to-br ${role.color} text-white rotate-6` : `${role.lightColor} ${role.textColor}`
              }`}>
                <role.icon size={32} />
              </div>

              {/* Content */}
              <div className="flex-grow space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{role.title}</h3>
                    <p className={`text-xs font-black uppercase tracking-widest ${selectedRole === role.id ? "text-orange-500" : "text-gray-400"}`}>
                      {role.subtitle}
                    </p>
                  </div>
                  {selectedRole === role.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                      <ShieldCheck size={14} />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {role.description}
                </p>

                {/* Features List */}
                <div className="pt-4 space-y-2">
                  {role.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      <Zap size={10} className="text-orange-400" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              <div className={`absolute bottom-6 right-8 transition-all duration-300 ${
                selectedRole === role.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}>
                <ArrowRight className="text-orange-500" size={24} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            disabled={!selectedRole || setRoleMutation.isPending}
            onClick={handleContinue}
            className={`group relative flex items-center justify-center gap-3 px-12 py-5 rounded-[2rem] font-black text-lg transition-all duration-500 overflow-hidden ${
              selectedRole 
                ? "bg-gray-900 text-white shadow-2xl hover:bg-black hover:scale-105 active:scale-95" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {setRoleMutation.isPending ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Confirm Selection
                <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={24} />
              </>
            )}
            {selectedRole && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            )}
          </button>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
            This choice can be updated later in your profile settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
