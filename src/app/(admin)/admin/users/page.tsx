// src/app/(admin)/admin/users/page.tsx
"use client";


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { UserRole } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";


const roleTabs: (UserRole | 'ALL')[] = ['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN', 'DELIVERY'];


const RoleSelect = ({ userId, currentRole, refetch }: { userId: string, currentRole: UserRole, refetch: () => void }) => {
  const [role, setRole] = useState(currentRole);
  const mutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated successfully');
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to update role: ${err.message}`);
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
      className={`px-2 py-1 rounded-md text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-orange-500 ${mutation.isPending ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: role === 'CUSTOMER' ? '#dbeafe' : role === 'VENDOR' ? '#f3e8ff' : role === 'ADMIN' ? '#1f2937' : '#dcfce7',
        color: role === 'ADMIN' ? 'white' : role === 'CUSTOMER' ? '#1e40af' : role === 'VENDOR' ? '#6b21a8' : '#166534',
        borderColor: role === 'ADMIN' ? '#111827' : 'transparent'
      }}
    >
      <option value="CUSTOMER">CUSTOMER</option>
      <option value="VENDOR">VENDOR</option>
      <option value="ADMIN">ADMIN</option>
      <option value="DELIVERY">DELIVERY</option>
    </select>
  );
};


export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');


  const queryInput = {
    role: activeTab === 'ALL' ? undefined : activeTab,
    search: search || undefined,
  };
  const { data, isLoading, refetch } = trpc.admin.users.useQuery(queryInput);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <div className="card">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex space-x-2">
            {roleTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>
          <input type="search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="input w-64" />
        </div>
        {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Orders</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.users.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Image src={user.avatar || '/default-avatar.png'} alt={user.name} width={32} height={32} className="rounded-full" />
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3"><RoleSelect userId={user.id} currentRole={user.role} refetch={refetch} /></td>
                  <td className="px-4 py-3">{user._count.orders}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}