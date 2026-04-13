// src/app/(admin)/admin/settings/page.tsx
"use client";


import { trpc } from "@/lib/trpc";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";


export default function AdminSettingsPage() {
  const { data: config, isLoading, refetch } = trpc.admin.getConfig.useQuery();
  const updateConfigMutation = trpc.admin.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Settings updated!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const delivery_fee = formData.get('delivery_fee') as string;
    const free_delivery_above = formData.get('free_delivery_above') as string;
    const business_whatsapp = formData.get('business_whatsapp') as string;
    const delivery_partners = formData.get('delivery_partners') as string;


    updateConfigMutation.mutate({ key: 'delivery_fee', value: delivery_fee });
    updateConfigMutation.mutate({ key: 'free_delivery_above', value: free_delivery_above });
    updateConfigMutation.mutate({ key: 'business_whatsapp', value: business_whatsapp });
    updateConfigMutation.mutate({ key: 'delivery_partners', value: delivery_partners });
  };


  if (isLoading) return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;


  const deliveryFee = config?.find((c: any) => c.key === 'delivery_fee')?.value || '40';
  const freeDeliveryAbove = config?.find((c: any) => c.key === 'free_delivery_above')?.value || '299';
  const businessWhatsapp = config?.find((c: any) => c.key === 'business_whatsapp')?.value || '8939318865';
  const deliveryPartners = config?.find((c: any) => c.key === 'delivery_partners')?.value || '';


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <form onSubmit={handleSubmit} className="card p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700">Base Delivery Fee (₹)</label>
            <input type="number" name="delivery_fee" id="delivery_fee" defaultValue={deliveryFee} className="input mt-1" />
          </div>
          <div>
            <label htmlFor="free_delivery_above" className="block text-sm font-medium text-gray-700">Free Delivery Threshold (₹)</label>
            <input type="number" name="free_delivery_above" id="free_delivery_above" defaultValue={freeDeliveryAbove} className="input mt-1" />
          </div>
          <div className="pt-4 border-t">
            <h3 className="text-md font-semibold mb-3">WhatsApp Automation</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="business_whatsapp" className="block text-sm font-medium text-gray-700">Deeshora Business WhatsApp (with 91 prefix)</label>
                <input type="text" name="business_whatsapp" id="business_whatsapp" defaultValue={businessWhatsapp} className="input mt-1" placeholder="918939318865" />
              </div>
              <div>
                <label htmlFor="delivery_partners" className="block text-sm font-medium text-gray-700">Delivery Partner Numbers (comma separated)</label>
                <textarea name="delivery_partners" id="delivery_partners" defaultValue={deliveryPartners} className="input mt-1" placeholder="919876543210, 911234567890" rows={2} />
                <p className="text-xs text-gray-500 mt-1">Used for forwarding order details after location confirmation.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn-primary" disabled={updateConfigMutation.isPending}>
            {updateConfigMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}