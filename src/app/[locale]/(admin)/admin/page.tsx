// src/app/(admin)/admin/page.tsx
import AdminDashboardLive from "@/components/admin/AdminDashboardLive";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/trpc-server";

export default async function AdminDashboardPage() {
  let stats;
  let activities;

  try {
    stats = await api.admin.stats();
    activities = await api.admin.activities({ limit: 5 });
  } catch (error: any) {
    console.error("[AdminDashboard] Failed to fetch stats:", error);

    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Access Denied</h2>
          <p className="text-gray-500 max-w-xs text-center font-medium">
            You don&apos;t have permission to access the Command Center. Please
            sign in as an administrator.
          </p>
          <Link href="/" className="btn-primary px-8 py-3 rounded-2xl">
            Return Home
          </Link>
        </div>
      );
    }

    throw error;
  }

  return (
    <AdminDashboardLive initialStats={stats} initialActivities={activities} />
  );
}
