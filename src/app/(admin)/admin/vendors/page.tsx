'use client';
// src/app/(admin)/admin/vendors/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { VendorStatus } from '@prisma/client';
import {
  Loader2, Store, ChevronDown, CheckCircle, Clock, Ban,
  Phone, MapPin, IndianRupee, Package, ShoppingCart, Star,
  Search, RotateCcw, AlertTriangle, Building2, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CreateVendorModal } from '@/components/admin/CreateVendorModal';

const TAB_ALL = 'ALL' as const;
type Tab = VendorStatus | typeof TAB_ALL;

const STATUS_CONFIG: Record<VendorStatus, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-700'  },
  APPROVED:  { label: 'Active',    bg: 'bg-emerald-100', text: 'text-emerald-700' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-red-100',     text: 'text-red-700'    },
};

function StatusBadge({ status }: { status: VendorStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {status === 'PENDING' && <Clock size={9} />}
      {status === 'APPROVED' && <CheckCircle size={9} />}
      {status === 'SUSPENDED' && <Ban size={9} />}
      {cfg.label}
    </span>
  );
}

export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<Tab>(TAB_ALL);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commissionInputs, setCommissionInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryInput = activeTab === TAB_ALL ? {} : { status: activeTab };
  const { data, isLoading, refetch } = trpc.admin.vendors.useQuery(queryInput);

  const updateStatus = trpc.admin.updateVendorStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Vendor ${vars.status === 'APPROVED' ? 'approved ✅' : vars.status === 'SUSPENDED' ? 'suspended ⛔' : 'updated'}`);
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const vendors = (data?.vendors ?? []).filter(v =>
    !search || v.shopName.toLowerCase().includes(search.toLowerCase()) ||
    v.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    ALL: data?.vendors.length ?? 0,
    PENDING: data?.vendors.filter(v => v.status === 'PENDING').length ?? 0,
    APPROVED: data?.vendors.filter(v => v.status === 'APPROVED').length ?? 0,
    SUSPENDED: data?.vendors.filter(v => v.status === 'SUSPENDED').length ?? 0,
  };

  const handleAction = (vendorId: string, status: VendorStatus) => {
    const rate = parseFloat(commissionInputs[vendorId] ?? '15') / 100;
    updateStatus.mutate({ vendorId, status, commissionRate: isNaN(rate) ? 0.15 : rate });
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Operations</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">Vendors</h1>
          <p className="text-gray-400 text-sm mt-0.5">{counts.ALL} total · {counts.PENDING} pending</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shop or email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 font-medium"
          />
        </div>

        {/* Add Vendor Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-gray-900/10 active:scale-95"
        >
          <Store size={14} />
          Add Vendor
        </button>
      </div>

      {/* Pending alert */}
      {counts.PENDING > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-4 rounded-2xl">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-sm">{counts.PENDING} application{counts.PENDING > 1 ? 's' : ''} need review</p>
            <p className="text-xs text-amber-600">Click Pending tab to see them</p>
          </div>
          <button onClick={() => setActiveTab('PENDING')} className="ml-auto text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors">
            Review →
          </button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'PENDING' && counts.PENDING > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">{counts.PENDING}</span>
            )}
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Vendor list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
      ) : vendors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <Store size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400">No vendors found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {vendors.map(vendor => {
            const isExpanded = expandedId === vendor.id;
            const commPct = commissionInputs[vendor.id] ?? String(Math.round(vendor.commissionRate * 100));
            return (
              <div key={vendor.id} className={`transition-colors ${isExpanded ? 'bg-gray-50/60' : ''}`}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-orange-500 font-black text-sm">
                    {vendor.shopName.charAt(0)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-900 text-sm">{vendor.shopName}</span>
                      <StatusBadge status={vendor.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{vendor.user.email} · {vendor.city}</p>
                  </div>
                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <p className="font-black text-gray-900 text-sm">{vendor._count.products}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">Products</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-gray-900 text-sm">{vendor._count.orders}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-orange-500 text-sm">₹{vendor.pendingPayout.toFixed(0)}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">Pending</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid md:grid-cols-3 gap-5 pt-1">
                      {/* Column 1: Shop Info */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shop Details</p>
                        <div className="space-y-2">
                          <Detail icon={<Store size={13} />} label="Category" value={vendor.category} />
                          <Detail icon={<MapPin size={13} />} label="City" value={vendor.city} />
                          <Detail icon={<Phone size={13} />} label="Phone" value={vendor.phone} />
                          <Detail icon={<Clock size={13} />} label="Joined" value={new Date(vendor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                        </div>
                      </div>

                      {/* Column 2: Financials */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Financials</p>
                        <div className="space-y-2">
                          <Detail icon={<IndianRupee size={13} />} label="Total Earnings" value={`₹${vendor.totalEarnings.toFixed(2)}`} highlight />
                          <Detail icon={<IndianRupee size={13} />} label="Pending Payout" value={`₹${vendor.pendingPayout.toFixed(2)}`} warn={vendor.pendingPayout > 0} />
                          <Detail icon={<Star size={13} />} label="Commission" value={`${(vendor.commissionRate * 100).toFixed(0)}%`} />
                          <Detail icon={<CreditCard size={13} />} label="Bank Acc." value={vendor.bankAccount ? `****${vendor.bankAccount.slice(-4)}` : '—'} />
                          {vendor.ifscCode && <Detail icon={<Building2 size={13} />} label="IFSC" value={vendor.ifscCode} />}
                        </div>
                      </div>

                      {/* Column 3: Actions */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</p>
                        {vendor.status === 'PENDING' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Commission Rate (%)</label>
                              <input
                                type="number"
                                min={0} max={50} step={1}
                                value={commPct}
                                onChange={e => setCommissionInputs(p => ({ ...p, [vendor.id]: e.target.value }))}
                                className="w-full px-3 py-2 text-sm font-black border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none transition-all"
                              />
                              <p className="text-[10px] text-gray-400 mt-1">Platform keeps {commPct}% of each order</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(vendor.id, 'APPROVED')}
                                disabled={updateStatus.isPending}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2.5 rounded-xl transition-all"
                              >
                                {updateStatus.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(vendor.id, 'SUSPENDED')}
                                disabled={updateStatus.isPending}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs px-3 py-2.5 rounded-xl transition-all"
                              >
                                <Ban size={13} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                        {vendor.status === 'APPROVED' && (
                          <button
                            onClick={() => handleAction(vendor.id, 'SUSPENDED')}
                            disabled={updateStatus.isPending}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs px-3 py-2.5 rounded-xl border border-red-200 transition-all"
                          >
                            <Ban size={13} /> Suspend Vendor
                          </button>
                        )}
                        {vendor.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleAction(vendor.id, 'APPROVED')}
                            disabled={updateStatus.isPending}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-xs px-3 py-2.5 rounded-xl border border-emerald-200 transition-all"
                          >
                            <RotateCcw size={13} /> Reinstate Vendor
                          </button>
                        )}

                        {/* Description preview */}
                        {vendor.description && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">About</p>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{vendor.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

      <CreateVendorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}

function Detail({ icon, label, value, highlight, warn }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300 flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className={`text-xs font-bold truncate ${highlight ? 'text-emerald-600' : warn ? 'text-amber-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}