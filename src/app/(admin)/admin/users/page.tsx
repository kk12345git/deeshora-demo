// src/app/(admin)/admin/users/page.tsx
"use client";


import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { UserRole } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";


const roleTabs: (UserRole | 'ALL')[] = ['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN', 'DELIVERY'];


const RoleBadge = ({ role }: { role: UserRole }) => {
  const colors = {
    CUSTOMER: 'bg-blue-100 text-blue-800',
    VENDOR: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-gray-800 text-white',
    DELIVERY: 'bg-green-100 text-green-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[role]}`}>{role}</span>;
};


export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');


  const queryInput = {
    role: activeTab === 'ALL' ? undefined : activeTab,
    search: search || undefined,
  };
  const { data, isLoading } = trpc.admin.users.useQuery(queryInput);


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
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
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