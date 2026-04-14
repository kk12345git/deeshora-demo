// src/app/(vendor)/vendor/settings/page.tsx
"use client";

import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { 
  Loader2, Store, Phone, MapPin, CreditCard, 
  Building2, Fingerprint, Smartphone, FileText, 
  CheckCircle, Image as ImageIcon, Upload, 
  Camera, Layout, Sparkles, X
} from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all ${props.className || ""}`}
    />
  );
}

export default function VendorSettingsPage() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.vendor.myProfile.useQuery();
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);

  const updateMutation = trpc.vendor.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Identity updated! 🎉");
      utils.vendor.myProfile.invalidate();
      setLogoBase64(null);
      setCoverBase64(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large! Please keep it under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'logo') setLogoBase64(base64);
      else setCoverBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData: Record<string, any> = {};
    
    // Capture all non-file fields, even if empty (to allow clearing)
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        rawData[key] = value;
      }
    });

    const payload = {
      ...rawData,
      logo: logoBase64 || undefined,
      coverImage: coverBase64 || undefined,
    };

    updateMutation.mutate(payload as any);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4">
      <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Studio...</p>
    </div>
  );

  const hasBank = !!(profile?.bankAccount && profile?.ifscCode);
  const hasGst = !!profile?.gstNumber;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={12} /> Partner Experience
          </p>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter mt-1">Vendor Studio</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Design your shop's digital identity and manage operations.</p>
        </div>
        <div className="flex gap-3">
           <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full ${hasBank ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              Bank {hasBank ? 'Ready' : 'Incomplete'}
           </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ─── Shop Identity & Branding (The NEW Section) ─── */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                    <Layout size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Identity Lab</h2>
                    <p className="text-xs text-gray-400 font-bold">Customize how customers see your shop</p>
                 </div>
              </div>
           </div>

           <div className="p-8 space-y-8">
              {/* Cover Image Uploader */}
              <div className="space-y-4">
                 <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Cover Banner</label>
                 <div className="relative h-48 w-full bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden group">
                    {(coverBase64 || profile?.coverImage) ? (
                       <>
                          <Image 
                            src={coverBase64 || profile?.coverImage || ''} 
                            alt="Cover Preview" 
                            fill 
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                             <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
                                <Upload size={14} /> Change Cover
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                             </label>
                             {coverBase64 && (
                                <button onClick={() => setCoverBase64(null)} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600">
                                   <X size={14} />
                                </button>
                             )}
                          </div>
                       </>
                    ) : (
                       <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                          <ImageIcon size={32} className="text-gray-300 mb-2" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Cover Banner</p>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                       </label>
                    )}
                 </div>
              </div>

              {/* Logo Uploader */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Shop Logo</label>
                    <div className="relative w-32 h-32 bg-gray-50 rounded-full border-2 border-dashed border-gray-200 overflow-hidden group">
                       {(logoBase64 || profile?.logo) ? (
                          <>
                             <Image 
                               src={logoBase64 || profile?.logo || ''} 
                               alt="Logo Preview" 
                               fill 
                               className="object-cover"
                             />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:scale-110 transition-transform">
                                   <Camera size={20} />
                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                </label>
                             </div>
                          </>
                       ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                             <Upload size={24} className="text-gray-300 mb-1" />
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                          </label>
                       )}
                    </div>
                 </div>

                 <div className="flex-1 space-y-5">
                    <div className="grid md:grid-cols-2 gap-6">
                       <FieldGroup label="Display Name" hint="This name will appear on the storefront">
                          <Input name="shopName" defaultValue={profile?.shopName} placeholder="Your Cheerful Shop Name" />
                       </FieldGroup>
                       <FieldGroup label="Business Category">
                          <select 
                            name="category" 
                            defaultValue={profile?.category || ''}
                            className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all appearance-none cursor-pointer"
                          >
                             <option value="">Select Category</option>
                             <option value="Groceries">Groceries</option>
                             <option value="Electronics">Electronics</option>
                             <option value="Gift Shop">Gift Shop</option>
                             <option value="Restaurant">Restaurant</option>
                             <option value="Pharmacy">Pharmacy</option>
                             <option value="Other">Other</option>
                          </select>
                       </FieldGroup>
                    </div>
                    <FieldGroup label="Signature Tagline" hint="Keep it cheerful and welcoming">
                       <Input name="description" defaultValue={profile?.description || ''} placeholder="Fresh. Local. Fast." />
                    </FieldGroup>
                 </div>
              </div>
           </div>
        </div>

        {/* ─── Distribution Details ─── */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                 <MapPin size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Distribution Hub</h2>
                 <p className="text-xs text-gray-400 font-bold">Configure your physical presence</p>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup label="Contact Phone">
                 <div className="relative">
                    <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input name="phone" defaultValue={profile?.phone} className="pl-12" placeholder="10-digit mobile" />
                 </div>
              </FieldGroup>
              <FieldGroup label="Active City">
                 <Input name="city" defaultValue={profile?.city} placeholder="e.g. Thiruvottriyur" />
              </FieldGroup>
              <div className="md:col-span-2">
                 <FieldGroup label="Hub Address">
                    <Input name="address" defaultValue={profile?.address} placeholder="Full street address" />
                 </FieldGroup>
              </div>
           </div>
        </div>

        {/* ─── Financial & Compliance ─── */}
        <div className="grid lg:grid-cols-2 gap-8">
           {/* Payout Wallet */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <CreditCard size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Payout Wallet</h2>
                    <p className="text-xs text-gray-400 font-bold">Manage where you receive earnings</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <FieldGroup label="Bank Name">
                       <Input name="bankName" defaultValue={profile?.bankName || ''} placeholder="e.g. HDFC Bank" />
                    </FieldGroup>
                    <FieldGroup label="Account Holder">
                       <Input name="bankAccountName" defaultValue={profile?.bankAccountName || ''} placeholder="Name as per bank" />
                    </FieldGroup>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <FieldGroup label="Account Number">
                       <Input name="bankAccount" defaultValue={profile?.bankAccount || ''} placeholder="Account Number" />
                    </FieldGroup>
                    <FieldGroup label="IFSC Code">
                       <Input name="ifscCode" defaultValue={profile?.ifscCode || ''} placeholder="HDFC0001234" />
                    </FieldGroup>
                 </div>
                 
                 <div className="pt-6 border-t border-gray-50">
                    <FieldGroup label="UPI ID for Instant Settlement" hint="Required for lightning-fast payouts">
                       <div className="relative">
                          <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                          <Input name="upiId" defaultValue={profile?.upiId || ''} className="pl-12 border-orange-50 focus:border-orange-500" placeholder="yourname@okaxis" />
                       </div>
                    </FieldGroup>
                 </div>
              </div>
           </div>

           {/* Tax & Compliance */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                    <Fingerprint size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Tax Identity</h2>
                    <p className="text-xs text-gray-400 font-bold">Business compliance details</p>
                 </div>
              </div>

              <div className="flex-1 space-y-6">
                 <FieldGroup label="GSTIN Number" hint="Professional identity for business customers">
                    <Input name="gstNumber" defaultValue={profile?.gstNumber || ''} placeholder="15-character GSTIN" />
                 </FieldGroup>

                 <div className="mt-auto bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-start gap-3">
                       <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase">
                          Your financial data is encrypted and used only for automated settlements. Keep these details updated to ensure no delay in your weekly payouts.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Final Action */}
        <div className="flex justify-end pt-4">
           <button
             type="submit"
             disabled={updateMutation.isPending}
             className="btn-primary px-16 h-16 rounded-[2rem] shadow-2xl shadow-orange-500/30 font-black tracking-[0.2em] uppercase flex items-center gap-4 text-sm group"
           >
             {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} className="group-hover:scale-125 transition-transform" />}
             {updateMutation.isPending ? 'Syncing...' : 'Update Identity'}
           </button>
        </div>
      </form>
    </div>
  );
}