// src/app/(vendor)/vendor/invoices/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { FileText, Search, IndianRupee, Printer, ExternalLink, Loader2, Calendar, ShoppingBag, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getWhatsAppUrl, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';

export default function VendorInvoicesPage() {
  const [search, setSearch] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const { data, isLoading } = trpc.order.vendorOrdersList.useQuery({ limit: 50 });

  const filteredOrders = data?.orders.filter(order => 
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
            <FileText size={12} /> Compliance
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mt-1 uppercase">Tax Invoices</h1>
          <p className="text-sm text-gray-400 mt-1">Generate and print invoices for your paid sales</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          <p className="font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Records...</p>
        </div>
      ) : (filteredOrders?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <FileText size={40} />
          </div>
          <p className="text-xl font-black text-gray-800">No invoices found</p>
          <p className="text-gray-400 mt-2">Paid orders will appear here for invoice generation.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders?.map((order) => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });
            const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div key={order.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Ref</p>
                      <p className="font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase">#{order.id.slice(-8)}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                          <Calendar size={12} /> {date}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                          <ShoppingBag size={12} /> {itemCount} Items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Amount</p>
                      <p className="text-xl font-black text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="h-10 w-px bg-gray-100 hidden sm:block" />

                    <div className="flex items-center gap-2">
                       <Link 
                        href={`/vendor/invoices/${order.id}`}
                        className="flex items-center gap-2 bg-gray-950 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-gray-950/20 active:scale-95"
                      >
                        <Printer size={14} /> Print
                      </Link>

                      {order.user.phone && (
                        <a
                          href={getWhatsAppUrl(
                            order.user.phone, 
                            WHATSAPP_TEMPLATES.INVOICE_SHARE(
                              order.id, 
                              order.vendor?.shopName || 'Deeshora', 
                              `${baseUrl}/vendor/invoices/${order.id}`
                            )
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          <Send size={14} /> Share
                        </a>
                      )}

                      <Link 
                        href={`/vendor/orders/${order.id}`}
                        className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      >
                        <ExternalLink size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
