// src/app/(vendor)/vendor/settings/page.tsx
"use client";

import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function VendorSettingsPage() {
  const { data: profile, isLoading } = trpc.vendor.myProfile.useQuery();
  const updateMutation = trpc.vendor.updateProfile.useMutation({
    onSuccess: () => toast.success("Profile updated successfully!"),
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Filter out empty strings so we don't overwrite existing values with blanks
    const data = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => v !== '' && typeof v === 'string')
    );
    updateMutation.mutate(data as Parameters<typeof updateMutation.mutate>[0]);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-8">Shop Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/20">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Partner Profile</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="shopName" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shop Name</label>
              <input type="text" name="shopName" id="shopName" defaultValue={profile?.shopName} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Phone</label>
              <input type="text" name="phone" id="phone" defaultValue={profile?.phone} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="text-xs font-bold text-gray-500 uppercase tracking-widest">City</label>
              <input type="text" name="city" id="city" defaultValue={profile?.city} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Address</label>
              <input type="text" name="address" id="address" defaultValue={profile?.address} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shop Description</label>
              <textarea name="description" id="description" rows={3} defaultValue={profile?.description || ''} className="w-full p-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
          </div>
        </div>

        <div className="card p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/20">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Financial Setup</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="bankAccount" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bank Account Number</label>
              <input type="text" name="bankAccount" id="bankAccount" defaultValue={profile?.bankAccount || ''} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="ifscCode" className="text-xs font-bold text-gray-500 uppercase tracking-widest">IFSC Code</label>
              <input type="text" name="ifscCode" id="ifscCode" defaultValue={profile?.ifscCode || ''} className="w-full h-12 px-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-12 h-14 rounded-2xl shadow-xl shadow-orange-500/20 font-black tracking-widest uppercase" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Update Studio Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}