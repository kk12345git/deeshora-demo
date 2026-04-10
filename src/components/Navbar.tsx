// src/components/Navbar.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, ShoppingCart, Menu, Sparkles, X, LayoutDashboard, Store, Package, LogOut, UserRound } from 'lucide-react';
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const cart = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [city, setCity] = useState("Local Area");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setCity(savedCity);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    if (query) {
      router.push(`/search?q=${query}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, role: "ADMIN" },
    { name: "Vendor Dashboard", href: "/vendor/dashboard", icon: Store, role: "VENDOR" },
    { name: "My Space", href: "/profile", icon: UserRound },
    { name: "My Orders", href: "/orders", icon: Package },
  ];

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      <div className={`container mx-auto px-4 transition-all duration-500 ${scrolled ? "mt-2" : "mt-4"}`}>
        <nav className={`flex items-center justify-between px-5 py-4 rounded-[2rem] border transition-all duration-500 ${
           scrolled 
           ? "bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl" 
           : "bg-white border-transparent shadow-sm"
         }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 transition-all duration-300 group-hover:scale-110">
              <Image 
                src="/logo.jpg" 
                alt="Deeshora" 
                fill 
                className="object-cover rounded-xl shadow-lg border border-gray-100" 
              />
            </div>
            <div className="flex flex-col -space-y-1 hidden sm:flex">
                <span className="text-xl font-black text-gray-900 tracking-tighter">Deeshora</span>
                <span className="text-[10px] font-bold text-orange-500 tracking-[0.2em] uppercase">India to World</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="search"
                name="q"
                placeholder="Search local shops..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-sm font-medium"
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full">
              <MapPin size={14} className="text-orange-500" />
              <span>{city}</span>
            </div>

            <Link href="/cart" className="relative w-10 md:w-11 h-10 md:h-11 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-700">
              <ShoppingCart size={20} strokeWidth={2} />
              {cart.itemCount() > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-orange-600 text-white text-[9px] md:text-[10px] font-black flex items-center justify-center shadow-lg shadow-orange-500/40">
                  {cart.itemCount()}
                </span>
              )}
            </Link>

            {isSignedIn ? (
              <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                   <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-orange-500">
                     <UserRound size={20} />
                   </Link>
                   <UserButton appearance={{ elements: { userButtonAvatarBox: "h-10 w-10 border-2 border-white shadow-md rounded-xl" } }} afterSignOutUrl="/" />
              </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
                >
                  <Menu size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <Link href="/sign-in" className="btn-primary py-2.5 px-6 rounded-2xl text-xs md:text-sm">
                   Sign In
                 </Link>
                 <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
                >
                  <Menu size={24} />
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 ${isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-500 p-8 flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between mb-12">
             <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl" />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase">Menu</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <X size={20} />
             </button>
          </div>

          <div className="space-y-6 flex-grow">
             {/* Search in Mobile Menu */}
             <form onSubmit={handleSearch} className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    name="q"
                    placeholder="Search Products..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-bold"
                />
             </form>

             <nav className="space-y-2">
                {navLinks.filter(l => !l.role || user?.publicMetadata.role === l.role).map(link => (
                    <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all font-bold group"
                    >
                        <div className="w-10 h-10 bg-gray-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center transition-colors">
                            <link.icon size={20} />
                        </div>
                        {link.name}
                    </Link>
                ))}
                
                {!isSignedIn && (
                    <Link 
                        href="/vendor/register" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Sparkles size={20} />
                        </div>
                        Partner with Us
                    </Link>
                )}
             </nav>
          </div>

          {isSignedIn && (
            <div className="pt-6 border-t">
                <SignOutButton>
                    <button className="flex items-center gap-4 p-4 w-full rounded-2xl hover:bg-red-50 text-red-600 transition-all font-bold">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <LogOut size={20} />
                        </div>
                        Sign Out
                    </button>
                </SignOutButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}