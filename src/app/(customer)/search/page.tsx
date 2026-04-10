// src/app/(customer)/search/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import ProductCard from '@/components/customer/ProductCard';
import { Search as SearchIcon, Loader2, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  useEffect(() => {
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setSelectedCity(savedCity);
  }, []);

  const { data, isLoading } = trpc.product.list.useQuery({ 
    search: query,
    city: selectedCity,
    limit: 24 
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Header */}
      <section className="bg-gray-950 pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <SearchIcon size={12} /> Search Engine
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                RESULTS FOR <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8">"{query}"</span>
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                {isLoading ? "Searching neighborhood..." : `Found ${data?.products.length || 0} matching items`}
              </p>
            </div>

            <button className="h-14 px-8 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm flex items-center gap-3 hover:bg-white/10 transition-all">
                <SlidersHorizontal size={18} /> Filters
            </button>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="container mx-auto px-4 py-12 relative z-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-[2.5rem] animate-pulse shadow-xl shadow-gray-200/50" />
            ))}
          </div>
        ) : (data?.products.length || 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {data?.products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
              <SearchIcon size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Zero matches found</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto font-medium">We couldn't find anything matching "{query}" in {selectedCity || "your current area"}.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={() => window.history.back()} className="btn-secondary">Try Different Search</button>
               <button onClick={() => setSelectedCity(undefined)} className="btn-ghost text-orange-600">Search in All Areas</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
