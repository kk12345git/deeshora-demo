// src/components/customer/ProductCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus, Minus, ShoppingCart, Store } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';

interface ProductCardProps {
  product: any; // Using any temporarily to avoid strict Prisma types during major refactor
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
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
    <div className="card group group relative hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="block relative overflow-hidden aspect-square rounded-t-[2rem]">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            {discount > 0 && (
                <div className="badge bg-orange-600 text-white shadow-lg">
                    {discount}% OFF
                </div>
            )}
            {product.isFeatured && (
                <div className="badge bg-emerald-500 text-white shadow-lg">
                    Featured
                </div>
            )}
        </div>

        {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                <span className="badge bg-gray-900 text-white px-4 py-2">Out of Stock</span>
            </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-500 tracking-wider">
                <Store size={12} />
                {product.vendor.shopName}
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-lg">
                <Star size={10} className="text-yellow-400 fill-current" />
                <span className="text-[10px] font-bold text-gray-700">
                    {product.rating?.toFixed(1) || "5.0"}
                </span>
            </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem]">
          <Link href={`/product/${product.slug}`} className="hover:text-orange-500 transition-colors uppercase tracking-tight">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
                <p className="text-2xl font-black text-gray-950 tracking-tighter">₹{product.price}</p>
                {product.mrp > product.price && (
                    <p className="text-sm text-gray-400 line-through">₹{product.mrp}</p>
                )}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.unit || "per piece"}</p>
          </div>

          <div className="relative group-hover:scale-110 transition-transform">
            {product.stock > 0 && (
                cartItem ? (
                    <div className="flex items-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <button
                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                            className="p-2.5 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="px-1 text-sm font-black w-6 text-center">{cartItem.quantity}</span>
                        <button
                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                            className="p-2.5 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleAddToCart} 
                        className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all shadow-xl shadow-gray-950/20 active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}