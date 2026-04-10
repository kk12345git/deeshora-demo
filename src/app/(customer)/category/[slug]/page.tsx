// src/app/(customer)/category/[slug]/page.tsx
"use client";

import { trpc } from '@/lib/trpc';
import { useParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/customer/ProductCard';
import { ChevronLeft, Filter, Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CategoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  useEffect(() => {
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setSelectedCity(savedCity);
  }, []);

  const { data, isLoading } = trpc.product.list.useQuery({ 
    categorySlug: slug,
    city: selectedCity,
    limit: 20
  });

  const { data: categories } = trpc.product.categories.useQuery();
  const category = categories?.find(c => c.slug === slug);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Dynamic Header */}
      <section className="bg-gray-950 pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">
                {category?.name || slug.replace(/-/g, ' ')}
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-sm">
                Category Exploration <span className="mx-2 text-white/10">•</span> {selectedCity || "All Regions"}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-black uppercase tracking-widest">
                    {data?.products.length || 0} Products
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-4 py-12 relative z-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array(8).fill(0).map((_, i) => (
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
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">No products found</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto font-medium">We don't have any items in this category for {selectedCity || "your area"} yet. Check back soon!</p>
            <Link href="/categories" className="btn-primary mt-8">
                Explore Other Categories
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
