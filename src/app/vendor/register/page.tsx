// src/app/vendor/register/page.tsx
"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Loader2, Upload } from "lucide-react";
import Link from "next/link";


export default function VendorRegisterPage() {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(null);
  const registerMutation = trpc.vendor.register.useMutation({
    onSuccess: () => {
      toast.success("Registration successful! Your application is under review.");
      router.push("/vendor/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    registerMutation.mutate({
      shopName: formData.get('shopName') as string,
      description: formData.get('description') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      city: formData.get('city') as string,
      address: formData.get('address') as string,
      category: formData.get('category') as string,
      logo: logo || undefined,
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-orange-500 text-white font-bold text-xl w-8 h-8 flex items-center justify-center rounded-lg">D</div>
            <span className="text-2xl font-bold text-gray-800">deeshora</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Become a Vendor</h1>
          <p className="text-gray-600">Join our platform and reach more customers in your city.</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="flex items-center space-x-6">
            <label htmlFor="logo-upload" className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed hover:bg-gray-200">
                {logo ? (
                  <img src={logo} alt="logo preview" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Upload className="text-gray-400" />
                )}
              </div>
            </label>
            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <div>
              <h3 className="font-semibold">Shop Logo</h3>
              <p className="text-sm text-gray-500">Upload a clear logo for your shop (optional).</p>
            </div>
          </div>


          <div className="grid md:grid-cols-2 gap-6">
            <input name="shopName" placeholder="Shop Name" className="input" required />
            <input name="phone" placeholder="Contact Phone" className="input" required />
          </div>
          <input name="email" type="email" placeholder="Contact Email" className="input" required />
          <textarea name="description" placeholder="Shop Description" rows={3} className="input" required />
          <div className="grid md:grid-cols-3 gap-6">
            <input name="city" placeholder="City" className="input" required />
            <input name="address" placeholder="Full Address" className="input md:col-span-2" required />
          </div>
          <input name="category" placeholder="Shop Category (e.g., Groceries, Electronics)" className="input" required />


          <button type="submit" className="btn-primary w-full text-base" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}