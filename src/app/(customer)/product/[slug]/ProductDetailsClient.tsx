"use client";

import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Minus, Plus, AlertTriangle, CheckCircle, ChevronLeft, ShoppingCart, Share2, Heart, MapPin, Loader2, Info } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/JsonLd';

interface ProductDetailsClientProps {
  product: any; // Using the serializable product from the server
}

export default function ProductDetailsClient({ product: initialProduct }: ProductDetailsClientProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const { items, addItem, updateQuantity } = useCart();
  
  // Re-fetch client-side for real-time stock/reviews if needed, 
  // but use initialProduct for immediate SEO-friendly render
  const { data: product } = trpc.product.bySlug.useQuery(
    { slug: initialProduct.slug }, 
    { initialData: initialProduct }
  );

  if (!product) return null;

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

  const productSchema = {
    "name": product.name,
    "image": product.images,
    "description": product.description.replace(/<[^>]*>?/gm, ''), // Clean HTML
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.vendor.shopName
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount
    },
    "offers": {
      "@type": "Offer",
      "url": `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.vendor.shopName
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-20"
    >
      <JsonLd type="Product" data={productSchema} />
      
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-4 z-40 px-4">
          <div className="flex items-center justify-between p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl">
             <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl">
                <ChevronLeft size={20} />
             </motion.button>
             <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"><Share2 size={18} /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"><Heart size={18} /></motion.button>
             </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <Breadcrumbs items={[
          { label: 'Categories', href: '/categories' },
          { label: product.category.name, href: `/category/${product.category.slug}` },
          { label: product.name, href: `/product/${product.slug}`, active: true }
        ]} />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mt-8">
          {/* Image Gallery */}
          <div className="space-y-6">
            <motion.div 
              layoutId="product-image"
              className="relative aspect-square w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 group border border-gray-100"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              {discount > 0 && (
                <div className="absolute top-8 left-8 badge bg-orange-600 text-white font-black text-xs px-5 py-2.5 shadow-xl rotate-[-2deg]">
                    SAVES {discount}%
                </div>
              )}
            </motion.div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img: string, index: number) => (
                <motion.button
                  key={index}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all shadow-md ${
                    selectedImage === index ? 'border-orange-500 shadow-orange-500/10' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.name} preview-${index}`} width={120} height={120} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Link href={`/category/${product.category.slug}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                        {product.category.name}
                    </Link>
                    <div className="flex items-center text-[11px] font-bold text-gray-500 gap-1.5 ml-auto bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span>{product.rating.toFixed(1)}</span>
                        <span className="text-gray-300">•</span>
                        <span>{product.reviewCount} Reviews</span>
                    </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[0.9] uppercase italic drop-shadow-sm">
                    {product.name}
                </h1>
              </div>

              <div className="flex items-end gap-4 bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/80 shadow-inner">
                <div className="space-y-1">
                    <p className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tighter">₹{product.price}</p>
                    {product.mrp > product.price && (
                    <div className="flex items-center gap-3">
                        <p className="text-lg text-gray-300 line-through font-medium">₹{product.mrp}</p>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Saved ₹{(product.mrp - product.price).toFixed(0)}</p>
                    </div>
                    )}
                </div>
                <div className="ml-auto mb-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] bg-gray-100/50 px-4 py-2 rounded-xl border border-gray-200/50">
                    Per {product.unit || "unit"}
                </div>
              </div>

              {/* Shop Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="group card p-6 bg-white border border-gray-100 shadow-2xl shadow-gray-200/40 hover:border-orange-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/10 transition-all duration-700" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Market Partner</p>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                        <span className="font-black text-2xl">{product.vendor.shopName.charAt(0)}</span>
                    </div>
                    <div>
                        <h4 className="font-black text-xl text-gray-950 group-hover:text-orange-600 transition-colors leading-tight">{product.vendor.shopName}</h4>
                        <p className="text-sm text-gray-500 font-bold flex items-center gap-1.5 mt-1">
                            <MapPin size={14} className="text-orange-500" /> {product.vendor.city}
                        </p>
                    </div>
                    <Link href={`/vendor/${product.vendor.id}`} className="ml-auto w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                        <ChevronLeft size={24} className="rotate-180" />
                    </Link>
                </div>
              </motion.div>

              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <Info size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Provenance & Details</h4>
                </div>
                <div className="text-lg text-gray-700 leading-relaxed font-medium bg-white/30 p-6 rounded-[2rem] border border-white/50" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>

              {product.stock > 0 && product.stock <= 10 && (
                <motion.div 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-4 text-orange-700 bg-orange-50/80 backdrop-blur-sm p-5 rounded-[2rem] border border-orange-100/50"
                >
                  <AlertTriangle size={24} className="text-orange-600" />
                  <p className="text-sm font-black tracking-tight uppercase italic">Inventory Alert: Only {product.stock} units remaining!</p>
                </motion.div>
              )}

              {/* Desktop CTA */}
              <div className="hidden lg:block pt-8">
                {product.stock > 0 ? (
                  cartItem ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Modify Selection</p>
                      <div className="flex items-center bg-gray-950 text-white rounded-[2.5rem] p-1.5 w-fit shadow-2xl shadow-orange-500/20">
                        <motion.button 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} 
                          className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-[2rem] transition-all"
                        >
                          <Minus size={22} strokeWidth={3} />
                        </motion.button>
                        <span className="w-20 text-center text-2xl font-black italic">{cartItem.quantity}</span>
                        <motion.button 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} 
                          className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-[2rem] transition-all"
                        >
                          <Plus size={22} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCart} 
                      className="btn-primary w-full max-w-sm h-20 text-xl rounded-[2.5rem] font-black italic tracking-wide group shadow-2xl shadow-orange-500/30"
                    >
                      ADD TO BASKET
                      <ShoppingCart className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  )
                ) : (
                  <div className="h-20 w-full max-w-sm bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-400 font-black uppercase tracking-[0.2em] cursor-not-allowed">
                    Sold Out
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter">Verified Reviews</h2>
              <p className="text-gray-500 font-medium">What your neighbors are saying about this {product.category.name.toLowerCase()}.</p>
            </div>
          </div>
          
          {product.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {product.reviews.map((review: any) => (
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
    </motion.div>
  );
}
