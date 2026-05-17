// src/app/(customer)/product/[slug]/ProductDetailsClient.tsx
"use client";

import { trpc } from "@/lib/trpc";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ShoppingCart,
  Share2,
  Heart,
  MapPin,
  Loader2,
  Info,
  Zap,
  MessageCircle,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCart, CartItem } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter } from "@/navigation";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getProductShareUrl } from "@/lib/whatsapp";
import { toast } from "react-hot-toast";

import { useUser } from "@clerk/nextjs";
import { ProductWithRelations } from "@/types";

interface ProductDetailsClientProps {
  product: ProductWithRelations;
}

export default function ProductDetailsClient({
  product: initialProduct,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [selectedImage, setSelectedImage] = useState(0);
  const { items, addItem, updateQuantity } = useCart();

  // 3D Showcase Coordinates and Touch-Drag state handlers
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const x = Math.max(-0.5, Math.min(0.5, dx / rect.width));
    const y = Math.max(-0.5, Math.min(0.5, dy / rect.height));
    setCoords({ x, y });
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const rotateX = isHovered ? -coords.y * 20 : 0;
  const rotateY = isHovered ? coords.x * 20 : 0;
  const lightX = isHovered ? (coords.x + 0.5) * 100 : 50;
  const lightY = isHovered ? (coords.y + 0.5) * 100 : 50;

  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY"
  >("DAILY");

  const { data: addresses = [] } = trpc.user.myAddresses.useQuery(undefined, {
    enabled: isSignedIn && showSubModal,
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const addItemMutation = trpc.cart.addItem.useMutation();
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const syncCartMutation = trpc.cart.sync.useMutation();
  const subscribeMutation = trpc.subscription.create.useMutation();

  const { data: product } = trpc.product.bySlug.useQuery(
    { slug: initialProduct.slug },
    { initialData: initialProduct },
  );

  if (!product) return null;

  const cartItem = items.find((item) => item.productId === product.id);
  const discount = Math.round(
    ((product.mrp - product.price) / product.mrp) * 100,
  );

  const handleAddToCart = async () => {
    const item: Omit<CartItem, "quantity"> = {
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      stock: product.stock,
      type: product.type,
    };
    addItem(item);

    if (isSignedIn) {
      try {
        await addItemMutation.mutateAsync({
          productId: product.id,
          quantity: 1,
        });
        toast.success("Added to cart");
      } catch (error) {
        console.error("Failed to sync add to cart:", error);
      }
    }
  };

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const item: Omit<CartItem, "quantity"> = {
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      stock: product.stock,
      type: product.type,
    };
    if (!cartItem) addItem(item);
    try {
      await syncCartMutation.mutateAsync([
        { productId: product.id, quantity: cartItem ? cartItem.quantity : 1 },
      ]);
    } catch (error) {
      console.error("Buy Now sync failed:", error);
    }
    router.push("/checkout");
  };

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsSubmittingSub(true);
    try {
      await subscribeMutation.mutateAsync({
        productId: product.id,
        frequency: selectedFrequency,
        quantity: 1,
        addressId: selectedAddressId,
      });
      toast.success("Subscribed successfully! 🚀");
      setShowSubModal(false);
      router.push("/subscriptions");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe");
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleUpdateQuantity = async (id: string, qty: number) => {
    updateQuantity(id, qty);
    if (isSignedIn) {
      try {
        await updateQuantityMutation.mutateAsync({
          productId: id,
          quantity: qty,
        });
      } catch (error) {
        console.error("Failed to sync quantity update:", error);
      }
    }
  };

  const productSchema = {
    name: product.name,
    image: product.images,
    description: product.description.replace(/<[^>]*>?/gm, ""),
    sku: product.id,
    brand: { "@type": "Brand", name: "Deeshora" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Deeshora" },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-20"
    >
      <JsonLd type="Product" data={productSchema} />

      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-4 z-40 px-4">
        <div className="flex items-center justify-between p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"
            >
              <Share2 size={18} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"
            >
              <Heart size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <Breadcrumbs
          items={[
            { label: "Categories", href: "/categories" },
            {
              label: product.category.name,
              href: `/category/${product.category.slug}`,
            },
            {
              label: product.name,
              href: `/product/${product.slug}`,
              active: true,
            },
          ]}
        />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mt-8">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="perspective-1000 w-full select-none">
              <motion.div
                layoutId="product-image"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.01 : 1})`,
                  transformStyle: "preserve-3d",
                  transition: isHovered ? "transform 0.05s ease-out, box-shadow 0.3s ease" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                  setIsHovered(false);
                  setCoords({ x: 0, y: 0 });
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative aspect-square w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 group border border-gray-100 cursor-grab active:cursor-grabbing"
              >
                {/* Specular product reflection overlay */}
                <div
                  style={{
                    background: `radial-gradient(circle 260px at ${lightX}% ${lightY}%, rgba(255,255,255,0.22), transparent 75%)`,
                  }}
                  className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 mix-blend-overlay ${isHovered ? "opacity-100" : "opacity-0"}`}
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full pointer-events-none select-none"
                    style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                      className="w-full h-full cursor-zoom-in"
                    >
                      <Image
                        src={product.images[selectedImage]}
                        alt={product.name}
                        width={800}
                        height={800}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
                {discount > 0 && (
                  <div className="absolute top-8 left-8 badge bg-brand-600 text-white font-black text-xs px-5 py-2.5 shadow-xl rotate-[-2deg]" style={{ transform: "translateZ(45px)" }}>
                    SAVES {discount}%
                  </div>
                )}
              </motion.div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img: string, index: number) => (
                <motion.button
                  key={index}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all shadow-md ${
                    selectedImage === index
                      ? "border-brand-500 shadow-brand-500/10"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} preview-${index}`}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                  <div className="flex items-center text-[11px] font-bold text-gray-500 gap-1.5 ml-auto bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span>{(product.rating || 0).toFixed(1)}</span>
                    <span className="text-gray-300">•</span>
                    <span>{product.reviewCount} Reviews</span>
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[0.9] uppercase italic drop-shadow-sm">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-end gap-4 bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/80 shadow-inner">
                <div className="space-y-1">
                  <p className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tighter">
                    ₹{product.price}
                  </p>
                  {product.mrp > product.price && (
                    <div className="flex items-center gap-3">
                      <p className="text-lg text-gray-300 line-through font-medium">
                        ₹{product.mrp}
                      </p>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                        Saved ₹{(product.mrp - product.price).toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="ml-auto mb-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] bg-gray-100/50 px-4 py-2 rounded-xl border border-gray-200/50">
                  Per {product.unit || "unit"}
                </div>
              </div>

              {/* ── SUBSCRIPTION PLANS ── */}
              <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-500/20">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calendar size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center">
                      <Clock className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic tracking-tighter uppercase">
                        Deeshora Subscription
                      </h3>
                      <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                        Never run out of essentials
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setSelectedFrequency(freq as any)}
                        className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                          selectedFrequency === freq
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-white/5 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                          {freq}
                        </span>
                        <span className="text-sm font-black italic tracking-tighter">
                          PLAN
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowSubModal(true)}
                    className="w-full h-14 bg-white text-gray-900 rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center justify-center gap-2 group"
                  >
                    Create Subscription{" "}
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={14} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Provenance & Details
                  </h4>
                </div>
                <div
                  className="text-lg text-gray-700 leading-relaxed font-medium bg-white/30 p-6 rounded-[2rem] border border-white/50"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>

              {product.stock > 0 && product.stock <= 10 && (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-4 text-brand-700 bg-brand-50/80 backdrop-blur-sm p-5 rounded-[2rem] border border-brand-100/50"
                >
                  <AlertTriangle size={24} className="text-brand-600" />
                  <p className="text-sm font-black tracking-tight uppercase italic">
                    Inventory Alert: Only {product.stock} units remaining!
                  </p>
                </motion.div>
              )}

              {/* Desktop CTA */}
              <div className="hidden lg:block pt-8">
                {product.stock > 0 ? (
                  cartItem ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Modify Selection
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-950 text-white rounded-[2.5rem] p-1.5 shadow-2xl shadow-brand-500/20">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleUpdateQuantity(
                                product.id,
                                cartItem.quantity - 1,
                              )
                            }
                            className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-[2rem] transition-all"
                          >
                            <Minus size={22} strokeWidth={3} />
                          </motion.button>
                          <span className="w-20 text-center text-2xl font-black italic">
                            {cartItem.quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleUpdateQuantity(
                                product.id,
                                cartItem.quantity + 1,
                              )
                            }
                            className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-[2rem] transition-all"
                          >
                            <Plus size={22} strokeWidth={3} />
                          </motion.button>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleBuyNow}
                          className="flex-1 h-[72px] bg-gradient-to-r from-brand-500 to-brand-600 text-white font-black text-base rounded-[2rem] shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 tracking-wide uppercase italic transition-all"
                        >
                          <Zap size={20} className="fill-white" /> Buy Now
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-w-sm">
                      <motion.button
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBuyNow}
                        className="w-full h-20 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 tracking-wide uppercase italic transition-all"
                      >
                        <Zap size={24} className="fill-white" /> Buy Now
                      </motion.button>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddToCart}
                          className="flex-1 h-14 border-2 border-gray-900 text-gray-900 bg-white font-black text-sm rounded-[2rem] flex items-center justify-center gap-3 tracking-widest uppercase hover:bg-gray-50 transition-all"
                        >
                          <ShoppingCart size={18} /> Add
                        </motion.button>
                        <a
                          href={getProductShareUrl(
                            "918110051185",
                            product.name,
                            product.slug,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 h-14 bg-[#25D366] text-white font-black text-[10px] rounded-[2rem] flex items-center justify-center gap-2 tracking-widest uppercase hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <MessageCircle size={16} fill="currentColor" />{" "}
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-20 w-full max-w-sm bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-400 font-black uppercase tracking-[0.2em] cursor-not-allowed">
                    Sold Out
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-12 italic">
            Verified Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.reviews.map((review: any) => (
              <div
                key={review.id}
                className="card p-6 bg-white border border-gray-100 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? "text-brand-500 fill-current"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 font-medium italic">
                  &quot;{review.comment}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubModal(false)}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic uppercase">
                    Confirm Subscription
                  </h3>
                  <button
                    onClick={() => setShowSubModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl mb-8">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-black italic uppercase leading-none mb-1">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-brand-600">
                      ₹{product.price} / delivery
                    </p>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3 ml-1">
                      Delivery Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["DAILY", "WEEKLY", "MONTHLY"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setSelectedFrequency(f as any)}
                          className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${selectedFrequency === f ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3 ml-1">
                      Delivery Address
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all group ${selectedAddressId === addr.id ? "border-brand-500 bg-brand-50" : "border-gray-100 hover:border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase italic group-hover:text-brand-600 transition-colors">
                              {addr.label}
                            </span>
                            {selectedAddressId === addr.id && (
                              <CheckCircle
                                size={14}
                                className="text-brand-500"
                              />
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 leading-tight">
                            {addr.line1}, {addr.city}
                          </p>
                        </button>
                      ))}
                      <Link
                        href="/profile"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-all"
                      >
                        <Plus size={14} /> Add New Address
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 mb-8 flex items-start gap-3">
                  <ShieldCheck
                    className="text-brand-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                    Payments will be automatically deducted from your{" "}
                    <span className="text-brand-600 font-black">
                      Deeshora Wallet
                    </span>{" "}
                    before each delivery.
                  </p>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isSubmittingSub}
                  className="w-full h-16 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-950/20 hover:bg-black transition-all flex items-center justify-center gap-3"
                >
                  {isSubmittingSub ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      START SUBSCRIPTION <Zap size={18} fill="white" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Mobile Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-4">
        <div className="p-3 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl flex items-center gap-3">
          <div className="pl-2 shrink-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Price
            </p>
            <p className="text-xl font-black text-gray-950 tracking-tighter">
              ₹{product.price}
            </p>
          </div>
          <button
            onClick={handleBuyNow}
            className="flex-1 h-12 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <Zap size={15} fill="white" /> Buy Now
          </button>
          <button
            onClick={() => setShowSubModal(true)}
            className="h-12 w-12 flex items-center justify-center bg-gray-950 text-white rounded-2xl shadow-lg shrink-0"
          >
            <Calendar size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
