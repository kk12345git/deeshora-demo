'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { UserRole } from '@prisma/client';
import { 
  Loader2, Users, Search, Shield, 
  Store, User, Clock, ShoppingBag, 
  ChevronRight, ArrowUpRight 
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { CreateVendorModal } from '@/components/admin/CreateVendorModal';

const roleTabs: (UserRole | 'ALL')[] = ['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN', 'DELIVERY'];

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
  CUSTOMER: { label: 'Customer', bg: 'bg-blue-50', text: 'text-blue-700', icon: User },
  VENDOR:   { label: 'Vendor',   bg: 'bg-purple-50', text: 'text-purple-700', icon: Store },
  ADMIN:    { label: 'Admin',    bg: 'bg-gray-900', text: 'text-white', icon: Shield },
  DELIVERY: { label: 'Delivery', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Clock },
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">Directory</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Users & Roles</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Manage platform access and permissions</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="search" 
            placeholder="Search name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-sm transition-all shadow-sm" 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-[1.5rem] w-fit">
        {roleTabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin text-orange-500 w-12 h-12 mx-auto mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Accessing Records...</p>
          </div>
        ) : !data?.users.length ? (
          <div className="py-24 text-center">
            <Users size={48} className="text-gray-100 mx-auto mb-4" />
            <p className="font-black text-gray-400 uppercase tracking-widest text-xs">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Activity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map(user => {
                  const config = ROLE_CONFIG[user.role as UserRole] || ROLE_CONFIG.CUSTOMER;
                  const Icon = config.icon;
                  
                  return (
                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-gray-50 ring-offset-0">
                            <Image 
                              src={user.avatar || '/default-avatar.png'} 
                              alt={user.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">{user.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <RoleSelect userId={user.id} currentRole={user.role as UserRole} refetch={refetch} />
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bg} ${config.text}`}>
                            <Icon size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl">
                          <ShoppingBag size={12} />
                          <span className="text-[10px] font-black uppercase">{user._count.orders} Orders</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-800">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined Date</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {user.role !== 'VENDOR' && (
                          <button 
                            onClick={() => {
                              setSelectedForVendor({ id: user.id, name: user.name, email: user.email });
                              setVendorModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
                          >
                            Add as Vendor <ArrowUpRight size={12} />
                          </button>
                        )}
                        {user.role === 'VENDOR' && (
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                            Market Tier <ChevronRight size={12} />
                          </div>
                        )}
                      </td>
                    </tr>
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