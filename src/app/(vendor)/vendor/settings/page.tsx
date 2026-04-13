// src/app/(vendor)/vendor/settings/page.tsx
"use client";

import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Loader2, Store, Phone, MapPin, CreditCard, Building2, Fingerprint, Smartphone, FileText, CheckCircle } from "lucide-react";

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
      className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all"
    />
  );
}

export default function VendorSettingsPage() {
  const { data: profile, isLoading } = trpc.vendor.myProfile.useQuery();
  const updateMutation = trpc.vendor.updateProfile.useMutation({
    onSuccess: () => toast.success("Profile updated successfully! ✅"),
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => v !== '' && typeof v === 'string')
    );
    updateMutation.mutate(data as Parameters<typeof updateMutation.mutate>[0]);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  const hasBank = !!(profile?.bankAccount && profile?.ifscCode);
  const hasGst = !!profile?.gstNumber;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Vendor Studio</p>
        <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mt-1">Shop Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your store profile, bank details, and GST registration</p>
      </div>

      {/* Status Pills */}
      <div className="flex gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${hasBank ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          <CheckCircle size={11} /> Bank {hasBank ? 'Verified' : 'Not Added'}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${hasGst ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          <FileText size={11} /> GST {hasGst ? `Registered (${profile.gstNumber})` : 'Not Registered'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Shop Profile ─── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Store size={18} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Partner Profile</h2>
              <p className="text-xs text-gray-400">Visible to customers & platform</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <FieldGroup label="Shop Name">
              <Input name="shopName" defaultValue={profile?.shopName} placeholder="Your Shop Name" />
            </FieldGroup>
            <FieldGroup label="Contact Phone">
              <Input name="phone" defaultValue={profile?.phone} placeholder="10-digit mobile number" />
            </FieldGroup>
            <FieldGroup label="City">
              <Input name="city" defaultValue={profile?.city} placeholder="e.g., Chennai" />
            </FieldGroup>
            <FieldGroup label="Full Address">
              <Input name="address" defaultValue={profile?.address} placeholder="Shop address" />
            </FieldGroup>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Shop Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={profile?.description || ''}
                placeholder="Tell customers what your shop offers..."
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all"
              />
            </div>
          </div>
        </div>

        {/* ─── Bank & Financial ─── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Bank & Payment Details</h2>
              <p className="text-xs text-gray-400">Required for payouts — stored securely</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 text-xs text-amber-700 font-bold">
            ⚠️ Ensure details are accurate — incorrect bank info will delay your payouts.
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <FieldGroup label="Account Holder Name" hint="Name as it appears on your bank account">
              <Input name="bankAccountName" defaultValue={profile?.bankAccountName || ''} placeholder="Full Name on Account" />
            </FieldGroup>
            <FieldGroup label="Bank Name">
              <Input name="bankName" defaultValue={profile?.bankName || ''} placeholder="e.g., HDFC Bank, SBI" />
            </FieldGroup>
            <FieldGroup label="Bank Account Number">
              <Input name="bankAccount" defaultValue={profile?.bankAccount || ''} placeholder="Account number" />
            </FieldGroup>
            <FieldGroup label="IFSC Code" hint="Find on cheque book or bank website">
              <Input name="ifscCode" defaultValue={profile?.ifscCode || ''} placeholder="e.g., HDFC0001234" />
            </FieldGroup>
            <FieldGroup label="UPI ID" hint="For faster payouts via UPI (optional)">
              <div className="relative">
                <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input name="upiId" defaultValue={profile?.upiId || ''} placeholder="yourname@upi" className="pl-10" />
              </div>
            </FieldGroup>
          </div>
        </div>

        {/* ─── GST Details ─── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Fingerprint size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">GST Registration</h2>
              <p className="text-xs text-gray-400">Required for GST-inclusive invoices (optional)</p>
            </div>
          </div>
          <div className="max-w-md">
            <FieldGroup
              label="GSTIN (GST Identification Number)"
              hint="15-character GST number. Leave blank if not GST registered."
            >
              <div className="relative">
                <FileText size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  name="gstNumber"
                  defaultValue={profile?.gstNumber || ''}
                  placeholder="e.g., 33AAPFU0939F1ZV"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </FieldGroup>
          </div>
          {!profile?.gstNumber && (
            <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              💡 Without a GST number, you can still generate invoices — they will say <strong>"Not a GST Invoice"</strong>. 
              Adding your GSTIN enables fully compliant GST invoices.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary px-12 h-14 rounded-2xl shadow-xl shadow-orange-500/20 font-black tracking-widest uppercase flex items-center gap-3"
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
            {updateMutation.isPending ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}