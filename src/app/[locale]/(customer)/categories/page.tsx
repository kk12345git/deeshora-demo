// src/app/(customer)/categories/page.tsx
"use client";

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LayoutGrid, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const { data: categories, isLoading } = trpc.product.categories.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cinematic Header */}
      <section className="bg-gray-950 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-6">
              <LayoutGrid size={12} /> Explore Everything
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-6">
                ALL <span className="text-orange-500">CATEGORIES</span>
            </h1>
            <p className="text-white/40 text-lg font-medium max-w-xl">
                Browse through our wide range of local products, from fresh groceries to high-end electronics.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-white rounded-[2.5rem] animate-pulse shadow-xl shadow-gray-200/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {categories?.map((category) => (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`} 
                className="group card p-6 bg-white hover:border-orange-500/20 active:scale-95 transition-all text-center"
              >
                <div className="aspect-square bg-gray-50 rounded-3xl p-6 flex items-center justify-center group-hover:bg-orange-600 transition-all mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {category.image ? (
                    <Image 
                      src={category.image} 
                      alt={category.name} 
                      width={100} 
                      height={100} 
                      className="object-contain group-hover:scale-110 transition-transform group-hover:brightness-0 group-hover:invert" 
                    />
                  ) : (
                    <div className="w-16 h-16 bg-orange-100 rounded-full group-hover:bg-white/20" />
                  )}
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                    {category.name}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    Browse <ArrowRight size={10} />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Empty State */}
      {!isLoading && categories?.length === 0 && (
        <div className="container mx-auto px-4 py-20 text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <LayoutGrid size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">No categories found</h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">We're in the middle of updating our catalog. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
