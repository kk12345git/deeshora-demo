// src/app/vendor/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { 
  Loader2, Upload, Store, MapPin, CreditCard, 
  Building2, Fingerprint, Smartphone, FileText, 
  CheckCircle, ArrowRight, Sparkles, X, Camera 
} from "lucide-react";
import Link from "next/link";
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) {
  const Component = props.type === 'textarea' ? 'textarea' : 'input';
  return (
    // @ts-ignore
    <Component
      {...props}
      className={`w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all ${props.className || ""}`}
    />
  );
}

export default function VendorRegisterPage() {
  const router = useRouter();
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  const registerMutation = trpc.vendor.register.useMutation({
    onSuccess: () => {
      toast.success("Identity Created! 🎉 Welcome to the partner network.");
      router.push("/vendor/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo too large! Please keep it under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    registerMutation.mutate({
      shopName: data.shopName as string,
      description: data.description as string,
      phone: data.phone as string,
      email: data.email as string,
      city: data.city as string,
      address: data.address as string,
      category: data.category as string,
      logo: logoBase64 || undefined,
      bankAccount: data.bankAccount as string,
      bankAccountName: data.bankAccountName as string,
      bankName: data.bankName as string,
      ifscCode: data.ifscCode as string,
      upiId: data.upiId as string,
      gstNumber: data.gstNumber as string,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-orange-500 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-2xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">D</div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">deeshora</span>
          </Link>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                <Sparkles size={12} /> Partner Ecosystem
             </span>
             <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Become a Partner</h1>
             <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">Join the fastest growing local delivery network in Chennai and reach thousands of neighbors.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Branding Lab */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                   <Store size={24} />
                </div>
                <div>
                   <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Step 1: Branding Lab</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Your shop's digital identity</p>
                </div>
             </div>

             <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="space-y-4">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Shop Logo</label>
                      <div className="relative w-32 h-32 bg-gray-50 rounded-full border-2 border-dashed border-gray-200 overflow-hidden group">
                         {logoBase64 ? (
                            <>
                               <img src={logoBase64} alt="Preview" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <label className="cursor-pointer bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:scale-110 transition-transform">
                                     <Camera size={20} />
                                     <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                  </label>
                               </div>
                            </>
                         ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-colors">
                               <Upload size={24} className="text-gray-300 mb-1" />
                               <p className="text-[8px] font-black text-gray-400 uppercase">Upload</p>
                               <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                         )}
                      </div>
                   </div>

                   <div className="flex-1 space-y-6 w-full">
                      <div className="grid md:grid-cols-2 gap-6">
                         <FieldGroup label="Shop Name">
                            <Input name="shopName" placeholder="e.g. Thiruvottriyur Fresh" required />
                         </FieldGroup>
                         <FieldGroup label="Business Category">
                            <select name="category" required className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all appearance-none cursor-pointer">
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
                      <FieldGroup label="Shop Bio (Search Friendly)" hint="Describe what makes your shop special for your neighbors.">
                         <textarea name="description" rows={3} placeholder="Fresh local produce delivered in 10 minutes..." className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-400 outline-none font-bold transition-all resize-none" required />
                      </FieldGroup>
                   </div>
                </div>
             </div>
          </div>

          {/* Section 2: Distribution Hub */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                   <MapPin size={24} />
                </div>
                <div>
                   <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Step 2: Distribution Hub</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Connecting you to customers</p>
                </div>
             </div>

             <div className="p-8 grid md:grid-cols-2 gap-8">
                <FieldGroup label="Contact Phone">
                   <div className="relative">
                      <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input name="phone" className="pl-12" placeholder="10-digit mobile number" required />
                   </div>
                </FieldGroup>
                <FieldGroup label="Official Email">
                   <div className="relative">
                      <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input name="email" type="email" className="pl-12" placeholder="business@email.com" required />
                   </div>
                </FieldGroup>
                <FieldGroup label="Operating City">
                   <Input name="city" placeholder="e.g. Thiruvottriyur" required />
                </FieldGroup>
                <FieldGroup label="Physical Address">
                   <Input name="address" placeholder="Full store address" required />
                </FieldGroup>
             </div>
          </div>

          {/* Section 3: Payout Identity */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                   <CreditCard size={24} />
                </div>
                <div>
                   <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Step 3: Payout Wallet</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Get paid directly and fast</p>
                </div>
             </div>

             <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <FieldGroup label="Bank Name">
                      <Input name="bankName" placeholder="e.g. HDFC Bank" required />
                   </FieldGroup>
                   <FieldGroup label="Account Holder Name">
                      <Input name="bankAccountName" placeholder="Name as per Passbook" required />
                   </FieldGroup>
                   <FieldGroup label="Account Number">
                      <Input name="bankAccount" placeholder="Your Bank Account Number" required />
                   </FieldGroup>
                   <FieldGroup label="IFSC Code">
                      <Input name="ifscCode" placeholder="HBIN0001234" required />
                   </FieldGroup>
                </div>

                <div className="pt-6 border-t border-gray-50 grid md:grid-cols-2 gap-8">
                   <FieldGroup label="UPI ID (Highly Recommended)" hint="For instant settlements and quick payouts.">
                      <div className="relative">
                         <Zap size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                         <Input name="upiId" className="pl-12 border-orange-100 focus:border-orange-500" placeholder="yourname@okaxis" />
                      </div>
                   </FieldGroup>
                   <FieldGroup label="GSTIN (Optional)" hint="Leave blank if not registered for GST.">
                      <Input name="gstNumber" placeholder="15-character GSTIN" />
                   </FieldGroup>
                </div>
             </div>
          </div>

          {/* Final Action */}
          <div className="flex flex-col items-center gap-6 pt-4 pb-12">
             <div className="flex items-start gap-3 max-w-lg text-center">
                <div className="mt-1">
                   <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <p className="text-xs text-gray-400 font-bold leading-relaxed">By submitting, you agree to the Deeshora Partner Terms and authorize our team to review your application for safety and quality.</p>
             </div>

             <button 
                type="submit" 
                disabled={registerMutation.isPending}
                className="w-full max-w-sm h-16 bg-orange-500 text-white rounded-[2rem] shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
             >
                {registerMutation.isPending ? (
                   <Loader2 className="animate-spin" />
                ) : (
                   <>
                      Submit Application <ArrowRight size={20} />
                   </>
                )}
             </button>
             
             <Link href="/" className="text-xs font-black text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">
                Cancel Application
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Support components not in icons but used
const Zap = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);