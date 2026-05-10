'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { UserRole } from '@prisma/client';
import { 
  Loader2, Users, Search, Shield, 
  Store, User, Clock, ShoppingBag, 
  ChevronRight, ArrowUpRight, CheckCircle, Trash2
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreateVendorModal } from '@/components/admin/CreateVendorModal';

const roleTabs: (UserRole | 'ALL')[] = ['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN', 'DELIVERY_PARTNER'];

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
  CUSTOMER: { label: 'Customer', bg: 'bg-blue-50', text: 'text-blue-700', icon: User },
  VENDOR:   { label: 'Vendor',   bg: 'bg-purple-50', text: 'text-purple-700', icon: Store },
  ADMIN:    { label: 'Admin',    bg: 'bg-gray-900', text: 'text-white', icon: Shield },
  DELIVERY_PARTNER: { label: 'Delivery', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Clock },
};

const RoleSelect = ({ userId, currentRole, refetch }: { userId: string, currentRole: UserRole, refetch: () => void }) => {
  const [role, setRole] = useState(currentRole);
  const mutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setRole(currentRole);
    }
  });

  return (
    <select
      value={role}
      onChange={(e) => {
        const newRole = e.target.value as UserRole;
        setRole(newRole);
        mutation.mutate({ userId, role: newRole });
      }}
      disabled={mutation.isPending}
      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all outline-none cursor-pointer ${
        role === 'ADMIN' ? 'bg-gray-900 text-white border-gray-800' : 'bg-white border-gray-100 text-gray-900 focus:border-orange-500'
      }`}
    >
      {Object.keys(ROLE_CONFIG).map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
};

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedForVendor, setSelectedForVendor] = useState<{id: string, name: string, email: string} | null>(null);

  const queryInput = {
    role: activeTab === 'ALL' ? undefined : activeTab,
    search: search || undefined,
  };
  const { data, isLoading, refetch } = trpc.admin.users.useQuery(queryInput);

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('Account deleted permanently.');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform Directory</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Identity Management</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Supervising platform access for <span className="text-gray-900 font-bold">{data?.users.length || 0} active accounts</span>.</p>
        </div>
        
        <div className="relative w-full xl:w-96 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="search" 
            placeholder="Search by identity name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400 outline-none font-bold text-sm transition-all" 
          />
        </div>
      </div>

      {/* Global Filter Navigation */}
      <div className="flex items-center justify-between">
         <div className="flex flex-wrap gap-2 p-1.5 bg-white/50 backdrop-blur-md border border-gray-100 rounded-[1.75rem] shadow-sm">
           {roleTabs.map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                 activeTab === tab 
                 ? 'bg-gray-950 text-white shadow-xl shadow-gray-950/20 scale-[1.02]' 
                 : 'text-gray-400 hover:text-gray-900'
               }`}
             >
               {tab}
             </button>
           ))}
         </div>
         <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <Shield size={14} className="text-orange-500/50" />
            Access Protocol Alpha
         </div>
      </div>

      {/* Identity Catalog */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="relative">
                <Loader2 className="w-14 h-14 animate-spin text-orange-500" />
                <div className="absolute inset-0 blur-2xl bg-orange-500/20 animate-pulse" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Decrypting User Records...</p>
          </div>
        ) : !data?.users.length ? (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
               <Users size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Matches Found</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium"> Broaden your search criteria or invite new members to the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Access Credentials</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Operational Load</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity Timeline</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Terminal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map((user, i) => {
                  const config = ROLE_CONFIG[user.role as UserRole] || ROLE_CONFIG.CUSTOMER;
                  const Icon = config.icon;
                  
                  return (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-orange-50/20 transition-colors"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="relative w-14 h-14 rounded-[1.25rem] overflow-hidden shadow-inner border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                            <Image 
                              src={user.avatar || '/default-avatar.png'} 
                              alt={user.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-950 uppercase tracking-tight leading-none">{user.name}</p>
                            <p className="text-[11px] font-bold text-gray-400 mt-1.5 tracking-tight">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <RoleSelect userId={user.id} currentRole={user.role as UserRole} refetch={refetch} />
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.bg} ${config.text} border border-current opacity-70`}>
                            <Icon size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        {user.role === 'DELIVERY_PARTNER' ? (
                          <div className="flex items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full ${user.isDeliveryOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                                {user.isDeliveryOnline ? 'Online' : 'Offline'}
                             </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                      <td className="px-10 py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-900 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                          <ShoppingBag size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{user._count.orders} Activities</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Origin Verified</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {user.role !== 'VENDOR' ? (
                            <button 
                              onClick={() => {
                                setSelectedForVendor({ id: user.id, name: user.name, email: user.email });
                                setVendorModalOpen(true);
                              }}
                              className="inline-flex items-center gap-2 h-10 px-4 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            >
                              Upgrade <ArrowUpRight size={14} />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 h-10 px-4 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                              Partner <CheckCircle size={14} />
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this account? This cannot be undone.')) {
                                deleteUser.mutate({ userId: user.id });
                              }
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                          >
                            <Loader2 size={16} className={deleteUser.isPending ? 'animate-spin' : 'hidden'} />
                            <Trash2 size={16} className={deleteUser.isPending ? 'hidden' : ''} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateVendorModal 
        isOpen={vendorModalOpen}
        onClose={() => {
          setVendorModalOpen(false);
          setSelectedForVendor(null);
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
}