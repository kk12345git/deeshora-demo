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
    const rawData = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => v !== '' && typeof v === 'string')
    );

    const payload = {
      ...rawData,
      logo: logoBase64 || undefined,
      coverImage: coverBase64 || undefined,
    };

    // @ts-ignore - dynamic type matching for trpc
    updateMutation.mutate(payload);
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
                    <FieldGroup label="Display Name" hint="This name will appear on the storefront">
                       <Input name="shopName" defaultValue={profile?.shopName} placeholder="Your Cheerful Shop Name" />
                    </FieldGroup>
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
        <div className="grid md:grid-cols-2 gap-8">
           {/* Bank */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <CreditCard size={20} />
                 </div>
                 <h3 className="font-black text-gray-900 uppercase tracking-tight">Payout Wallet</h3>
              </div>
              <div className="space-y-4">
                 <FieldGroup label="Bank Account">
                    <Input name="bankAccount" defaultValue={profile?.bankAccount || ''} placeholder="Account Number" />
                 </FieldGroup>
                 <FieldGroup label="IFSC Code">
                    <Input name="ifscCode" defaultValue={profile?.ifscCode || ''} placeholder="HDFC0001234" />
                 </FieldGroup>
              </div>
           </div>

           {/* GST */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                    <Fingerprint size={20} />
                 </div>
                 <h3 className="font-black text-gray-900 uppercase tracking-tight">Tax Identity</h3>
              </div>
              <FieldGroup label="GSTIN" hint="Leave blank if not registered">
                 <Input name="gstNumber" defaultValue={profile?.gstNumber || ''} placeholder="15-character GSTIN" />
              </FieldGroup>
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