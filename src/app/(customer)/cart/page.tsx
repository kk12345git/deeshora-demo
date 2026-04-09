// src/app/(customer)/cart/page.tsx
"use client";


import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';


export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { data: config } = trpc.admin.getConfig.useQuery(undefined, { staleTime: Infinity });
  
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(299);


  useEffect(() => {
    if (config) {
      const fee = config.find(c => c.key === 'delivery_fee')?.value;
      const threshold = config.find(c => c.key === 'free_delivery_above')?.value;
      if (fee) setDeliveryFee(parseFloat(fee));
      if (threshold) setFreeDeliveryThreshold(parseFloat(threshold));
    }
  }, [config]);


  const cartTotal = total();
  const isEligibleForFreeDelivery = cartTotal >= freeDeliveryThreshold;
  const finalDeliveryFee = isEligibleForFreeDelivery ? 0 : deliveryFee;
  const grandTotal = cartTotal + finalDeliveryFee;
  const amountForFreeDelivery = freeDeliveryThreshold - cartTotal;


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/" className="btn-primary mt-6">
          Continue Shopping
        </Link>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card flex-row p-4 gap-4 items-center">
              <Image src={item.image} alt={item.name} width={80} height={80} className="rounded-lg object-cover" />
              <div className="flex-grow">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">Price: ₹{item.price}</p>
              </div>
              <div className="flex items-center border rounded-xl">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-xl">
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-xl">
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-semibold w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700 p-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">Clear Cart</button>
        </div>


        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{isEligibleForFreeDelivery ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-green-600">- ₹0.00</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-xl font-extrabold">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            {!isEligibleForFreeDelivery && amountForFreeDelivery > 0 && (
              <div className="mt-4 text-center text-sm bg-green-50 text-green-700 p-3 rounded-lg">
                Add ₹{amountForFreeDelivery.toFixed(2)} more to get FREE delivery!
              </div>
            )}
            <div className="mt-6">
              <Link href="/checkout" className="btn-primary w-full text-center">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}