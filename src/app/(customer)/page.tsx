// src/app/(customer)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, CheckCircle, Truck, ArrowRight, Star, MapPin, Loader2, X } from 'lucide-react';
import ProductCard from '@/components/customer/ProductCard';
import CitySelector from '@/components/customer/CitySelector';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  // Auto-redirect admins and vendors to their dashboards
  useEffect(() => {
    if (!isUserLoaded) return;
    const role = user?.publicMetadata?.role as string | undefined;
    if (role === 'ADMIN') {
      router.replace('/admin');
    } else if (role === 'VENDOR') {
      router.replace('/vendor/dashboard');
    }
  }, [user, isUserLoaded, router]);

  useEffect(() => {
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setSelectedCity(savedCity);
    setIsLoaded(true);
  }, []);

  const { data: categories, isLoading: isLoadingCats } = trpc.product.categories.useQuery();
  const { data: featuredProducts, isLoading: isLoadingFeatured } = trpc.product.list.useQuery({ 
    limit: 8, 
    featured: true,
    city: selectedCity 
  });
  const { data: allProducts, isLoading: isLoadingAll } = trpc.product.list.useQuery({ 
    limit: 12,
    city: selectedCity 
  });

  // Show spinner while checking role to prevent flash of customer page
  if (!isLoaded || !isUserLoaded) return null;
  const role = user?.publicMetadata?.role as string | undefined;
  if (role === 'ADMIN' || role === 'VENDOR') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Hero Section - Cinematic Glassmorphism */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gray-950">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/20 to-transparent blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-700">
               <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
               Empowering Local Commerce
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Hometown</span> 
              <br className="hidden sm:block" /> Marketplace.
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-white/60 font-medium leading-relaxed">
              Deeshora connects you directly with local shops in your neighborhood. 
              Get fresh groceries, daily essentials, and premium electronics delivered instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <CitySelector 
                currentCity={selectedCity} 
                onCityChange={setSelectedCity} 
              />
              <Link href="#all-products" className="btn-primary px-10 py-4 text-lg rounded-2xl shadow-orange-500/20 shadow-2xl hover:scale-105 transition-transform">
                Browse Products <ArrowRight size={20} className="ml-2" />
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

      {/* Trust Pills - Floating Card Design */}
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

      {/* Categories Section - Minimalist Icons */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Explore by Category</h2>
              <p className="text-gray-500 mt-2">Find exactly what you need in your {selectedCity || "local area"}.</p>
            </div>
            <Link href="/categories" className="text-orange-600 font-bold hover:underline flex items-center">
                See All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {isLoadingCats ? Array(8).fill(0).map((_, i) => <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-3xl" />) : 
            categories?.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="group space-y-4">
                <div className="aspect-square bg-gray-50 rounded-[2rem] p-4 flex items-center justify-center group-hover:bg-orange-600 transition-all group-hover:shadow-2xl group-hover:shadow-orange-500/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {category.image ? (
                    <Image src={category.image} alt={category.name} width={80} height={80} className="object-contain group-hover:scale-110 transition-transform group-hover:brightness-0 group-hover:invert" />
                  ) : (
                    <div className="w-20 h-20 bg-orange-100 rounded-full group-hover:bg-white/20" />
                  )}
                </div>
                <p className="text-center font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - High End Grid */}
      {(featuredProducts?.products.length || 0) > 0 && (
        <section className="bg-gray-50 py-24 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black text-gray-900 mb-12 flex items-center gap-4">
               Featured Specials
               <span className="h-px bg-gray-200 flex-grow hidden md:block" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {isLoadingFeatured ? Array(4).fill(0).map((_, i) => <div key={i} className="h-80 bg-white rounded-3xl animate-pulse" />) :
              featuredProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Feed */}
      <section id="all-products" className="py-24">
        <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <h2 className="text-3xl font-black text-gray-900">
                Fresh from <span className="text-orange-500">{selectedCity || "Local Stores"}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {Array(12).fill(0).map((_, i) => <div key={i} className="h-80 bg-gray-50 rounded-3xl animate-pulse" />)}
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
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">We're still onboarding shop owners in {selectedCity ? selectedCity : "this area"}. Check back soon!</p>
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
