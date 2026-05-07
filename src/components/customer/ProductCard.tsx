"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/navigation';
import { Star, Plus, Minus, ShoppingCart, Store, ShoppingBag, Sparkles, TrendingUp, X, CheckCircle2, Globe, Laptop, Users } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingModal from './OnboardingModal';

import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { ProductSummary } from '@/types';

interface ProductCardProps {
  product: ProductSummary;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isSignedIn } = useUser();
  const { items, addItem, updateQuantity } = useCart();
  const { requireOnboarding, isModalOpen, closeModal, handleOnboardingSuccess } = useOnboarding();
  const cartItem = items.find((item) => item.productId === product.id);

  const addItemMutation = trpc.cart.addItem.useMutation();
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const addToCart = async () => {
    // 1. Local Update
    const item: Omit<CartItem, 'quantity'> = {
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      stock: product.stock,
      type: product.type,
    };
    addItem(item);

    // 2. Server Update
    if (isSignedIn) {
      try {
        await addItemMutation.mutateAsync({
          productId: product.id,
          quantity: 1,
        });
      } catch (err) {
        console.error('Cart sync error:', err);
      }
    }
  };

  const handleUpdateQuantity = async (id: string, qty: number) => {
    // 1. Local Update
    updateQuantity(id, qty);

    // 2. Server Update
    if (isSignedIn) {
      try {
        await updateQuantityMutation.mutateAsync({
          productId: id,
          quantity: qty,
        });
      } catch (err) {
        console.error('Cart quantity sync error:', err);
      }
    }
  };

  const handleAddToCart = () => {
    requireOnboarding(addToCart);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] flex flex-col h-full transition-all duration-500"
    >
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => { handleOnboardingSuccess(); addToCart(); }}
      />
      
      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden block">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
            <ShoppingBag size={40} className="text-brand-200 dark:text-brand-800" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isFeatured && (
                <div className="badge bg-emerald-500 text-white shadow-lg">
                    Featured
                </div>
            )}
            {product.type === 'DIGITAL' && (
                <div className="badge bg-blue-500 text-white shadow-lg flex items-center gap-1">
                    <Laptop size={10} />
                    Digital
                </div>
            )}
            {product.type === 'COMMUNITY_ACCESS' && (
                <div className="badge bg-purple-500 text-white shadow-lg flex items-center gap-1">
                    <Users size={10} />
                    Community
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
      <div className="p-4 sm:p-6 flex flex-col flex-grow space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-500 tracking-wider">
                <Store size={12} />
                {product.vendor.shopName}
                <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10" />
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
                            onClick={() => handleUpdateQuantity(product.id, cartItem.quantity - 1)}
                            className="p-2.5 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="px-1 text-sm font-black w-6 text-center">{cartItem.quantity}</span>
                        <button
                            onClick={() => handleUpdateQuantity(product.id, cartItem.quantity + 1)}
                            className="p-2.5 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleAddToCart} 
                        className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all shadow-xl shadow-gray-950/20 active:scale-95"
                    >
                        <Plus size={20} className="sm:size-6" />
                    </button>
                )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}