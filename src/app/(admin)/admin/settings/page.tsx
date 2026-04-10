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


    updateConfigMutation.mutate({ key: 'delivery_fee', value: delivery_fee });
    updateConfigMutation.mutate({ key: 'free_delivery_above', value: free_delivery_above });
  };


  if (isLoading) return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;


  const deliveryFee = config?.find(c => c.key === 'delivery_fee')?.value || '40';
  const freeDeliveryAbove = config?.find(c => c.key === 'free_delivery_above')?.value || '299';


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