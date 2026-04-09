// src/app/(admin)/admin/vendors/page.tsx
"use client";


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { VendorStatus } from "@prisma/client";
import { ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";


const statusTabs: (VendorStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'];


const StatusBadge = ({ status }: { status: VendorStatus }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-red-100 text-red-800',
  };
  return <span className={`badge ${colors[status]}`}>{status}</span>;
};


export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<VendorStatus | 'ALL'>('ALL');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(0.15);


  const queryInput = activeTab === 'ALL' ? {} : { status: activeTab };
  const { data, isLoading, refetch } = trpc.admin.vendors.useQuery(queryInput);
  const updateStatusMutation = trpc.admin.updateVendorStatus.useMutation({
    onSuccess: () => {
      toast.success("Vendor status updated!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });


  const handleUpdateStatus = (vendorId: string, status: VendorStatus) => {
    updateStatusMutation.mutate({ vendorId, status, commissionRate });
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Vendors</h1>
      <div className="card">
        <div className="border-b">
          <div className="flex space-x-4 px-4 -mb-px">
            {statusTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
          <div className="divide-y">
            {data?.vendors.map(vendor => (
              <div key={vendor.id}>
                <div onClick={() => setExpandedVendorId(expandedVendorId === vendor.id ? null : vendor.id)} className="grid grid-cols-6 gap-4 p-4 items-center cursor-pointer hover:bg-gray-50">
                  <div className="font-semibold">{vendor.shopName}</div>
                  <div className="text-sm text-gray-600">{vendor.user.email}</div>
                  <div className="text-sm text-gray-600">{vendor.city}</div>
                  <div className="text-sm text-gray-600">{vendor._count.products} products</div>
                  <div className="text-sm text-gray-600">{vendor._count.orders} orders</div>
                  <div className="flex justify-between items-center">
                    <StatusBadge status={vendor.status} />
                    <ChevronDown size={18} className={`transition-transform ${expandedVendorId === vendor.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expandedVendorId === vendor.id && (
                  <div className="p-4 bg-gray-50 border-t grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Details</h4>
                      <p className="text-xs">Joined: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs">Commission: {vendor.commissionRate * 100}%</p>
                      <p className="text-xs">Pending Payout: ₹{vendor.pendingPayout.toFixed(2)}</p>
                      <p className="text-xs">Total Earnings: ₹{vendor.totalEarnings.toFixed(2)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-sm mb-1">Actions</h4>
                      <div className="flex items-center gap-2">
                        {vendor.status === 'PENDING' && (
                          <>
                            <input type="number" step="0.01" min="0" max="1" defaultValue={commissionRate} onChange={e => setCommissionRate(parseFloat(e.target.value))} className="input w-24 text-sm py-1" />
                            <button onClick={() => handleUpdateStatus(vendor.id, 'APPROVED')} className="btn-primary bg-green-600 hover:bg-green-700 text-xs px-3 py-1.5">Approve</button>
                            <button onClick={() => handleUpdateStatus(vendor.id, 'SUSPENDED')} className="btn-secondary bg-red-500 text-white hover:bg-red-600 text-xs px-3 py-1.5">Reject</button>
                          </>
                        )}
                        {vendor.status === 'APPROVED' && <button onClick={() => handleUpdateStatus(vendor.id, 'SUSPENDED')} className="btn-secondary bg-red-500 text-white hover:bg-red-600 text-xs px-3 py-1.5">Suspend</button>}
                        {vendor.status === 'SUSPENDED' && <button onClick={() => handleUpdateStatus(vendor.id, 'APPROVED')} className="btn-primary bg-green-600 hover:bg-green-700 text-xs px-3 py-1.5">Reinstate</button>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}