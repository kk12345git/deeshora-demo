// src/app/(customer)/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Phone, MapPin, Mail, Package, Star, Edit3, Save,
  X, CheckCircle, AlertTriangle, ChevronRight, Loader2,
  ShoppingBag, Camera,
} from 'lucide-react';
import OnboardingModal from '@/components/customer/OnboardingModal';
import { THIRUVOTTRIYUR_LOCALITIES, isAreaServiceable } from '@/lib/areas';

type EditSection = 'basic' | 'location' | null;

export default function MySpacePage() {
  const { user: clerkUser } = useUser();
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: profile, isLoading, refetch } = trpc.user.me.useQuery(undefined, {
    retry: false, // Don't retry on UNAUTHORIZED — user just needs to sign in
  });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      refetch();
      setEditSection(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Auto-open onboarding for users who haven't completed it yet
  useEffect(() => {
    if (profile && !profile.isOnboarded) {
      // Small delay so page renders first
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, [profile]);

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading your space...</p>
        </div>
      </div>
    );
  }

  // ─── NOT SIGNED IN ────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4 bg-gray-50">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 max-w-sm w-full space-y-6">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto">
            <User size={36} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Sign in to continue</h1>
            <p className="text-gray-400 text-sm mt-2">Access your profile, orders, and more.</p>
          </div>
          <Link href="/sign-in" className="btn-primary w-full text-center block">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-bold text-orange-500 hover:underline block">
            New here? Create an account →
          </Link>
        </div>
      </div>
    );
  }

  // ─── DERIVED STATE ────────────────────────────────────────────────────────
  const isServiceable = isAreaServiceable(profile.area);
  const isProfileComplete = !!profile.phone && !!profile.area;
  const completionScore = [!!profile.phone, !!profile.area, !!profile.pincode, !!profile.landmark].filter(Boolean).length;
  const completionPct = Math.round((completionScore / 4) * 100);

  const startEdit = (section: EditSection) => {
    setEditSection(section);
    setEditData({
      name: profile.name ?? '',
      phone: profile.phone ?? '',
      area: profile.area ?? '',
      pincode: profile.pincode ?? '',
      landmark: profile.landmark ?? '',
    });
  };

  const handleSave = () => {
    updateProfile.mutate(editData as Parameters<typeof updateProfile.mutate>[0]);
  };

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Onboarding Modal — auto-opens for new users */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={() => {
          setShowOnboarding(false);
          refetch();
        }}
      />

      {/* Hero Banner */}
      <div className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-12 pb-24 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                {clerkUser?.imageUrl ? (
                  <Image src={clerkUser.imageUrl} alt={profile.name} width={112} height={112} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                    <span className="text-4xl font-black text-white">{profile.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-gray-950">
                <Camera size={14} className="text-white" />
              </div>
            </div>

            {/* Name & Status */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{profile.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isServiceable ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <CheckCircle size={12} /> Thiruvottriyur Verified
                  </span>
                ) : profile.area ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                    <AlertTriangle size={12} /> Area Not Serviceable
                  </span>
                ) : (
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all"
                  >
                    <MapPin size={12} /> Set your location →
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full capitalize">
                  {profile.role.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{profile._count.orders}</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{profile._count.reviews}</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="container mx-auto px-4 -mt-6 relative z-20 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Profile Completion</p>
              <span className="text-sm font-black text-orange-500">{completionPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {!isProfileComplete && (
              <p className="text-xs text-gray-400 mt-1.5">
                {!profile.phone ? '📞 Missing phone number. ' : ''}{!profile.area ? '📍 Missing delivery area.' : ''}
              </p>
            )}
          </div>
          {completionPct < 100 && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex-shrink-0 btn-primary py-2.5 px-5 text-xs rounded-xl"
            >
              Complete →
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-4">

        {/* Save Success Toast */}
        {saveSuccess && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in slide-in-from-top duration-300">
            <CheckCircle size={20} className="text-emerald-500" />
            <p className="text-sm font-bold text-emerald-700">Profile updated successfully!</p>
          </div>
        )}

        {/* Not onboarded yet — banner prompt */}
        {!profile.isOnboarded && (
          <div className="p-5 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-orange-800 text-sm">Complete your profile to start ordering!</p>
              <p className="text-xs text-orange-600 mt-1">Add your phone number and delivery area to unlock full access.</p>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex-shrink-0 btn-primary py-2 px-4 text-xs rounded-xl"
            >
              Setup →
            </button>
          </div>
        )}

        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <User size={18} className="text-orange-500" />
              </div>
              <h2 className="font-black text-gray-900">Personal Info</h2>
            </div>
            {editSection !== 'basic' && (
              <button onClick={() => startEdit('basic')} className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>

          {editSection === 'basic' ? (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  value={editData.name ?? ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 border-r border-gray-200 pr-2">+91</span>
                  <input
                    value={editData.phone ?? ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="btn-primary flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
                <button onClick={() => setEditSection(null)} className="btn-secondary h-11 px-4 rounded-xl">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <InfoRow icon={<Mail size={15} />} label="Email" value={profile.email} />
              <InfoRow
                icon={<Phone size={15} />}
                label="Phone"
                value={profile.phone ? `+91 ${profile.phone}` : undefined}
                missing="Not added yet"
              />
            </div>
          )}
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isServiceable ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                <MapPin size={18} className={isServiceable ? 'text-emerald-500' : 'text-orange-500'} />
              </div>
              <div>
                <h2 className="font-black text-gray-900">Delivery Location</h2>
                {isServiceable && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">✅ Serviceable</p>}
              </div>
            </div>
            {editSection !== 'location' && (
              <button onClick={() => startEdit('location')} className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                <Edit3 size={14} /> {profile.area ? 'Edit' : 'Add'}
              </button>
            )}
          </div>

          {editSection === 'location' ? (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-3">Select Your Area</label>
              <div className="grid grid-cols-2 gap-2">
                  {THIRUVOTTRIYUR_LOCALITIES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEditData({ ...editData, area: opt.value, pincode: opt.pincode ?? editData.pincode })}
                      className={`p-3 rounded-xl border-2 text-left text-sm font-bold transition-all flex flex-col gap-0.5 ${
                        editData.area === opt.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-orange-200'
                      }`}
                    >
                      <span className="text-xs leading-tight">{opt.label}</span>
                      {opt.pincode && <span className="text-[10px] text-gray-400 font-normal">{opt.pincode}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={editData.pincode ?? ''}
                onChange={(e) => setEditData({ ...editData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all"
                placeholder="Pincode (e.g. 600019)"
              />
              <input
                value={editData.landmark ?? ''}
                onChange={(e) => setEditData({ ...editData, landmark: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all"
                placeholder="Landmark (optional)"
              />
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={updateProfile.isPending} className="btn-primary flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2">
                  {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
                <button onClick={() => setEditSection(null)} className="btn-secondary h-11 px-4 rounded-xl"><X size={16} /></button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <InfoRow icon={<MapPin size={15} />} label="Area" value={profile.area} missing="Not set — required for ordering" />
              <InfoRow icon={<Package size={15} />} label="Pincode" value={profile.pincode} missing="Not added" />
              <InfoRow icon={<MapPin size={15} />} label="Landmark" value={profile.landmark} missing="Not added" />
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-black text-gray-900">My Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <QuickLink href="/orders" icon={<ShoppingBag size={18} />} label="My Orders" badge={profile._count.orders > 0 ? `${profile._count.orders}` : undefined} />
            <QuickLink href="/cart" icon={<Package size={18} />} label="My Cart" />
            <QuickLink href="/" icon={<Star size={18} />} label="Featured Products" />
          </div>
        </div>

        {/* Non-serviceable Notice */}
        {profile.area && !isServiceable && (
          <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-black text-orange-800 text-sm">Delivery not available in your area</p>
              <p className="text-xs text-orange-600 mt-1">
                Deeshora currently serves <strong>Thiruvottriyur &amp; nearby localities, Chennai</strong>. Update your location above if you're in our area, or watch for us to expand soon!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components
function InfoRow({ icon, label, value, missing = 'Not provided' }: { icon: React.ReactNode; label: string; value?: string | null; missing?: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className={`text-sm font-bold truncate mt-0.5 ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
          {value || missing}
        </p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="w-9 h-9 bg-gray-50 group-hover:bg-orange-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-all flex-shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm font-bold text-gray-700">{label}</span>
      {badge && (
        <span className="text-xs font-black bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">{badge}</span>
      )}
      <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
    </Link>
  );
}
