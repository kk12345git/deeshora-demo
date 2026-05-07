'use client';
// src/app/(admin)/admin/vendors/page.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { VendorStatus } from '@prisma/client';
import {
  Loader2, Store, ChevronDown, CheckCircle, Clock, Ban,
  Phone, MapPin, IndianRupee, Package, ShoppingCart, Star,
  Search, RotateCcw, AlertTriangle, Building2, CreditCard, MessageCircle,
} from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreateVendorModal } from '@/components/admin/CreateVendorModal';
import { EditVendorModal } from '@/components/admin/EditVendorModal';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner Management</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketplace Vendors</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Managing <span className="text-gray-900 font-bold">{counts.ALL} active partners</span> across all service categories.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by shop, email or city..."
              className="w-full pl-11 pr-5 py-3.5 text-sm bg-white border border-gray-200 rounded-[1.25rem] focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 font-bold transition-all shadow-sm"
            />
          </div>

          {/* Add Vendor Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-950 text-white px-7 py-3.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-gray-950/10 active:scale-95 group"
          >
            <Store size={16} className="group-hover:rotate-12 transition-transform" />
            Add New Partner
          </button>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Onboarded</p>
            <p className="text-2xl font-black text-gray-900">{counts.ALL}</p>
         </div>
         <div className={`p-5 rounded-3xl border shadow-sm transition-all ${counts.PENDING > 0 ? 'bg-amber-50 border-amber-100 shadow-amber-500/5' : 'bg-white border-gray-100'}`}>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Awaiting Review</p>
            <div className="flex items-center gap-2">
               <p className={`text-2xl font-black ${counts.PENDING > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{counts.PENDING}</p>
               {counts.PENDING > 0 && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-md animate-pulse">Action Required</span>}
            </div>
         </div>
         <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Shops</p>
            <p className="text-2xl font-black text-emerald-600">{counts.APPROVED}</p>
         </div>
         <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Suspended</p>
            <p className="text-2xl font-black text-red-500">{counts.SUSPENDED}</p>
         </div>
      </div>

      {/* Filter & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm w-fit overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-gray-950 text-white shadow-lg shadow-gray-950/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'PENDING' && counts.PENDING > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-white rounded-md text-[9px] flex items-center justify-center font-black">{counts.PENDING}</span>
              )}
              {tab === 'ALL' ? 'Everything' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
             <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
             <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-gray-400 animate-pulse">Syncing partner records...</p>
        </div>
      ) : vendors.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store size={40} className="text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900">No Partners Found</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Try adjusting your search filters or add a new vendor to the platform.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vendors.map((vendor, i) => {
            const isExpanded = expandedId === vendor.id;
            const commPct = commissionInputs[vendor.id] ?? String(Math.round(vendor.commissionRate * 100));
            return (
              <motion.div 
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-orange-200 ring-4 ring-orange-500/5 shadow-2xl shadow-orange-500/10' : 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200'
                }`}
              >
                {/* Primary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                  className="w-full flex items-center gap-6 px-6 py-5 text-left transition-colors relative overflow-hidden"
                >
                  {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}
                  
                  {/* Avatar / Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-gray-800 font-black text-xl border border-gray-200 group-hover:scale-105 transition-transform">
                      {vendor.shopName.charAt(0)}
                    </div>
                    {vendor.status === 'APPROVED' && (
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                          <CheckCircle size={10} className="text-white" />
                       </div>
                    )}
                  </div>

                  {/* Partner Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-gray-900 text-lg tracking-tight truncate">{vendor.shopName}</span>
                      <StatusBadge status={vendor.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-orange-500/60" /> {vendor.city}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="truncate">{vendor.user.email}</span>
                    </div>
                  </div>

                  {/* Dynamic Indicators */}
                  <div className="hidden lg:flex items-center gap-8 px-8 border-x border-gray-50">
                    <div className="text-center">
                      <p className="font-black text-gray-900 text-base">{vendor._count.products}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Listing</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-gray-900 text-base">{vendor._count.orders}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Volume</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-black text-orange-600 text-base">₹{vendor.pendingPayout.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending Payout</p>
                    </div>
                  </div>

                  {/* Interaction */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-50 text-gray-300 group-hover:text-gray-600 group-hover:bg-gray-100'}`}>
                    <ChevronDown size={20} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid md:grid-cols-3 gap-5 pt-1">
                      {/* Column 1: Shop Info */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shop Details</p>
                        <div className="space-y-2">
                          <Detail icon={<Store size={13} />} label="Categories" value={vendor.categories.join(', ')} />
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
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Commission Rate (%)</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={0} max={50} step={1}
                                  value={commPct}
                                  onChange={e => setCommissionInputs(p => ({ ...p, [vendor.id]: e.target.value }))}
                                  className="flex-1 px-3 py-2 text-sm font-black border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none transition-all"
                                />
                                <button
                                  onClick={() => handleAction(vendor.id, 'APPROVED')}
                                  disabled={updateStatus.isPending}
                                  className="px-4 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  setEditingVendor(vendor);
                                  setIsEditModalOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs px-3 py-2.5 rounded-xl border border-indigo-200 transition-all"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() => handleAction(vendor.id, 'SUSPENDED')}
                                disabled={updateStatus.isPending}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs px-3 py-2.5 rounded-xl border border-red-200 transition-all"
                              >
                                <Ban size={13} /> Suspend Vendor
                              </button>
                              <a
                                href={getWhatsAppUrl(vendor.phone, `Hi ${vendor.shopName}! 🌟\n\nThis is Deeshora Admin. We wanted to reach out regarding your store...`)}
                                target="_blank"
                                className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-xs px-3 py-2.5 rounded-xl border border-emerald-200 transition-all"
                              >
                                <MessageCircle size={13} fill="currentColor" /> Message on WhatsApp
                              </a>
                            </div>
                          </div>
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
              </motion.div>
            );
          })}
        </div>
      )}
      <CreateVendorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditVendorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vendor={editingVendor}
        onSuccess={() => refetch()}
      />
    </div>
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