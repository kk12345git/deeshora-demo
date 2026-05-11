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
      <div className="w-20 h-20 bg-orange-100 rounded-full group-hover:bg-white/20 flex items-center justify-center text-orange-500 font-bold text-2xl">
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
    const savedCity = localStorage.getItem("deeshora_city");
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
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/20 to-transparent blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-700">
               <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
               Empowering Local Commerce
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter" dangerouslySetInnerHTML={{ __html: t.raw('hero_title').replace('Hometown', '<span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Hometown</span>') }} />
            
            <p className="max-w-2xl mx-auto text-xl text-white/60 font-medium leading-relaxed">
              {t('hero_subtitle')}
            </p>

            {/* ─── AI Search Bar ─────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className={`flex items-center bg-white rounded-[1.75rem] shadow-2xl shadow-black/40 overflow-hidden border-2 transition-all duration-300 ${showSuggestions && (suggestions?.length ?? 0) > 0 ? 'border-orange-400 rounded-b-none border-b-0' : 'border-transparent'}`}>
                  {/* AI badge */}
                  <div className="flex items-center gap-1.5 pl-5 pr-3 border-r border-gray-100 py-4 flex-shrink-0">
                    <Sparkles size={16} className="text-orange-500" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest hidden sm:block">AI</span>
                  </div>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setShowSuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
                    placeholder={tc('search')}
                    className="flex-1 px-4 py-4 text-gray-900 font-medium placeholder:text-gray-400 outline-none bg-transparent text-base"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
                      className="px-2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="m-1.5 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-[1.25rem] transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.02] flex-shrink-0"
                  >
                    <Search size={18} />
                    <span className="hidden sm:block">Search</span>
                  </button>
                </div>

                {/* ─── Typeahead Dropdown ──────────────────────────────── */}
                {showSuggestions && debouncedSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-orange-400 border-t-0 rounded-b-[1.75rem] shadow-2xl shadow-black/20 overflow-hidden z-50">
                    {isSuggesting ? (
                      <div className="flex items-center gap-3 px-5 py-4 text-gray-400">
                        <Loader2 size={16} className="animate-spin text-orange-400" />
                        <span className="text-sm font-medium">Searching...</span>
                      </div>
                    ) : (suggestions?.length ?? 0) > 0 ? (
                      <>
                        <div className="px-5 pt-3 pb-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Results</span>
                        </div>
                        {suggestions?.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSuggestionClick(item.slug)}
                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-orange-50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.images[0] ? (
                                <Image src={item.images[0]} alt={item.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                                  <ShoppingBag size={16} className="text-orange-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.category.name}</p>
                            </div>
                            <span className="font-black text-gray-800 text-sm flex-shrink-0">₹{item.price}</span>
                          </button>
                        ))}
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-50 hover:bg-orange-50 border-t border-gray-100 text-sm font-bold text-orange-600 transition-colors"
                        >
                          <Search size={14} />
                          See all results for &quot;{debouncedSearch}&quot;
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-4 text-gray-400">
                        <Search size={16} />
                        <span className="text-sm font-medium">No quick matches — press Enter to search</span>
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Popular searches */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Trending:</span>
                {['Fresh Vegetables', 'Milk', 'Rice', 'Bread', 'Eggs'].map((term) => (
                  <button
                    key={term}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 text-xs font-bold transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* City selector + Browse CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <CitySelector 
                currentCity={selectedCity} 
                onCityChange={setSelectedCity} 
              />
              <Link href="#all-products" className="btn-primary px-8 py-3.5 rounded-2xl shadow-orange-500/20 shadow-xl hover:scale-105 transition-transform">
                {t('browse_products')} <ArrowRight size={18} className="ml-1.5 inline" />
              </Link>
            </div>

            {/* Stats / Trust */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-white/5">
                <div>
                    <p className="text-3xl font-bold text-white">500+</p>
                    <p className="text-sm text-white/40">Local Shops</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-white">50k+</p>
                    <p className="text-sm text-white/40">Orders Delivered</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-white">4.9/5</p>
                    <p className="text-sm text-white/40 leading-none">
                        <span className="flex justify-center gap-0.5 text-orange-500"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></span>
                        Customer Rating
                    </p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-white">15 Min</p>
                    <p className="text-sm text-white/40">Avg. Delivery</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Pills */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Truck, title: "Lightning Fast", desc: "Doorstep delivery from local shops within 30 mins." },
            { icon: CheckCircle, title: "100% Verified", desc: "Every vendor in your area is manually vetted by us." },
            { icon: ShoppingBag, title: "Best Prices", desc: "Direct from shop prices without hidden markups." }
          ].map((pill, i) => (
            <div key={i} className="card p-8 bg-white/80 backdrop-blur-xl border-white/50 shadow-2xl hover:-translate-y-2 transition-transform">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-6">
                <pill.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pill.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{pill.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900">{t('explore_categories')}</h2>
              <p className="text-gray-500 mt-2">Find exactly what you need in your {selectedCity || "local area"}.</p>
            </div>
            <Link href="/categories" className="text-orange-600 font-bold hover:underline flex items-center">
                {t('see_all')} <ArrowRight size={16} className="ml-1" />
            </Link>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {isLoadingCats ? Array(8).fill(0).map((_, i) => <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-3xl" />) : 
            categories?.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="group space-y-4">
                <div className="aspect-square bg-gray-50 rounded-[2rem] p-4 flex items-center justify-center group-hover:bg-orange-600 transition-all group-hover:shadow-2xl group-hover:shadow-orange-500/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CategoryItemImage category={category} />
                </div>
                <p className="text-center font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{category.name}</p>
              </Link>
            ))}
          </div>
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
                            <div className="relative h-48 rounded-[2.5rem] overflow-hidden mb-6 shadow-xl group-hover:shadow-orange-500/20 transition-all">
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
                                                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-500 text-[10px] font-black">{community.vendor.shopName[0]}</div>
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
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Join Now →</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular right now */}
      {(popularProducts?.products.length ?? 0) > 0 && (
        <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <TrendingUp size={22} className="text-orange-500" />
              Popular Right Now
              <span className="h-px bg-gray-200 flex-grow hidden md:block" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {popularProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(featuredProducts?.products.length || 0) > 0 && (
        <section className="bg-gray-50 py-24 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black text-gray-900 mb-12 flex items-center gap-4">
               {t('featured_specials')}
               <span className="h-px bg-gray-200 flex-grow hidden md:block" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <Suspense fallback={Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}>
                {isLoadingFeatured ? Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />) :
                featuredProducts?.products.map((product, i) => (
                  <ProductCard key={product.id} product={product as any} priority={i < 4} />
                ))}
              </Suspense>
            </div>
          </div>
        </section>
      )}

      {/* Main Feed */}
      <section id="all-products" className="py-24">
        <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <h2 className="text-3xl font-black text-gray-900">
                {t('fresh_from')} <span className="text-orange-500">{selectedCity || "Local Stores"}</span>
            </h2>
            {selectedCity && (
                <button 
                  onClick={() => setSelectedCity(undefined)}
                  className="text-xs font-bold text-gray-400 hover:text-orange-500 uppercase tracking-widest flex items-center gap-1"
                >
                    Clear City Filter <X size={12} />
                </button>
            )}
           </div>

          {isLoadingAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                 {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (allProducts?.products.length || 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">We&apos;re still onboarding shop owners in {selectedCity ? selectedCity : "this area"}. Check back soon!</p>
              <div className="mt-8 flex justify-center gap-4">
                  <Link href="/vendor/register" className="btn-primary">Become a Vendor</Link>
                  <button onClick={() => setSelectedCity(undefined)} className="btn-secondary">View All Areas</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
