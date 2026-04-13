// src/app/(vendor)/vendor/invoices/[id]/page.tsx
'use client';

import { trpc } from '@/lib/trpc';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Printer, ChevronLeft, Download, Building2, User, Landmark, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function VendorInvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading } = trpc.order.vendorOrderById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="font-black text-gray-400 uppercase tracking-widest">Preparing Document...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="font-bold text-gray-800">Invoice not found.</p>
        <button onClick={() => router.back()} className="text-orange-500 font-bold mt-4">← Go Back</button>
      </div>
    );
  }

  const { vendor, user, address, items } = order;
  const subtotal = order.subtotal;
  const totalGst = items.reduce((acc, item) => acc + (item.gstAmount ?? 0), 0);
  const deliveryFee = order.deliveryFee;
  const grandTotal = order.total;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-gray-900 text-white p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Order Invoice</p>
            <p className="font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white p-8 md:p-16 rounded-3xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0" id="invoice-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-16">
          <div className="space-y-4">
            {vendor.logo ? (
              <div className="relative w-24 h-24 mb-4">
                <Image src={vendor.logo} alt={vendor.shopName} fill className="object-contain rounded-xl" />
              </div>
            ) : (
                <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-3xl mb-4">
                    {vendor.shopName.charAt(0)}
                </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tighter leading-none mb-1">{vendor.shopName}</h1>
              <p className="text-sm font-bold text-gray-500">{vendor.city}, Tamil Nadu</p>
            </div>
            
            <div className="space-y-1 pt-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Contact</p>
              <p className="text-sm font-black text-gray-800">{vendor.phone}</p>
              <p className="text-sm font-bold text-gray-600">{vendor.email}</p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-4">
            <div className="inline-block px-4 py-2 bg-gray-950 text-white font-black text-xs uppercase tracking-[0.2em] rounded-lg">
              {vendor.gstNumber ? 'Tax Invoice' : 'Commercial Invoice'}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Invoice Details</p>
              <p className="text-lg font-black text-gray-900">INV-{order.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm font-bold text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {vendor.gstNumber && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center md:justify-end gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" /> GSTIN
                </p>
                <p className="text-sm font-black text-gray-800 uppercase">{vendor.gstNumber}</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-12" />

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-orange-500" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Location</h3>
            </div>
            <p className="text-sm font-black text-gray-800 leading-relaxed whitespace-pre-wrap">
              {vendor.address}
            </p>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-orange-500" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Details</h3>
            </div>
            <p className="text-sm font-black text-gray-800">{user.name}</p>
            {address && (
              <p className="text-sm font-bold text-gray-500 leading-relaxed mt-1">
                {address.line1}, {address.line2 && <>{address.line2},</>}<br />
                {address.city}, {address.state} - {address.pincode}<br />
                Phone: {user.phone}
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="mb-12 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Qty</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Unit Price</th>
                {vendor.gstNumber && <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">GST %</th>}
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-6 pr-4">
                    <p className="text-sm font-black text-gray-900">{item.name}</p>
                    {item.gstRate > 0 && vendor.gstNumber && (
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">HSN CODE: 000000</p>
                    )}
                  </td>
                  <td className="py-6 text-center text-sm font-black text-gray-800">{item.quantity}</td>
                  <td className="py-6 text-right text-sm font-black text-gray-800">₹{item.price.toLocaleString('en-IN')}</td>
                  {vendor.gstNumber && (
                    <td className="py-6 text-right text-sm font-bold text-gray-500">{(item.gstRate * 100).toFixed(0)}%</td>
                  )}
                  <td className="py-6 text-right text-sm font-black text-gray-900">₹{item.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex flex-col md:flex-row justify-between gap-12">
            {/* Payout Info (For vendor's records) */}
            <div className="max-w-xs space-y-4">
               <div className="flex items-center gap-2">
                <Landmark size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payout Account</h4>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-black text-gray-900">{vendor.bankName || 'Not Provided'}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">{vendor.bankAccount || '•••• •••• ••••'}</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase mt-2">Payout: ₹{order.vendorAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">Subtotal</span>
                    <span className="font-black text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {vendor.gstNumber && (
                   <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500">Total GST</span>
                        <span className="font-black text-gray-900">₹{totalGst.toLocaleString('en-IN')}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">Delivery Fee</span>
                    <span className="font-black text-emerald-600">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="h-px bg-gray-950 my-2" />
                <div className="flex justify-between items-center">
                    <span className="font-black text-gray-950 uppercase tracking-widest text-xs">Grand Total</span>
                    <span className="text-2xl font-black text-gray-950 tracking-tighter">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm font-black text-gray-900 mb-1">Thank you for shopping with {vendor.shopName}!</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This is a computer generated invoice and does not require a physical signature.</p>
          <div className="mt-8 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-[10px] text-white font-black">D</div>
                <span className="text-xs font-black text-gray-900 uppercase">Deeshora Platform</span>
             </div>
             <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Secure Marketplace</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .print-m-0 { margin: 0 !important; }
          #invoice-content { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
