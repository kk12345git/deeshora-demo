// src/app/(customer)/checkout/page.tsx
"use client";


import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Home, Plus, Loader2, Tag, X, CheckCircle } from 'lucide-react';


declare global {
  interface Window {
    Razorpay: any;
  }
}


export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const utils = trpc.useUtils();


  const { data: addresses, isLoading: isLoadingAddresses } = trpc.vendor.myAddresses.useQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | { id: string; code: string; discount: number; description: string }>(null);


  const addAddressMutation = trpc.vendor.addAddress.useMutation({
    onSuccess: () => {
      utils.vendor.myAddresses.invalidate();
      toast.success('Address added successfully!');
      setShowNewAddressForm(false);
    },
    onError: (error) => toast.error(error.message),
  });


  const createOrderMutation = trpc.order.createPaymentOrder.useMutation();
  const verifyPaymentMutation = trpc.order.verifyPayment.useMutation();
  const validateCoupon = trpc.coupon.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponCode('');
      toast.success(`Coupon applied! ${data.description}`);
    },
    onError: (err) => toast.error(err.message),
  });


  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);


  const handleAddNewAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addAddressMutation.mutate({
      label: formData.get('label') as string,
      line1: formData.get('line1') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      isDefault: formData.get('isDefault') === 'on',
    });
    e.currentTarget.reset();
  };


  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  const handlePayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address.');
      return;
    }
    setIsPlacingOrder(true);


    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setIsPlacingOrder(false);
      return;
    }


    try {
      const paymentOrder = await createOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        notes,
      });


      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: 'INR',
        name: 'Deeshora',
        description: 'Order Payment',
        order_id: paymentOrder.razorpayOrderId,
        handler: async function (response: any) {
          const verificationResult = await verifyPaymentMutation.mutateAsync({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderIds: paymentOrder.orderIds,
          });


          if (verificationResult.success) {
            toast.success('Payment successful! Your order is confirmed.');
            clearCart();
            router.push(`/orders/${verificationResult.orderIds[0]}?success=true`);
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          // You can prefill user details here
        },
        notes: {
          address: 'Deeshora Corporate Office',
        },
        theme: {
          color: '#f97316',
        },
      };


      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.');
        console.error(response.error);
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Address Selector */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Select Delivery Address</h2>
            {isLoadingAddresses ? (
              <p>Loading addresses...</p>
            ) : (
              <div className="space-y-4">
                {addresses?.map(address => (
                  <div key={address.id} onClick={() => setSelectedAddressId(address.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <Home className="w-5 h-5 mr-3 text-gray-600" />
                      <div>
                        <p className="font-semibold">{address.label} {address.isDefault && <span className="badge bg-gray-200 text-gray-700 ml-2">Default</span>}</p>
                        <p className="text-sm text-gray-500">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowNewAddressForm(!showNewAddressForm)} className="mt-4 flex items-center text-sm font-semibold text-orange-600 hover:underline">
              <Plus size={16} className="mr-1" /> {showNewAddressForm ? 'Cancel' : 'Add New Address'}
            </button>
            {showNewAddressForm && (
              <form onSubmit={handleAddNewAddress} className="mt-4 space-y-4 border-t pt-4">
                <input name="label" placeholder="Label (e.g., Home, Work)" className="input" required />
                <input name="line1" placeholder="Address Line 1" className="input" required />
                <div className="grid grid-cols-3 gap-4">
                  <input name="city" placeholder="City" className="input" required />
                  <input name="state" placeholder="State" className="input" required />
                  <input name="pincode" placeholder="Pincode" className="input" required />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="isDefault" id="isDefault" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">Set as default address</label>
                </div>
                <button type="submit" className="btn-primary" disabled={addAddressMutation.isPending}>
                  {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}
          </div>
          {/* Coupon Code */}
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag size={18} className="text-orange-500" /> Promo Code</h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="font-black text-emerald-700 font-mono tracking-widest text-sm">{appliedCoupon.code}</span>
                  <span className="text-xs text-emerald-600">— {appliedCoupon.description}</span>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="flex-1 px-4 py-3 bg-gray-50 font-mono font-bold tracking-widest text-sm rounded-xl border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all uppercase"
                  onKeyDown={e => { if (e.key === 'Enter' && couponCode) validateCoupon.mutate({ code: couponCode, cartTotal: total() }); }}
                />
                <button
                  onClick={() => couponCode && validateCoupon.mutate({ code: couponCode, cartTotal: total() })}
                  disabled={validateCoupon.isPending || !couponCode}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all flex items-center gap-1.5"
                >
                  {validateCoupon.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>
          {/* Delivery Notes */}
          <div className="card p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Delivery Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the delivery person?"
              className="input w-full"
              rows={3}
            />
          </div>
        </div>


        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-gray-600 truncate w-4/5">{item.name} x{item.quantity}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{total().toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span className="flex items-center gap-1"><Tag size={12} /> {appliedCoupon.code}</span>
                  <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t">
                <span className="text-lg font-bold">Total to Pay</span>
                <span className="text-xl font-extrabold">₹{Math.max(0, total() - (appliedCoupon?.discount ?? 0)).toFixed(2)}</span>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Official Bank Details</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-gray-800">BOB (Bank of Baroda)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No</span>
                  <span className="font-mono font-bold text-orange-600">24760200001534</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IFSC CODE</span>
                  <span className="font-mono font-bold text-gray-800">BARB0WIMNAG</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isPlacingOrder || items.length === 0}
              className="btn-primary w-full text-center mt-6 text-base"
            >
              {isPlacingOrder ? <Loader2 className="animate-spin mx-auto" /> : `Pay ₹${Math.max(0, total() - (appliedCoupon?.discount ?? 0)).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}