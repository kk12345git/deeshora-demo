"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";
import { User, Mail, Shield, LogOut, PackageCheck, IndianRupee, Award, Loader2 } from "lucide-react";

export default function DeliveryProfilePage() {
  const { user } = useUser();
  const { data: realStats, isLoading } = trpc.delivery.getStats.useQuery();

  if (isLoading) return (
    <div className="py-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  );

  const stats = [
    { 
      label: "Deliveries", 
      value: realStats?.lifetimeDeliveries.toString() || "0", 
      icon: PackageCheck, 
      color: "text-blue-500" 
    },
    { 
      label: "Earnings", 
      value: `₹${realStats?.totalEarnings.toLocaleString() || "0"}`, 
      icon: IndianRupee, 
      color: "text-green-500" 
    },
    { 
      label: "Level", 
      value: (realStats?.lifetimeDeliveries || 0) > 100 ? "Gold" : "Active", 
      icon: Award, 
      color: "text-purple-500" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-[2.5rem] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        
        <div className="w-24 h-24 rounded-3xl bg-gray-800 border-4 border-gray-950 mx-auto mb-6 overflow-hidden shadow-2xl">
          {user?.imageUrl && <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />}
        </div>
        
        <h2 className="text-2xl font-black text-white italic capitalize mb-1">{user?.fullName}</h2>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
           <Shield size={12} className="text-blue-500" />
           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Verified Partner</span>
        </div>

        <div className="flex items-center justify-center gap-4 text-gray-500 text-sm font-medium">
           <div className="flex items-center gap-1.5">
              <Mail size={14} />
              <span>{user?.primaryEmailAddress?.emailAddress}</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
         {stats.map((stat) => {
            const Icon = stat.icon;
            return (
               <div key={stat.label} className="bg-gray-900 border border-gray-800 p-4 rounded-3xl text-center">
                  <div className={`w-10 h-10 rounded-2xl bg-gray-950 flex items-center justify-center mx-auto mb-3 ${stat.color} shadow-inner`}>
                     <Icon size={20} />
                  </div>
                  <div className="text-lg font-black text-white">{stat.value}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
               </div>
            );
         })}
      </div>

      {/* Account Settings */}
      <div className="space-y-3">
         <button className="w-full h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-between px-6 hover:bg-gray-800 transition-all group">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                  <User size={18} />
               </div>
               <span className="font-bold text-gray-200">Personal Details</span>
            </div>
            <div className="text-gray-600">→</div>
         </button>

         <SignOutButton>
            <button className="w-full h-16 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between px-6 hover:bg-red-500/10 transition-all group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 transition-colors">
                     <LogOut size={18} />
                  </div>
                  <span className="font-bold text-red-500">Log Out Hub</span>
               </div>
            </button>
         </SignOutButton>
      </div>

      <div className="text-center pt-4">
         <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Deeshora Logistics v1.0.4</p>
      </div>
    </div>
  );
}
