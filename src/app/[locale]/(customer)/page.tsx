// src/app/(customer)/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from '@/lib/trpc';
import { Link, useRouter } from '@/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, CheckCircle, Truck, ArrowRight, Star, MapPin, Loader2, X, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import ProductCard from '@/components/customer/ProductCard';
import ProductCardSkeleton from '@/components/customer/ProductCardSkeleton';
import CitySelector from '@/components/customer/CitySelector';
import { useTranslations } from 'next-intl';

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
      <div className="w-20 h-20 bg-brand-100 rounded-full group-hover:bg-white/20 flex items-center justify-center text-brand-500 font-bold text-2xl">
        {category.name[0]}
      </div>
    );
  }
  return (
    <Image 
      src={category.image} 
      alt={category.name} 
      width={80} 
      height={80} 
      className="object-contain group-hover:scale-110 transition-transform group-hover:brightness-0 group-hover:invert" 
      onError={() => setError(true)} 
    />
  );
}

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations('Home');
  const tc = useTranslations('Common');

  const debouncedSearch = useDebounce(searchInput, 250);

  useEffect(() => {
    const savedCity = localStorage.getItem("daily1mart_city");
    if (savedCity) setSelectedCity(savedCity);
    setIsLoaded(true);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── tRPC queries ────────────────────────────────────────────────────────
  const { data: suggestions, isLoading: isSuggesting } = trpc.product.suggest.useQuery(
    { query: debouncedSearch, city: selectedCity },
    { enabled: debouncedSearch.trim().length >= 2 }
  );

  const { data: categories, isLoading: isLoadingCats } = trpc.product.categories.useQuery();
  const { data: communities, isLoading: isLoadingCommunities } = trpc.community.list.useQuery({ limit: 4 });
  const { data: featuredProducts, isLoading: isLoadingFeatured } = trpc.product.list.useQuery({ 
    limit: 8, 
    featured: true,
    city: selectedCity 
  });
  const { data: allProducts, isLoading: isLoadingAll } = trpc.product.list.useQuery({ 
    limit: 12,
    city: selectedCity,
    sortBy: 'newest',
  });
  const { data: popularProducts } = trpc.product.list.useQuery({ 
    limit: 4,
    city: selectedCity,
    sortBy: 'popular',
  });

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }, [searchInput, router]);

  const handleSuggestionClick = useCallback((productSlug: string) => {
    setShowSuggestions(false);
    setSearchInput('');
    router.push(`/product/${productSlug}`);
  }, [router]);

  if (!isLoaded) return null;

  return (
    <div className="space-y-0">
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gray-950">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-500/20 to-transparent blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-pink-500/10 to-transparent blur-3xl opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-700">
               <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
               North Chennai&apos;s Own Mart
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter">
              Daily<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">1</span>Mart
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-white/60 font-medium leading-relaxed">
              North Chennai oda own online ₹1 mart
            </p>

            <div className="max-w-2xl mx-auto text-center py-4 md:py-8">
               <h2 className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-pink-400 animate-pulse uppercase tracking-tighter">Budget Friendly. Premium Quality.</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <CitySelector 
                currentCity={selectedCity} 
                onCityChange={setSelectedCity} 
              />
              <Link href="/search" className="btn-primary px-8 py-3.5 rounded-2xl shadow-brand-500/20 shadow-xl hover:scale-105 transition-transform">
                {t('browse_products')} <ArrowRight size={18} className="ml-1.5 inline" />
              </Link>
            </div>

            {/* Stats / Trust (Hidden on small mobile) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-8 md:pt-12 border-t border-white/5">
                <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">500+</p>
                    <p className="text-[10px] md:text-sm text-white/40 uppercase tracking-widest">Local Shops</p>
                </div>
                <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">50k+</p>
                    <p className="text-[10px] md:text-sm text-white/40 uppercase tracking-widest">Orders</p>
                </div>
                <div className="hidden sm:block">
                    <p className="text-2xl md:text-3xl font-bold text-white">4.9/5</p>
                    <p className="text-[10px] md:text-sm text-white/40 leading-none">
                        <span className="flex justify-center gap-0.5 text-brand-500"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></span>
                        Rating
                    </p>
                </div>
                <div className="hidden sm:block">
                    <p className="text-2xl md:text-3xl font-bold text-white">15 Min</p>
                    <p className="text-[10px] md:text-sm text-white/40 uppercase tracking-widest">Delivery</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Categories Bar (Mobile First) */}
      <section className="bg-white sticky top-[72px] z-30 border-b border-gray-100 shadow-sm overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
             <Link href="/category/1-rupee-store" className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-active:scale-90 transition-transform">
                  <span className="text-xl font-black">₹1</span>
                </div>
                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">₹1 Store</span>
             </Link>
             <div className="w-px h-10 bg-gray-100 mx-1 flex-shrink-0" />
             {isLoadingCats ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl" />
                    <div className="w-10 h-2 bg-gray-100 rounded" />
                  </div>
                ))
             ) : (
                categories?.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-active:scale-90 transition-transform overflow-hidden relative border border-gray-100">
                      <CategoryItemImage category={cat} />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 group-hover:text-brand-600 uppercase tracking-widest truncate max-w-[64px]">{cat.name}</span>
                  </Link>
                ))
             )}
          </div>
        </div>
      </section>

      {/* Trust Pills (Optimized for Mobile) */}
      <section className="container mx-auto px-4 py-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
          {[
            { icon: Truck, title: "Quick Delivery", desc: "Doorstep delivery within 30 mins." },
            { icon: CheckCircle, title: "100% Verified", desc: "Every product is manually vetted." },
            { icon: ShoppingBag, title: "Best Prices", desc: "Direct from mart prices." }
          ].map((pill, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm md:flex-col md:text-center md:p-8 md:rounded-[2rem] hover:shadow-xl transition-all">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-50 md:bg-brand-500 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-600 md:text-white flex-shrink-0">
                <pill.icon size={20} className="md:hidden" />
                <pill.icon size={28} className="hidden md:block" />
              </div>
              <div>
                <h3 className="text-sm md:text-xl font-black text-gray-900">{pill.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 font-medium md:mt-2">{pill.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* Trending Communities */}
      {communities?.items && communities.items.length > 0 && (
        <section className="py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Trending Communities</h2>
                    <p className="text-gray-500 mt-2">Join local hubs and connect with shops.</p>
                </div>
                <Link href="/communities" className="btn-secondary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    View All <ArrowRight size={14} />
                </Link>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 no-scrollbar">
                {communities.items.map((community: any, i: number) => (
                    <motion.div
                        key={community.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-shrink-0 w-80 group cursor-pointer"
                    >
                        <Link href={`/communities/${community.id}`}>
                            <div className="relative h-48 rounded-[2.5rem] overflow-hidden mb-6 shadow-xl group-hover:shadow-brand-500/20 transition-all">
                                <Image 
                                    src={community.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'} 
                                    alt={community.name} 
                                    fill 
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white overflow-hidden p-1 flex-shrink-0">
                                            {community.vendor.logo ? (
                                                <Image src={community.vendor.logo} alt={community.vendor.shopName} width={32} height={32} />
                                            ) : (
                                                <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-500 text-[10px] font-black">{community.vendor.shopName[0]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{community.vendor.shopName}</p>
                                            <p className="text-white font-black">{community.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <Users size={14} />
                                    {community._count.members} Members
                                </div>
                                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Join Now →</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── ₹1 Store Section ────────────────────────────────────────── */}
      <section className="py-12 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <span className="text-xl font-black italic">₹1</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight italic">₹1 STORE</h2>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Unbelievable Deals at Just ₹1</p>
              </div>
            </div>
            <Link href="/category/one-rupee-store" className="text-xs font-black text-brand-500 uppercase tracking-widest flex items-center gap-1.5 group hover:translate-x-1 transition-transform">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
            {trpc.product.list.useQuery({ categorySlug: 'one-rupee-store', limit: 6 }).data?.products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-44 md:w-56">
                <ProductCard product={product as any} />
              </div>
            ))}
            {trpc.product.list.useQuery({ categorySlug: 'one-rupee-store', limit: 6 }).isLoading && (
               Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 md:w-56">
                  <ProductCardSkeleton />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── Combo Packs Banner ──────────────────────────────────────── */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Link href="/category/combo-packs">
            <div className="relative h-40 md:h-64 rounded-[2.5rem] overflow-hidden group shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1607349913338-fca6f7fc714a?w=1200" 
                alt="Combo Packs" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600/90 via-brand-500/40 to-transparent flex flex-col justify-center px-8 md:px-16">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-4">
                  <Sparkles size={14} className="text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Mega Savings</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                  COMBO<br />PACKS
                </h2>
                <p className="text-white/80 font-bold text-xs md:text-sm mt-2 max-w-[200px] md:max-w-xs">Save up to 40% on monthly grocery bundles.</p>
                <div className="mt-6 flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                  Shop Now <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── WhatsApp Button (Floating) ─────────────────────────────── */}
      <div className="fixed bottom-24 right-6 z-[60] md:bottom-8">
        <a 
          href="https://wa.me/918110051185?text=Hi%20Daily1Mart!%20I%20need%20help%20with%20my%20order." 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all group"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-4 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
            Need Help? Chat with us!
          </span>
        </a>
      </div>

      {/* Main Feed */}
      <section id="all-products" className="py-24">
        <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <h2 className="text-3xl font-black text-gray-900 italic tracking-tight">
                {t('fresh_from')} <span className="text-brand-500">{selectedCity || "LOCAL HUBS"}</span>
            </h2>
            {selectedCity && (
                <button 
                  onClick={() => setSelectedCity(undefined)}
                  className="text-xs font-bold text-gray-400 hover:text-brand-500 uppercase tracking-widest flex items-center gap-1"
                >
                    Clear Area Filter <X size={12} />
                </button>
            )}
           </div>

          {isLoadingAll ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                 {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (allProducts?.products.length || 0) > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {allProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <ShoppingBag size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">No products here yet</h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">We&apos;re still onboarding hubs in {selectedCity ? selectedCity : "this area"}. Check back soon!</p>
              <div className="mt-8 flex justify-center gap-4">
                  <Link href="/vendor/register" className="btn-primary">Become a Hub Partner</Link>
                  <button onClick={() => setSelectedCity(undefined)} className="btn-secondary">View All Areas</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
