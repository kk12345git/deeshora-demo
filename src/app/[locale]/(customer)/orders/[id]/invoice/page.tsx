// src/app/(customer)/orders/[id]/invoice/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2, Printer, ArrowLeft, CheckCircle, Clock,
  MapPin, Phone, Mail, Store, Package,
} from 'lucide-react';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: order, isLoading, error } = trpc.order.invoice.useQuery({ id });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 font-bold">Invoice not found or access denied.</p>
        <Link href="/orders" className="btn-primary">← Back to Orders</Link>
      </div>
    );
  }

  const invoiceNumber = `INV-${order.id.slice(-8).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isPaid = order.paymentStatus === 'PAID';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top bar (no-print) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href={`/orders/${id}`} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
          <ArrowLeft size={18} /> Back to Order
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* Invoice body */}
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
        <div id="invoice-content" ref={printRef} className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header band */}
          <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500" />

          <div className="p-8 space-y-8">
            {/* Brand + Invoice No */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {order.vendor.logo ? (
                    <Image src={order.vendor.logo} alt={order.vendor.shopName} fill className="object-cover" />
                  ) : (
                    <Store size={28} className="m-3 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-black text-xl text-gray-900">{order.vendor.shopName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">via Deeshora.com</p>
                  {order.vendor.address && <p className="text-xs text-gray-500 mt-0.5">{order.vendor.address}, {order.vendor.city}</p>}
                  {order.vendor.phone && <p className="text-xs text-gray-500">{order.vendor.phone}</p>}
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-gray-900">TAX INVOICE</p>
                <p className="text-sm font-bold text-orange-500 mt-1">{invoiceNumber}</p>
                <p className="text-xs text-gray-400 mt-1">Date: {invoiceDate}</p>
                {isPaid ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full mt-2">
                    <CheckCircle size={12} /> PAID
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full mt-2">
                    <Clock size={12} /> PAYMENT PENDING
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Billed To</p>
                <p className="font-black text-gray-900">{order.user.name}</p>
                {order.user.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1"><Phone size={11} /> {order.user.phone}</p>
                )}
                {order.user.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5"><Mail size={11} /> {order.user.email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Delivery Address</p>
                <p className="font-bold text-gray-800 text-sm">{order.address.label}</p>
                <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                  <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {order.address.line1}
                    {order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                    {order.address.city} — {order.address.pincode}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-xl">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-l-xl">Item</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Price</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800">{item.name}</p>
                            {item.mrp > item.price && (
                              <p className="text-xs text-gray-400 line-through">MRP ₹{item.mrp}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-medium">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600 font-medium">₹{item.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="font-bold">{order.deliveryFee === 0 ? '🎉 FREE' : `₹${order.deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Platform Fee</span>
                  <span className="font-bold">₹0.00</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-lg font-black text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-orange-600">₹{order.total.toFixed(2)}</span>
                </div>
                {isPaid && order.paymentId && (
                  <div className="text-xs text-gray-400 text-right">
                    Payment ID: <code className="font-mono">{order.paymentId}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            {order.timeline.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Order Timeline</p>
                <div className="space-y-2">
                  {order.timeline.map(event => (
                    <div key={event.id} className="flex items-center gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                      <span className="text-gray-400">{new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-600 font-medium">{event.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center space-y-1">
              <p className="text-xs font-black text-gray-500">Thank you for shopping with Deeshora!</p>
              <p className="text-xs text-gray-400">This is a computer-generated invoice and does not require a signature.</p>
              <p className="text-xs text-gray-400">Deeshora · Thiruvottriyur, Chennai · Support: support@deeshora.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
