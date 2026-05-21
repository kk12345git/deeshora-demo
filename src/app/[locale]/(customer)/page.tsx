// src/app/(customer)/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { trpc } from "@/lib/trpc";

import { Link, useRouter } from "@/navigation";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";

import {
  ShoppingBag,
  CheckCircle,
  Truck,
  ArrowRight,
  Star,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  CalendarDays,
  Zap,
  Gift,
  Percent,
  Timer,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";
import ProductCard from "@/components/customer/ProductCard";
import ProductCardSkeleton from "@/components/customer/ProductCardSkeleton";
import CitySelector from "@/components/customer/CitySelector";
import ClaymorphicPlayground from "@/components/customer/ClaymorphicPlayground";

import { useTranslations } from "next-intl";

// ─── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function CategoryItemImage({ category }: { category: any }) {
  const [error, setError] = useState(false);
  if (!category.image || error) {
    return (
      <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-500 font-bold text-xl">
        {category.name[0]}
      </div>
    );
  }

  return (
    <Image
      src={category.image}
      alt={category.name}
      width={64}
      height={64}
      className="object-contain group-hover:scale-110 transition-transform"
      onError={() => setError(true)}
    />
  );
}

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(
    undefined,
  );

  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  const t = useTranslations("Home");

  const tc = useTranslations("Common");

  useEffect(() => {
    const savedCity = localStorage.getItem("Deeshora_city");
    if (savedCity) setSelectedCity(savedCity);
    setIsLoaded(true);
  }, []);

  // ─── tRPC queries ────────────────────────────────────────────────────────

  const { data: categories, isLoading: isLoadingCats } =
    trpc.product.categories.useQuery();

  const { data: allProducts, isLoading: isLoadingAll } =
    trpc.product.list.useQuery({
      limit: 12,
      city: selectedCity,
      sortBy: "newest",
    });

  const { data: oneRupeeProducts, isLoading: isLoadingOneRupee } =
    trpc.product.list.useQuery({
      categorySlug: "one-rupee-store",
      limit: 8,
    });

  const { data: comboProducts, isLoading: isLoadingCombos } =
    trpc.product.list.useQuery({
      categorySlug: "combo-packs",
      limit: 6,
    });

  if (!isLoaded) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="bg-white dark:bg-gray-950 overflow-hidden">
      {/* ─── Hero Section (Premium Glassmorphism Split-Screen) ────────────────── */}
      <section className="relative min-h-[100vh] flex items-center bg-gray-950 px-4 pt-24 pb-16 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.45, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[15%] -left-[10%] w-[65%] h-[65%] bg-brand-500/20 blur-[130px] rounded-full animate-pulse-glowing"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] bg-pink-500/15 blur-[110px] rounded-full"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Premium Glassmorphic Copy, Location Select, CTA */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md"
              >
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                Daily Essentials Delivered
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black text-white leading-[0.85] tracking-tighter">
                  Premium
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-pink-500 to-brand-600 animate-gradient-x italic">
                    Daily
                  </span>
                  <br />
                  1Mart
                </h1>
                <p className="max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-white/60 font-semibold leading-relaxed tracking-tight mt-6">
                  North Chennai&apos;s own online{" "}
                  <span className="text-white font-black italic">Daily 1Mart</span>.
                  Get <span className="text-brand-400 font-bold">1% Redeem Points</span> on all your purchases!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-2"
              >
                <div className="bg-white/5 p-1 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                  <CitySelector
                    currentCity={selectedCity}
                    onCityChange={setSelectedCity}
                  />
                </div>
                <Link
                  href="/search"
                  className="group relative px-9 py-4.5 rounded-[1.75rem] bg-brand-500 text-white font-black text-base overflow-hidden shadow-[0_20px_50px_rgba(244,63,94,0.3)] hover:scale-105 transition-transform duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative flex items-center gap-2">
                    Shop Now <ArrowRight size={20} />
                  </span>
                </Link>
              </motion.div>

              {/* Trust Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/5"
              >
                {[
                  { label: "Products", val: "2k+", icon: ShoppingBag },
                  { label: "Happy Users", val: "10k+", icon: Users },
                  { label: "Fastest Delivery", val: "15m", icon: Zap },
                  { label: "Premium Rating", val: "4.9", icon: Star },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="group p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <stat.icon
                      className="mx-auto lg:mx-0 text-brand-400 mb-2 opacity-50 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                    <p className="text-2xl font-black text-white">{stat.val}</p>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Column: Immersive 3D Claymorphic Playground */}
            <div className="lg:col-span-6 w-full flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-full"
              >
                <ClaymorphicPlayground />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Premium Categories ─────────────────────────────────────────── */}
      <section className="relative -mt-10 z-20 container mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            <div className="flex-shrink-0 group">
              <div className="w-24 h-20 bg-gradient-to-br from-brand-500 to-pink-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl shadow-brand-500/20 group-hover:scale-105 transition-transform border-4 border-white dark:border-gray-800">
                <span className="text-[9px] font-black uppercase opacity-80 tracking-widest">
                  REWARDS
                </span>
                <span className="text-2xl font-black italic -mt-1">1%</span>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
            {isLoadingCats
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-16 h-20 animate-pulse bg-gray-50 dark:bg-gray-800 rounded-2xl"
                    />
                  ))
              : categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2 group min-w-[70px]"
                  >
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 group-hover:shadow-lg transition-all border border-transparent group-hover:border-brand-100 dark:group-hover:border-brand-900 overflow-hidden relative">
                      <CategoryItemImage category={cat} />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 group-hover:text-brand-600 uppercase tracking-widest truncate max-w-[64px] text-center">
                      {cat.name}
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ─── DAILY 1MART REWARD DEALS (Dark Premium) ────────────────────────── */}
      <section className="py-24 overflow-hidden bg-gray-950 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] rounded-full" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[10px] font-black uppercase tracking-widest">
                <Percent size={12} className="animate-pulse" /> 1% Reward Points Scheme
              </div>
              <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-none">
                DAILY <span className="text-brand-500">1MART</span> TOP PICKS
              </h2>
              <p className="text-white/40 font-bold text-lg max-w-md uppercase tracking-widest mt-4">
                Earn 1% in redeem points on every product purchase, convert to wallet cash anytime!
              </p>
            </div>
            <Link
              href="/search"
              className="group relative px-10 py-5 bg-white text-gray-950 rounded-[2rem] flex items-center gap-2 text-sm font-black uppercase tracking-widest overflow-hidden hover:scale-105 transition-all"
            >
              <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
                Explore Deals <ChevronRight size={18} />
              </span>
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10"
          >
            {isLoadingOneRupee
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <ProductCardSkeleton key={i} />)
              : oneRupeeProducts?.products.map((product) => (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product as any} />
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Subscription & Wallet Banners (Bento Style) ────────────────── */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Wallet Promo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative h-[300px] rounded-[3rem] overflow-hidden group shadow-2xl shadow-brand-500/10 border border-brand-100 dark:border-brand-900/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-pink-700" />
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Wallet size={160} className="text-white" />
              </div>
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                  <Gift size={24} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                  DEESHORA
                  <br />
                  WALLET
                </h3>
                <p className="text-white/70 font-bold text-lg mt-4 max-w-xs">
                  Earn <span className="text-white">1% Redeem Points</span> on all purchases + extra welcome bonus on top-ups!
                </p>
                <Link
                  href="/wallet"
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-50 transition-colors"
                >
                  Get Bonus Now <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Subscription Promo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative h-[300px] rounded-[3rem] overflow-hidden group shadow-2xl shadow-gray-950/10 border border-gray-100 dark:border-gray-800"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <CalendarDays size={160} className="text-white" />
              </div>
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center">
                <div className="w-12 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-500 mb-6">
                  <Percent size={24} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                  SUBSCRIBE
                  <br />& SAVE
                </h3>
                <p className="text-white/40 font-bold text-lg mt-4 max-w-xs">
                  Set daily or weekly deliveries and get{" "}
                  <span className="text-brand-500">Extra 15% OFF</span> on all
                  items.
                </p>
                <Link
                  href="/subscriptions"
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-colors shadow-brand-500/20"
                >
                  Manage Subscriptions <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── COMBO PACKS (Premium Grid) ─────────────────────────────────── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                COMBO SAVINGS
              </h2>
              <p className="text-gray-500 mt-2 font-medium">
                Curated bundles for your family needs. High value, low cost.
              </p>
            </div>
            <Link
              href="/category/combo-packs"
              className="hidden md:flex btn-secondary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest items-center gap-2"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-10">
            {isLoadingCombos
              ? Array(3)
                  .fill(0)
                  .map((_, i) => <ProductCardSkeleton key={i} />)
              : comboProducts?.products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
          </div>
        </div>
      </section>

      {/* ─── Main Product Feed ────────────────────────────────────────── */}
      <section id="all-products" className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                DAILY <span className="text-brand-500">FRESH</span> HUBS
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">
                Sourced locally in {selectedCity || "North Chennai"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {selectedCity && (
                <button
                  onClick={() => setSelectedCity(undefined)}
                  className="text-[10px] font-black text-gray-400 hover:text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full transition-all"
                >
                  Clear Filter <X size={14} />
                </button>
              )}
            </div>
          </div>

          {isLoadingAll ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
            </div>
          ) : (allProducts?.products.length || 0) > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
              {allProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[4rem]"
            >
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300 dark:text-gray-700 shadow-inner">
                <ShoppingBag size={48} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                NO PRODUCTS YET
              </h3>
              <p className="mt-4 text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
                We&apos;re expanding fast! We&apos;ll be in{" "}
                {selectedCity ? selectedCity : "your area"} very soon with
                amazing deals.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setSelectedCity(undefined)}
                  className="btn-primary px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                  View Other Areas
                </button>
                <Link
                  href="https://wa.me/918110051185"
                  className="btn-secondary px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-gray-200"
                >
                  Notify Me
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── WhatsApp Button (Premium Floating) ─────────────────────── */}
      <div className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-[60]">
        <motion.a
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/918110051185?text=Hi%20Deeshora!%20I%20need%20help%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-6 h-16 bg-[#25D366] text-white rounded-[2rem] shadow-[0_20px_50px_rgba(37,211,102,0.4)] hover:shadow-[0_25px_60px_rgba(37,211,102,0.6)] transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 fill-current relative z-10"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="font-black uppercase tracking-widest text-xs">
            Chat with Us
          </span>
          <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-20 scale-150" />
        </motion.a>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}
