// src/app/(admin)/admin/payouts/page.tsx
"use client";


import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";


export default function AdminPayoutsPage() {
  const { data: vendorsWithPayouts, refetch: refetchVendors } = trpc.admin.vendors.useQuery({});
  const { data: payoutHistory, refetch: refetchHistory } = trpc.admin.payouts.useQuery({});
  const processPayoutMutation = trpc.admin.processPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout processed successfully!");
      refetchVendors();
      refetchHistory();
    },
    onError: (err) => toast.error(err.message),
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    processPayoutMutation.mutate({
      vendorId: formData.get('vendorId') as string,
      amount: parseFloat(formData.get('amount') as string),
      utrNumber: formData.get('utrNumber') as string,
    });
    e.currentTarget.reset();
  };


  const pendingPayoutVendors = vendorsWithPayouts?.vendors.filter(v => v.pendingPayout > 0);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Process Payouts</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold">Vendors with Pending Payouts</h2>
          {pendingPayoutVendors?.map(vendor => (
            <div key={vendor.id} className="card p-4 bg-green-50">
              <p className="font-bold">{vendor.shopName}</p>
              <p className="text-lg text-green-700 font-mono">₹{vendor.pendingPayout.toFixed(2)}</p>
            </div>
          ))}
          {pendingPayoutVendors?.length === 0 && <p className="text-sm text-gray-500">No pending payouts.</p>}
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold">New Payout</h2>
            <div>
              <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700">Vendor</label>
              <select name="vendorId" id="vendorId" className="input mt-1" required>
                <option value="">Select Vendor</option>
                {pendingPayoutVendors?.map(v => <option key={v.id} value={v.id}>{v.shopName}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input type="number" step="0.01" name="amount" id="amount" className="input mt-1" required />
            </div>
            <div>
              <label htmlFor="utrNumber" className="block text-sm font-medium text-gray-700">UTR / Transaction ID</label>
              <input type="text" name="utrNumber" id="utrNumber" className="input mt-1" required />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={processPayoutMutation.isPending}>
                {processPayoutMutation.isPending ? <Loader2 className="animate-spin" /> : 'Process Payout'}
              </button>
            </div>
          </form>
        </div>
      </div>


      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Payout History</h2>
        <div className="card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">UTR</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payoutHistory?.payouts.map(payout => (
                <tr key={payout.id}>
                  <td className="px-4 py-3">{new Date(payout.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{payout.vendor.shopName}</td>
                  <td className="px-4 py-3 font-semibold">₹{payout.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{payout.utrNumber}</td>
                  <td className="px-4 py-3"><span className="badge bg-green-100 text-green-800">{payout.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}