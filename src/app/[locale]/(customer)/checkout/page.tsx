// src/app/(customer)/checkout/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import { trpc } from "@/lib/trpc";
import { useRouter, Link } from "@/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Home,
  Plus,
  Loader2,
  Tag,
  X,
  CheckCircle,
  ShieldCheck,
  Banknote,
  ChevronRight,
  Check,
  ArrowRight,
  CreditCard,
  Star,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";

type PaymentStep = "SELECT" | "DONE";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: addresses, isLoading: isLoadingAddresses } =
    trpc.user.myAddresses.useQuery();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("SELECT");
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "MANUAL_UPI" | "WALLET"
  >("WALLET");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    id: string;
    code: string;
    discount: number;
    description: string;
  }>(null);
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: walletBalance = 0 } = trpc.wallet.getBalance.useQuery();
  const { data: slots, isLoading: isLoadingSlots } =
    trpc.deliverySlot.list.useQuery();

  const addAddressMutation = trpc.user.addAddress.useMutation({
    onSuccess: () => {
      utils.user.myAddresses.invalidate();
      toast.success("Address added!");
      setShowNewAddressForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const placeOrderMutation = trpc.order.placeOrder.useMutation();
  const syncCartMutation = trpc.cart.sync.useMutation();

  const validateCoupon = trpc.coupon.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponCode("");
      toast.success(`Coupon applied! ${data.description}`);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const netTotal = Math.max(0, total() - (appliedCoupon?.discount ?? 0));

  // ─── Address Form ─────────────────────────────────────────────────────────
  const handleAddNewAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addAddressMutation.mutate({
      label: fd.get("label") as string,
      line1: fd.get("line1") as string,
      city: fd.get("city") as string,
      state: fd.get("state") as string,
      pincode: fd.get("pincode") as string,
      isDefault: fd.get("isDefault") === "on",
    });
    e.currentTarget.reset();
  };

  // ─── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Always sync local cart → server before placing order
      await syncCartMutation.mutateAsync(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );

      const result = await placeOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        notes,
        paymentMethod,
        deliverySlotId: selectedSlotId || undefined,
      });

      if (paymentMethod === "MANUAL_UPI") {
        clearCart();
        toast.success("Order placed! Proceeding to payment...");
        router.push(`/orders/${result.orderIds[0]}/payment`);
      } else {
        clearCart();
        setPlacedOrderIds(result.orderIds);
        toast.success("🎉 Order placed! Pay on delivery.");
        router.push(`/orders/${result.orderIds[0]}?success=true`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Done Screen ──────────────────────────────────────────────────────────
  if (paymentStep === "DONE") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-sm mx-auto">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
            <CheckCircle size={48} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Payment Done!
            </h1>
            <p className="text-white/50 font-medium leading-relaxed">
              Your order is confirmed and the vendor has been notified. Get
              ready for fast delivery!
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                router.push(`/orders/${placedOrderIds[0]}?success=true`)
              }
              className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
            >
              Track My Order <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 border border-white/10 text-white/50 font-bold rounded-2xl hover:border-white/20 transition-all text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Checkout Screen ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Page Heading */}
        <div className="flex flex-col gap-1 mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-none italic uppercase">
            Review Order
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            Finalize your essentials delivery
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Selector */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 italic uppercase">
                  <Home size={18} className="text-brand-500" /> Delivery Address
                </h2>
                <button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-all border border-gray-100"
                >
                  <Plus
                    size={18}
                    className={`transition-transform duration-300 ${showNewAddressForm ? "rotate-45" : ""}`}
                  />
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                  <Loader2 size={14} className="animate-spin" /> Fetching your
                  locations...
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses?.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`group p-5 rounded-2xl cursor-pointer transition-all border-2 relative ${
                        selectedAddressId === address.id
                          ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      {selectedAddressId === address.id && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle
                            size={18}
                            className="text-brand-500 fill-brand-500 text-white"
                          />
                        </div>
                      )}
                      <Home
                        className={`w-5 h-5 mb-3 transition-colors ${selectedAddressId === address.id ? "text-brand-600" : "text-gray-300 group-hover:text-gray-500"}`}
                      />
                      <p className="font-black text-gray-900 text-sm uppercase tracking-tight">
                        {address.label}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">
                        {address.line1}, {address.city}
                      </p>
                      {address.isDefault && (
                        <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-[0.2em] bg-gray-900 text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showNewAddressForm && (
                <form
                  onSubmit={handleAddNewAddress}
                  className="mt-6 space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-400"
                >
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      name="label"
                      placeholder="Label (e.g. Home, Work)"
                      className="input h-12 text-sm"
                      required
                    />
                    <input
                      name="line1"
                      placeholder="Detailed address"
                      className="input h-12 text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      name="city"
                      placeholder="City"
                      className="input h-12 text-sm"
                      required
                    />
                    <input
                      name="state"
                      placeholder="State"
                      className="input h-12 text-sm"
                      required
                    />
                    <input
                      name="pincode"
                      placeholder="Pincode"
                      className="input h-12 text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isDefault"
                      id="isDefault"
                      className="h-4 w-4 text-brand-600 rounded"
                    />
                    <label
                      htmlFor="isDefault"
                      className="text-xs font-bold text-gray-700"
                    >
                      Set as default
                    </label>
                    <button
                      type="submit"
                      className="btn-brand ml-auto h-11 px-6 text-sm"
                      disabled={addAddressMutation.isPending}
                    >
                      {addAddressMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Delivery Slots */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2 italic uppercase">
                <Clock size={18} className="text-brand-500" /> Delivery Slot
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {slots?.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                      selectedSlotId === slot.id
                        ? "border-brand-500 bg-brand-50 shadow-md scale-105"
                        : "border-gray-50 bg-gray-50/50 hover:border-brand-200"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-black uppercase tracking-widest ${selectedSlotId === slot.id ? "text-brand-600" : "text-gray-400"}`}
                    >
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="text-[9px] font-bold text-gray-500 italic uppercase">
                      Delivery Window
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Payment Method ──────────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2 italic uppercase">
                <CreditCard size={18} className="text-brand-500" /> Payment
                Method
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Wallet (Preferred) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("WALLET")}
                  className={`relative group flex flex-col p-5 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === "WALLET"
                      ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${
                        paymentMethod === "WALLET"
                          ? "bg-brand-500 shadow-brand-500/20"
                          : "bg-gray-100"
                      }`}
                    >
                      <Banknote
                        size={20}
                        className={
                          paymentMethod === "WALLET"
                            ? "text-white"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    {paymentMethod === "WALLET" && (
                      <div className="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center border-brand-500 bg-brand-500 shadow-lg shadow-brand-500/20">
                        <Check
                          size={14}
                          className="text-white"
                          strokeWidth={4}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <p
                      className={`font-black text-base italic uppercase tracking-tight ${paymentMethod === "WALLET" ? "text-brand-900" : "text-gray-400"}`}
                    >
                      Deeshora Wallet
                    </p>
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg ${walletBalance < netTotal ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      Balance: ₹{walletBalance.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">
                    Pay instantly from your wallet balance. Faster & Easier!
                  </p>
                </button>

                {/* Manual UPI (Free) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("MANUAL_UPI")}
                  className={`relative group flex flex-col p-5 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === "MANUAL_UPI"
                      ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${
                        paymentMethod === "MANUAL_UPI"
                          ? "bg-brand-500 shadow-brand-500/20"
                          : "bg-gray-100"
                      }`}
                    >
                      <CreditCard
                        size={20}
                        className={
                          paymentMethod === "MANUAL_UPI"
                            ? "text-white"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    {paymentMethod === "MANUAL_UPI" && (
                      <div className="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center border-brand-500 bg-brand-500 shadow-lg shadow-brand-500/20">
                        <Check
                          size={14}
                          className="text-white"
                          strokeWidth={4}
                        />
                      </div>
                    )}
                  </div>
                  <p
                    className={`font-black text-base italic uppercase tracking-tight ${paymentMethod === "MANUAL_UPI" ? "text-brand-900" : "text-gray-400"}`}
                  >
                    Direct UPI Transfer
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">
                    Pay via any UPI app and enter Transaction ID.
                  </p>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`relative group flex flex-col p-5 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === "COD"
                      ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-all ${
                        paymentMethod === "COD"
                          ? "bg-brand-500 shadow-brand-500/20"
                          : "bg-gray-100"
                      }`}
                    >
                      <Banknote
                        size={20}
                        className={
                          paymentMethod === "COD"
                            ? "text-white"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    {paymentMethod === "COD" && (
                      <div className="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center border-brand-500 bg-brand-500 shadow-lg shadow-brand-500/20">
                        <Check
                          size={14}
                          className="text-white"
                          strokeWidth={4}
                        />
                      </div>
                    )}
                  </div>
                  <p
                    className={`font-black text-base italic uppercase tracking-tight ${paymentMethod === "COD" ? "text-brand-900" : "text-gray-400"}`}
                  >
                    Cash on Delivery
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">
                    Pay in cash when your order arrives.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                      ₹10 extra COD fee
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2 italic uppercase">
                <Tag size={18} className="text-brand-500" /> Promo Code
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <div>
                      <span className="font-black text-emerald-800 font-mono text-sm uppercase">
                        {appliedCoupon.code}
                      </span>
                      <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        {appliedCoupon.description}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="ENTER PROMO CODE"
                    className="flex-1 h-12 px-5 bg-gray-50 font-mono font-bold tracking-widest text-sm rounded-2xl border-2 border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all uppercase placeholder:opacity-40"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && couponCode)
                        validateCoupon.mutate({
                          code: couponCode,
                          cartTotal: total(),
                        });
                    }}
                  />
                  <button
                    onClick={() =>
                      couponCode &&
                      validateCoupon.mutate({
                        code: couponCode,
                        cartTotal: total(),
                      })
                    }
                    disabled={validateCoupon.isPending || !couponCode}
                    className="px-6 h-12 bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                  >
                    {validateCoupon.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-4 italic uppercase">
                Special Instructions
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any landmarks or special notes for the delivery partner?"
                className="input w-full min-h-[100px] pt-4 resize-none text-sm"
              />
            </div>
          </div>

          {/* ── Right Column — Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/5 p-8 sticky top-[5.5rem] space-y-8">
              {/* Order items */}
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-6 italic uppercase tracking-tighter">
                  Bill Summary
                </h2>
                <div className="space-y-4 max-h-52 overflow-y-auto pr-2 no-scrollbar">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-[11px] truncate uppercase italic">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <span className="font-black text-gray-900 text-sm tracking-tighter">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="border-t border-dashed border-gray-100 pt-6 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Subtotal</span>
                  <span>₹{total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Delivery</span>
                  <span className="text-emerald-600">Free Delivery</span>
                </div>
                {paymentMethod === "COD" && (
                  <div className="flex justify-between text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                    <span>COD Processing Fee</span>
                    <span>+₹10.00</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1">
                      <Tag size={12} /> {appliedCoupon.code}
                    </span>
                    <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t-2 border-dashed border-gray-100">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">
                    Total Amount
                  </span>
                  <span className="text-4xl font-black text-gray-900 tracking-tighter italic leading-none">
                    ₹
                    {(netTotal + (paymentMethod === "COD" ? 10 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || items.length === 0}
                className="w-full h-16 font-black text-white text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 bg-gray-950 shadow-gray-950/20"
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {paymentMethod === "COD" ? (
                      <Banknote size={20} />
                    ) : (
                      <CreditCard size={20} />
                    )}{" "}
                    {paymentMethod === "COD" ? "Confirm COD" : "Place & Pay"}{" "}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-brand-500 opacity-50" />{" "}
                Secured by Deeshora Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
