"use client";

import { trpc } from '@/lib/trpc';
import { Link } from '@/navigation';
import Image from 'next/image';
import { Users, ArrowRight, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommunitiesPage() {
  const { data, isLoading } = trpc.community.list.useQuery({});

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 pt-12 pb-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-widest mb-6">
            <Users size={14} />
            Community Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Connect with your <span className="text-orange-500">Local Creators</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-500 text-lg">
            Join exclusive communities built by your favorite local shops. Get early access to products, updates, and more.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="container mx-auto px-4 -mt-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Communities...</p>
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.items.map((community, i) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group card bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border-none"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={community.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
                    alt={community.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden bg-white">
                        {community.vendor.logo ? (
                          <Image src={community.vendor.logo} alt={community.vendor.shopName} width={40} height={40} />
                        ) : (
                          <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-500 font-black">
                            {community.vendor.shopName[0]}
                          </div>
                        )}
                      </div>
                      <div className="text-white">
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{community.vendor.shopName}</p>
                        <p className="text-sm font-black flex items-center gap-1">
                          {community.name}
                          <ShieldCheck size={14} className="text-blue-400" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6">
                    {community.description || 'Welcome to our exclusive community! Join us for updates and special offers.'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-gray-900">{community._count.members}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Members</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-gray-900">12</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Posts</span>
                        </div>
                    </div>

                    <Link 
                        href={`/communities/${community.id}`}
                        className="btn-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:scale-105"
                    >
                        Explore <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">No communities yet</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">Communities are being set up by local shops. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
