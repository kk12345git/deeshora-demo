// src/app/(admin)/admin/activity/page.tsx
export const dynamic = 'force-dynamic';
import { api } from "@/lib/trpc-server";
import { Clock, ShoppingCart, Store, User, ShieldAlert, CreditCard, Package, ArrowRight, Activity, Filter, RefreshCw, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function ActivityPage() {
  const activities = await api.admin.activities({});
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingCart size={18} />;
      case 'VENDOR': return <Store size={18} />;
      case 'USER': return <User size={18} />;
      case 'PRODUCT': return <Package size={18} />;
      case 'PAYMENT': return <CreditCard size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'APPROVAL': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'DELETE': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'STATUS_UPDATE': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'CREATE': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'PAYOUT': return 'bg-amber-100 text-amber-600 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-brand-100 text-brand-600 text-[9px] font-black uppercase tracking-widest rounded-md animate-pulse">Real-Time</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Audit</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Activity</h1>
          <p className="text-gray-500 text-sm font-medium">Watch and audit everything happening across the platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
           <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-gray-100">
             <Filter size={14} /> Filter Logs
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95">
             <RefreshCw size={14} /> Refresh
           </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />
        
        <div className="space-y-8 relative">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
               <Layers className="text-gray-300 mb-4" size={48} />
               <p className="text-gray-400 font-bold">No activity recorded yet.</p>
               <p className="text-gray-400 text-xs mt-1">Actions performed by users and admins will appear here.</p>
            </div>
          ) : (
            activities.map((log) => (
              <div key={log.id} className="flex gap-6 group">
                {/* Icon Column */}
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${
                    log.type === 'SYSTEM' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-100'
                  }`}>
                    {getIcon(log.type)}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group-hover:shadow-xl group-hover:shadow-gray-200/40 transition-all border-l-4 group-hover:border-l-brand-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getBadgeColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={12} /> {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-black tracking-tight mt-2 text-lg">
                        {log.message}
                      </h3>
                      {log.actorName && (
                        <p className="text-gray-500 text-sm font-medium flex items-center gap-2 mt-1">
                          Performed by <span className="text-brand-600 font-bold">{log.actorName}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="hidden md:block">
                       <Link 
                         href={log.type === 'ORDER' ? `/admin/orders` : log.type === 'VENDOR' ? '/admin/vendors' : '#'}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                       >
                         <ArrowRight size={18} />
                       </Link>
                    </div>
                  </div>

                  {/* Metadata Peek (if any) */}
                  {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                       <div className="flex flex-wrap gap-2">
                          {Object.entries(log.metadata as object).map(([k, v]) => (
                            <div key={k} className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">{k}:</span>
                               <span className="text-[10px] font-bold text-gray-600">{String(v)}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
