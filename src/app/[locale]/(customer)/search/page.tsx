// src/app/(customer)/search/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { trpc } from '@/lib/trpc';
import ProductCard from '@/components/customer/ProductCard';
import { Search as SearchIcon, Loader2, ShoppingBag, Sparkles, Zap, Tag, ArrowRight, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [liveQuery, setLiveQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setSelectedCity(savedCity);
  }, []);

  useEffect(() => {
    setLiveQuery(query);
    setSelectedCategory(undefined);
  }, [query]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (liveQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(liveQuery.trim())}`);
    }
  }, [liveQuery, router]);

  // ─── AI Smart Search ────────────────────────────────────────────────────
  const { data: smartData, isLoading: isSmartLoading } = trpc.product.smartSearch.useQuery(
    { query, city: selectedCity, limit: 20 },
    { enabled: query.trim().length > 0 }
  );

  // ─── Categories for filter chips ────────────────────────────────────────
  const { data: categories } = trpc.product.categories.useQuery();

  // ─── Filter by category on client side ──────────────────────────────────
  const filteredExact = selectedCategory
    ? smartData?.exact.filter(p => p.category.slug === selectedCategory) ?? []
    : smartData?.exact ?? [];

  const filteredRelated = selectedCategory
    ? smartData?.related.filter(p => p.category.slug === selectedCategory) ?? []
    : smartData?.related ?? [];

  // Which categories appear in results
  const resultCategorySlugs = new Set([
    ...(smartData?.exact ?? []).map(p => p.category.slug),
    ...(smartData?.related ?? []).map(p => p.category.slug),
  ]);
  const filterCategories = categories?.filter(c => resultCategorySlugs.has(c.slug)) ?? [];

  const hasResults = (smartData?.exact.length ?? 0) + (smartData?.related.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ─── Search Header ─────────────────────────────────────────────── */}
      <section className="bg-gray-950 pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-emerald-500/20 to-transparent blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/20 to-transparent blur-3xl opacity-20 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* AI badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" /> AI Search Engine
              </div>
            </div>

            {/* Live re-search input */}
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-[1.75rem] overflow-hidden focus-within:border-orange-500/50 focus-within:bg-white/8 transition-all">
                <SearchIcon size={20} className="ml-5 text-gray-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={liveQuery}
                  onChange={(e) => setLiveQuery(e.target.value)}
                  placeholder="Search again..."
                  className="flex-1 px-4 py-4 bg-transparent text-white font-medium placeholder:text-gray-600 outline-none text-lg"
                />
                {liveQuery !== query && liveQuery.trim() && (
                  <button
                    type="submit"
                    className="m-1.5 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-5 py-3 rounded-[1.25rem] transition-all text-sm"
                  >
                    Search <ArrowRight size={16} />
                  </button>
                )}
                {liveQuery && (
                  <button
                    type="button"
                    onClick={() => { setLiveQuery(''); inputRef.current?.focus(); }}
                    className="px-3 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>

            {/* Results summary */}
            {!isSmartLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {hasResults ? (
                      <>
                        <span className="text-orange-400">{smartData?.totalExact ?? 0}</span> exact
                        {(filteredRelated.length > 0) && <> + <span className="text-emerald-400">{smartData?.related.length}</span> related</>}
                        <span className="text-white/40 font-medium"> for</span> &quot;{query}&quot;
                      </>
                    ) : (
                      <>No results for &quot;{query}&quot;</>
                    )}
                  </h1>
                </div>

                {/* AI Insight Banner */}
                {smartData?.suggestedCategory && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                    <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
                      <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <Tag size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 leading-none mb-1">AI Smart Intent</p>
                        <p className="text-sm font-bold text-emerald-400">
                          Detected your interest in <span className="text-white underline decoration-emerald-500/50 underline-offset-4 decoration-2">{smartData.suggestedCategory.name}</span>. 
                          I&apos;ve prioritized fresh local items for you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Category Filter Chips ──────────────────────────────────────── */}
      {filterCategories.length > 1 && (
        <div className="bg-white border-b border-gray-100 sticky top-[72px] z-30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  !selectedCategory
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {filterCategories.map((cat) => {
                const count = (smartData?.exact ?? []).filter(p => p.category.slug === cat.slug).length
                  + (smartData?.related ?? []).filter(p => p.category.slug === cat.slug).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug === selectedCategory ? undefined : cat.slug)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Tag size={11} /> {cat.name} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 space-y-16">
        {/* ─── Loading ──────────────────────────────────────────────────── */}
        {isSmartLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 size={18} className="animate-spin text-orange-400" />
              <span className="font-bold text-sm">AI is searching your neighborhood...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-white rounded-[2.5rem] animate-pulse shadow-xl shadow-gray-200/50" />
              ))}
            </div>
          </div>
        )}

        {/* ─── Exact Results ────────────────────────────────────────────── */}
        {!isSmartLoading && filteredExact.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full">
                <Zap size={14} className="text-orange-600" />
                <span className="text-xs font-black text-orange-700 uppercase tracking-widest">Exact Matches</span>
              </div>
              <span className="text-sm text-gray-400 font-medium">{filteredExact.length} product{filteredExact.length !== 1 ? 's' : ''} found</span>
              <span className="h-px bg-gray-200 flex-grow hidden md:block" />
            </div>
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredExact.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product as any} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        )}

        {/* ─── Related / Similar Results ────────────────────────────────── */}
        {!isSmartLoading && filteredRelated.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full">
                <Sparkles size={14} className="text-emerald-600" />
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Related Items</span>
              </div>
              <span className="text-sm text-gray-400 font-medium">You might also like these</span>
              <span className="h-px bg-gray-200 flex-grow hidden md:block" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredRelated.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </section>
        )}

        {/* ─── No Results State ─────────────────────────────────────────── */}
        {!isSmartLoading && !hasResults && query && (
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
              <SearchIcon size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Nothing found</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto font-medium">
              Couldn&apos;t find anything matching &quot;{query}&quot; {selectedCity ? `in ${selectedCity}` : 'in your area'}.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => window.history.back()} className="btn-secondary">← Try Different Search</button>
              {selectedCity && (
                <button onClick={() => setSelectedCity(undefined)} className="btn-ghost text-orange-600">Search Everywhere</button>
              )}
            </div>

            {/* Trending suggestions */}
            <div className="mt-10 space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Try searching for</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['Tomato', 'Milk', 'Rice', 'Chicken', 'Bread', 'Eggs', 'Paneer'].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
