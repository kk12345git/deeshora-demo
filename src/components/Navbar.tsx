// src/components/Navbar.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Search, ShoppingCart, Menu, Sparkles, X, LayoutDashboard, Store, Package, LogOut, UserRound, Loader2 } from 'lucide-react';
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs';
import { useCart } from '@/hooks/useCart';
import { useRouter, usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc';

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [city, setCity] = useState("Local Area");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop search state
  const [desktopQuery, setDesktopQuery] = useState('');
  const [desktopOpen, setDesktopOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Mobile search bar (inline in nav — not the menu)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const debouncedDesktop = useDebounce(desktopQuery, 250);
  const debouncedMobile  = useDebounce(mobileQuery,  250);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const savedCity = localStorage.getItem("deeshora_city");
    if (savedCity) setCity(savedCity);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile search when route changes
  useEffect(() => {
    setMobileSearchOpen(false);
    setMobileQuery('');
    setMobileOpen(false);
    setDesktopQuery('');
    setDesktopOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close suggestions on outside click — desktop
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (desktopRef.current && !desktopRef.current.contains(e.target as Node)) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close suggestions on outside click — mobile inline
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus mobile search input when it opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  // ─── tRPC typeahead queries ──────────────────────────────────────────────
  const { data: desktopSuggestions, isFetching: isDesktopFetching } = trpc.product.suggest.useQuery(
    { query: debouncedDesktop },
    { enabled: debouncedDesktop.trim().length >= 2 }
  );

  const { data: mobileSuggestions, isFetching: isMobileFetching } = trpc.product.suggest.useQuery(
    { query: debouncedMobile },
    { enabled: debouncedMobile.trim().length >= 2 }
  );

  // ─── Navigation helpers ──────────────────────────────────────────────────
  const submitSearch = useCallback((query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [router]);

  const handleDesktopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(desktopQuery);
    setDesktopOpen(false);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(mobileQuery);
    setMobileOpen(false);
    setMobileSearchOpen(false);
  };

  const handleSuggestionClick = (slug: string) => {
    router.push(`/product/${slug}`);
    setDesktopOpen(false);
    setDesktopQuery('');
    setMobileOpen(false);
    setMobileQuery('');
    setMobileSearchOpen(false);
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

        {/* ── Main Nav Row ───────────────────────────────────────────────── */}
        <nav className={`flex items-center gap-3 px-4 py-3 rounded-[2rem] border transition-all duration-500 ${
           scrolled
           ? "bg-white/85 backdrop-blur-xl border-white/40 shadow-2xl"
           : "bg-white border-transparent shadow-sm"
         }`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-10 h-10 transition-all duration-300 group-hover:scale-110">
              <Image src="/logo.jpg" alt="Deeshora" fill className="object-cover rounded-xl shadow-lg border border-gray-100" />
            </div>
            <div className="flex flex-col -space-y-1 hidden sm:flex">
              <span className="text-lg font-black text-gray-900 tracking-tighter">Deeshora</span>
              <span className="text-[9px] font-bold text-orange-500 tracking-[0.2em] uppercase">India to World</span>
            </div>
          </Link>

          {/* ── Desktop Search Bar (md+) ───────────────────────────────── */}
          <div ref={desktopRef} className="hidden md:block flex-1 max-w-lg mx-2 relative">
            <form onSubmit={handleDesktopSubmit}>
              <div className={`flex items-center bg-gray-50 border-2 rounded-[1.25rem] transition-all duration-200 ${
                desktopOpen && (desktopSuggestions?.length ?? 0) > 0
                  ? 'border-orange-400 bg-white rounded-b-none shadow-sm'
                  : 'border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:shadow-sm'
              }`}>
                {/* AI badge — subtle */}
                <div className="flex items-center gap-1 pl-3.5 flex-shrink-0">
                  <Sparkles size={13} className="text-orange-400" />
                </div>

                <input
                  ref={desktopInputRef}
                  type="text"
                  value={desktopQuery}
                  onChange={(e) => {
                    setDesktopQuery(e.target.value);
                    setDesktopOpen(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => desktopQuery.trim().length >= 2 && setDesktopOpen(true)}
                  placeholder="Search products, shops..."
                  className="flex-1 px-3 py-2.5 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none min-w-0"
                />

                {desktopQuery ? (
                  <button
                    type="button"
                    onClick={() => { setDesktopQuery(''); setDesktopOpen(false); desktopInputRef.current?.focus(); }}
                    className="px-2 text-gray-300 hover:text-gray-500 flex-shrink-0"
                  >
                    <X size={15} />
                  </button>
                ) : null}

                <button
                  type="submit"
                  className="m-1 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2 rounded-[0.875rem] transition-all shadow-md shadow-orange-500/20 flex-shrink-0"
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Desktop Suggestions Dropdown */}
            {desktopOpen && debouncedDesktop.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-orange-400 border-t-0 rounded-b-[1.25rem] shadow-2xl shadow-black/10 overflow-hidden z-50">
                {isDesktopFetching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-gray-400">
                    <Loader2 size={14} className="animate-spin text-orange-400" />
                    <span className="text-xs font-medium">Searching...</span>
                  </div>
                ) : (desktopSuggestions?.length ?? 0) > 0 ? (
                  <>
                    <div className="px-4 pt-2 pb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Results</span>
                    </div>
                    {desktopSuggestions!.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSuggestionClick(item.slug)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.images[0] ? (
                            <Image src={item.images[0]} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                              <ShoppingCart size={14} className="text-orange-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.category.name}</p>
                        </div>
                        <span className="font-black text-gray-800 text-sm flex-shrink-0">₹{item.price}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { submitSearch(desktopQuery); setDesktopOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-orange-50 border-t border-gray-100 text-xs font-bold text-orange-600 transition-colors"
                    >
                      <Search size={12} />
                      See all results for "{debouncedDesktop}"
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 text-gray-400">
                    <Search size={14} />
                    <span className="text-xs font-medium">No quick matches — press Enter</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">

            {/* City pill (desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-full">
              <MapPin size={13} className="text-orange-500" />
              <span className="max-w-[80px] truncate">{city}</span>
            </div>

            {/* Role badges (desktop) */}
            {isSignedIn && user?.publicMetadata?.role === 'ADMIN' && (
              <Link href="/admin" className="hidden md:flex items-center gap-1.5 text-xs font-black text-white bg-gray-900 hover:bg-gray-700 px-3 py-2 rounded-2xl transition-colors">
                <LayoutDashboard size={13} /> Admin
              </Link>
            )}
            {isSignedIn && user?.publicMetadata?.role === 'VENDOR' && (
              <Link href="/vendor/dashboard" className="hidden md:flex items-center gap-1.5 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-2xl transition-colors">
                <Store size={13} /> Vendor
              </Link>
            )}

            {/* Mobile Search Button (shown on small screens) */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`md:hidden w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                mobileSearchOpen ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Search"
            >
              {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-700">
              <ShoppingCart size={20} strokeWidth={2} />
              {cart.itemCount() > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-orange-600 text-white text-[9px] md:text-[10px] font-black flex items-center justify-center shadow-lg shadow-orange-500/40">
                  {cart.itemCount()}
                </span>
              )}
            </Link>

            {/* Desktop: profile + avatar */}
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-orange-500">
                  <UserRound size={19} />
                </Link>
                <div className="hidden md:block">
                  <UserButton appearance={{ elements: { userButtonAvatarBox: "h-9 w-9 border-2 border-white shadow-md rounded-xl" } }} afterSignOutUrl="/" />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
                >
                  <Menu size={22} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in" className="btn-primary py-2 px-5 rounded-2xl text-xs md:text-sm">
                  Sign In
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
                >
                  <Menu size={22} />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ── Mobile Inline Search Bar (below nav, slides in) ──────────── */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileSearchOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <div ref={mobileRef} className="relative">
            <form onSubmit={handleMobileSubmit}>
              <div className={`flex items-center bg-white border-2 rounded-[1.25rem] shadow-lg transition-all ${
                mobileOpen && (mobileSuggestions?.length ?? 0) > 0
                  ? 'border-orange-400 rounded-b-none'
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-1 pl-4 flex-shrink-0">
                  <Sparkles size={14} className="text-orange-400" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AI</span>
                </div>
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={mobileQuery}
                  onChange={(e) => {
                    setMobileQuery(e.target.value);
                    setMobileOpen(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => mobileQuery.trim().length >= 2 && setMobileOpen(true)}
                  placeholder="Search products, shops..."
                  className="flex-1 px-3 py-3.5 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none"
                />
                {mobileQuery ? (
                  <button
                    type="button"
                    onClick={() => { setMobileQuery(''); setMobileOpen(false); }}
                    className="px-2 text-gray-300 hover:text-gray-500"
                  >
                    <X size={16} />
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="m-1.5 flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-[0.875rem] transition-all shadow-md shadow-orange-500/20"
                >
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* Mobile Suggestions Dropdown */}
            {mobileOpen && debouncedMobile.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-orange-400 border-t-0 rounded-b-[1.25rem] shadow-2xl z-50 max-h-64 overflow-y-auto">
                {isMobileFetching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-gray-400">
                    <Loader2 size={14} className="animate-spin text-orange-400" />
                    <span className="text-xs font-medium">Searching...</span>
                  </div>
                ) : (mobileSuggestions?.length ?? 0) > 0 ? (
                  <>
                    {mobileSuggestions!.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSuggestionClick(item.slug)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.images[0] ? (
                            <Image src={item.images[0]} alt={item.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                              <ShoppingCart size={14} className="text-orange-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.category.name}</p>
                        </div>
                        <span className="font-black text-gray-800 text-sm">₹{item.price}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { submitSearch(mobileQuery); setMobileOpen(false); setMobileSearchOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-xs font-bold text-orange-600"
                    >
                      <Search size={12} /> See all results for "{debouncedMobile}"
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 text-gray-400">
                    <Search size={14} />
                    <span className="text-xs font-medium">No quick matches — tap Search</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Slide-Out Menu ────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 ${isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-500 flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover rounded-xl" />
              </div>
              <span className="font-black text-lg tracking-tighter">Deeshora</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <X size={18} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-2">
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

            {/* City info in menu */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Delivery Area</p>
                <p className="text-sm font-bold text-gray-900">{city}</p>
              </div>
            </div>

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
          </div>

          {isSignedIn && (
            <div className="p-6 border-t">
              <SignOutButton>
                <button className="flex items-center gap-4 p-4 w-full rounded-2xl hover:bg-red-50 text-red-500 transition-all font-bold">
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