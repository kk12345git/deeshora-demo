// src/app/(customer)/vendor/[id]/VendorProfileClient.tsx
"use client";

import { 
  Loader2, Star, MapPin, Calendar, ShoppingBag, 
  MessageCircle, Share2, ChevronLeft, CheckCircle2,
  Info, ShieldCheck, Search
} from 'lucide-react';
import ProductCard from '@/components/customer/ProductCard';
import Image from 'next/image';
import { useState } from 'react';
import { getWhatsAppUrl, WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/JsonLd';

interface VendorProfileClientProps {
  vendor: any;
}

export default function VendorProfileClient({ vendor }: VendorProfileClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = vendor.products.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vendor.shopName,
        text: `Check out ${vendor.shopName} on Deeshora!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const memberSince = new Date(vendor.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const storeSchema = {
    "name": vendor.shopName,
    "description": vendor.description || `Verified local shop in ${vendor.city} on Deeshora.`,
    "url": `${process.env.NEXT_PUBLIC_APP_URL}/vendor/${vendor.id}`,
    "image": vendor.logo || vendor.coverImage,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": vendor.city,
      "addressRegion": "Tamil Nadu",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 13.1610, // Approximate for Thiruvottriyur
      "longitude": 80.3015
    },
    "openingHours": "Mo-Su 09:00-21:00",
    "telephone": vendor.phone
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <JsonLd type="Store" data={storeSchema} />
      
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {vendor.coverImage ? (
          <Image src={vendor.coverImage} alt={vendor.shopName} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Floating Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/30 transition-all z-10"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Identity Card Overlay */}
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <Breadcrumbs items={[
          { label: 'Marketplace', href: '/' },
          { label: vendor.shopName, href: `/vendor/${vendor.id}`, active: true }
        ]} />

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-6 md:p-10 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            {/* Logo */}
            <div className="relative shrink-0">
               <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] p-1.5 shadow-xl -mt-20 md:-mt-24">
                  <div className="w-full h-full bg-orange-500 rounded-[2rem] overflow-hidden flex items-center justify-center text-white text-5xl font-black relative">
                     {vendor.logo ? (
                        <Image src={vendor.logo} alt={vendor.shopName} fill className="object-cover" />
                     ) : (
                        vendor.shopName.charAt(0)
                     )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                     <ShieldCheck size={20} />
                  </div>
               </div>
            </div>

            {/* Title & Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
               <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                    {vendor.shopName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                    <CheckCircle2 size={12} /> Verified Shop
                  </span>
               </div>
               
               <p className="text-gray-500 font-medium text-lg lg:max-w-xl line-clamp-2">
                 {vendor.description || "One of Deeshora's most trusted fulfillment partners in Thiruvottriyur."}
               </p>

               <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <MapPin size={14} className="text-orange-500" /> {vendor.city}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <ShoppingBag size={14} className="text-orange-500" /> {vendor.category}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <Calendar size={14} className="text-orange-500" /> Since {memberSince}
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 shrink-0">
               <a 
                 href={getWhatsAppUrl(vendor.phone, WHATSAPP_TEMPLATES.GENERAL_INQUIRY(vendor.shopName))}
                 target="_blank"
                 className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-90"
               >
                 <MessageCircle size={24} />
               </a>
               <button 
                 onClick={handleShare}
                 className="w-14 h-14 bg-gray-950 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-950/20 hover:bg-gray-800 transition-all active:scale-90"
               >
                 <Share2 size={24} />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Products & Filter */}
          <div className="flex-1 space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Available Products</h2>
                   <p className="text-gray-400 font-bold text-sm">{filteredProducts.length} items currently in stock</p>
                </div>

                <div className="relative group min-w-[300px]">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                   <input 
                     type="text" 
                     placeholder="Search this shop..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all shadow-sm"
                   />
                </div>
             </div>

             {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {filteredProducts.map((product: any) => (
                    <ProductCard key={product.id} product={{...product, vendor}} />
                  ))}
                </div>
             ) : (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                   <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                      <ShoppingBag size={40} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 uppercase">No Matches Found</h3>
                   <p className="text-gray-400 font-bold mt-2">Try searching for something else or browse categories.</p>
                </div>
             )}
          </div>

          {/* Right: Sidebar Info */}
          <div className="lg:w-80 space-y-8">
             {/* Rating Overview */}
             <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Store Rating</p>
                <div className="text-center">
                   <div className="text-5xl font-black text-gray-900 tracking-tighter mb-2">5.0</div>
                   <div className="flex justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => <Star key={i} size={20} className="text-yellow-400 fill-current" />)}
                   </div>
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Based on 124 neighbors</p>
                </div>

                <div className="mt-8 space-y-3">
                   {[
                     { label: 'Quality Items', pct: '100%', color: 'bg-emerald-500' },
                     { label: 'Fast Response', pct: '98%', color: 'bg-blue-500' },
                     { label: 'Secure Packing', pct: '100%', color: 'bg-orange-500' },
                   ].map(stat => (
                      <div key={stat.label}>
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                            <span className="text-gray-400">{stat.label}</span>
                            <span className="text-gray-900">{stat.pct}</span>
                         </div>
                         <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.color} rounded-full`} style={{ width: stat.pct }} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Policies */}
             <div className="bg-orange-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <h3 className="text-lg font-black uppercase tracking-tight mb-4 relative z-10">Freshness Promise</h3>
                <p className="text-orange-100 font-medium text-sm leading-relaxed mb-6 relative z-10">
                  Every item from {vendor.shopName} undergoes strict quality checks before it arrives at your doorstep. We guarantee local hub freshness.
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3 relative z-10">
                   <ShieldCheck className="text-orange-100" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Deeshora Certified Hub</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
