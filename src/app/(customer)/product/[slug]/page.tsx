// src/app/(customer)/product/[id]/page.tsx
"use client";

import { trpc } from '@/lib/trpc';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { Star, Minus, Plus, AlertTriangle, CheckCircle, ChevronLeft, ShoppingCart, Share2, Heart, MapPin } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const { data: product, isLoading, error } = trpc.product.bySlug.useQuery({ slug });
  const [selectedImage, setSelectedImage] = useState(0);
  const { items, addItem, updateQuantity } = useCart();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching Product...</p>
        </div>
    </div>
  );
  
  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error.message}</div>;
  if (!product) return <div className="container mx-auto px-4 py-8 text-center">Product not found.</div>;

  const cartItem = items.find((item) => item.productId === product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = () => {
    const item: Omit<CartItem, 'quantity'> = {
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      stock: product.stock,
    };
    addItem(item);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-4 z-40 px-4">
          <div className="flex items-center justify-between p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl">
             <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl">
                <ChevronLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"><Share2 size={18} /></button>
                <button className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"><Heart size={18} /></button>
             </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery - Premium Presentation */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 group border border-gray-100">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                width={800}
                height={800}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              {discount > 0 && (
                <div className="absolute top-6 left-6 badge bg-orange-600 text-white font-black text-xs px-4 py-2 shadow-xl">
                    SAVES {discount}%
                </div>
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-orange-500 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.name} shadow-${index}`} width={100} height={100} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info - Clean Mobile Layout */}
          <div className="flex flex-col">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Link href={`/category/${product.category.slug}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                        {product.category.name}
                    </Link>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 gap-1 ml-auto">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        {product.rating.toFixed(1)} • {product.reviewCount} Reviews
                    </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tight leading-none uppercase">
                    {product.name}
                </h1>
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-1">
                    <p className="text-4xl font-black text-gray-950 tracking-tighter">₹{product.price}</p>
                    {product.mrp > product.price && (
                    <div className="flex items-center gap-2">
                        <p className="text-base text-gray-400 line-through font-medium">₹{product.mrp}</p>
                        <p className="text-xs font-bold text-emerald-600">Saved ₹{(product.mrp - product.price).toFixed(0)}</p>
                    </div>
                    )}
                </div>
                <div className="ml-auto mb-2 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                    Per {product.unit || "unit"}
                </div>
              </div>

              {/* Shop Card */}
              <div className="group card p-6 bg-white border border-gray-100 shadow-xl shadow-gray-200/20 hover:border-orange-200 transition-all cursor-pointer">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fulfillment Partner</p>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                        {product.vendor.shopName.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-gray-950 group-hover:text-orange-600 transition-colors">{product.vendor.shopName}</h4>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-orange-500" /> {product.vendor.city}
                        </p>
                    </div>
                    <Link href={`/vendor/${product.vendor.id}`} className="ml-auto w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <ChevronLeft size={20} className="rotate-180" />
                    </Link>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Product Details</h4>
                <div className="text-base text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>

              {product.stock > 0 && product.stock <= 10 && (
                <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-4 rounded-2xl border border-orange-100 animate-pulse">
                  <AlertTriangle size={20} />
                  <p className="text-sm font-bold tracking-tight">Supply Alert: Only {product.stock} units remaining!</p>
                </div>
              )}

              {/* Desktop CTA */}
              <div className="hidden md:block pt-6">
                {product.stock > 0 ? (
                  cartItem ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Adjust Quantity</p>
                      <div className="flex items-center bg-white border border-gray-200 rounded-3xl p-1 w-fit shadow-lg shadow-gray-200/50">
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="w-12 h-12 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-2xl transition-all">
                          <Minus size={20} strokeWidth={3} />
                        </button>
                        <span className="w-16 text-center text-xl font-black">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="w-12 h-12 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-2xl transition-all">
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleAddToCart} className="btn-primary w-64 h-16 text-lg rounded-[2rem]">
                      ADD TO BASKET
                    </button>
                  )
                ) : (
                  <div className="h-16 w-64 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest cursor-not-allowed">
                    Sold Out
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews - Premium Layout */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter">Verified Reviews</h2>
              <p className="text-gray-500 font-medium">What your neighbors are saying about this {product.category.name.toLowerCase()}.</p>
            </div>
          </div>
          
          {product.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {product.reviews.map(review => (
                <div key={review.id} className="card p-6 bg-white border border-gray-100 flex flex-col gap-4 group hover:border-orange-500/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-orange-500 fill-current' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed italic line-clamp-4 flex-grow">"{review.comment}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden border">
                        <Image src={review.user.avatar || '/default-avatar.png'} alt={review.user.name} width={32} height={32} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-950 uppercase tracking-tight">{review.user.name}</span>
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 uppercase tracking-widest">
                            <CheckCircle size={8} /> Verified Purchase
                        </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                <Star size={32} />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Be the first to review!</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Sticky Action Bar for Mobile */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-4 animate-in slide-in-from-bottom-5 duration-500">
          <div className="p-4 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl flex items-center justify-between gap-4">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Price</p>
                  <p className="text-2xl font-black text-gray-950 tracking-tighter">₹{product.price}</p>
               </div>
               
               {product.stock > 0 ? (
                  cartItem ? (
                    <div className="flex items-center bg-gray-900 text-white rounded-[1.5rem] p-1 shadow-xl">
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all">
                            <Minus size={18} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center font-black">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                  ) : (
                    <button onClick={handleAddToCart} className="btn-primary flex-grow h-14 rounded-2xl font-black text-sm tracking-widest uppercase">
                        ADD TO CART
                    </button>
                  )
               ) : (
                   <button disabled className="btn-secondary flex-grow h-14 rounded-2xl opacity-50 cursor-not-allowed font-black uppercase tracking-widest text-xs">
                        Out of Stock
                   </button>
               )}
          </div>
      </div>
    </div>
  );
}