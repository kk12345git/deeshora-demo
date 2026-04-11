// src/components/customer/OnboardingModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { X, User, Phone, MapPin, CheckCircle, AlertTriangle, Loader2, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { THIRUVOTTRIYUR_LOCALITIES, COMING_SOON_AREAS, isAreaServiceable } from '@/lib/areas';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'intro' | 'details' | 'location' | 'success' | 'unavailable';

export default function OnboardingModal({ isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState<Step>('intro');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    pincode: '',
    landmark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill name when Clerk user data loads
  useEffect(() => {
    if (clerkUser?.fullName && !formData.name) {
      setFormData(prev => ({ ...prev, name: clerkUser.fullName ?? '' }));
    }
  }, [clerkUser?.fullName]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) setStep('intro');
  }, [isOpen]);

  const utils = trpc.useUtils();
  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: (data) => {
      utils.user.canOrder.invalidate();
      utils.user.me.invalidate();
      if (data.isServiceable) {
        setStep('success');
      } else {
        setStep('unavailable');
      }
    },
  });

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name';
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    completeOnboarding.mutate(formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Auto fill pincode when area is selected
  const selectLocality = (value: string, pincode?: string) => {
    setFormData(prev => ({
      ...prev,
      area: value,
      pincode: pincode ?? prev.pincode,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-md"
        onClick={step !== 'success' ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">

        {/* Decorative gradient header strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500" />

        {/* Close Button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* ─── STEP: Intro ──────────────────────────────────────────── */}
        {step === 'intro' && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <Sparkles size={36} className="text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle size={16} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Almost there!</h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                We just need a couple of quick details to deliver to your door. Takes less than a minute!
              </p>
            </div>

            {/* Coverage badge */}
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Now Delivering In</p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">Thiruvottriyur &amp; 12 localities, Chennai</p>
                <p className="text-xs text-emerald-600 mt-0.5">More areas coming soon ✨</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setStep('details')}
                className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2"
              >
                Let's Go <ChevronRight size={18} />
              </button>
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Maybe later (browse only)
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Contact Details ─────────────────────────────────── */}
        {step === 'details' && (
          <div className="p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-500">Step 1 of 2</p>
              </div>
              <h2 className="text-xl font-black text-gray-900 mt-2">Your Contact Info</h2>
              <p className="text-gray-500 text-sm">Required to deliver your order.</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm font-medium border-2 outline-none transition-all focus:bg-white focus:border-orange-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-transparent'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500">Mobile Number *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-xs font-black text-gray-400 border-r border-gray-200 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className={`w-full pl-20 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm font-medium border-2 outline-none transition-all focus:bg-white focus:border-orange-500 ${errors.phone ? 'border-red-400 bg-red-50' : 'border-transparent'}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
            </div>

            <button
              onClick={() => {
                if (!validate()) return;
                setStep('location');
              }}
              className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ─── STEP: Location ────────────────────────────────────────── */}
        {step === 'location' && (
          <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-500">Step 2 of 2</p>
              </div>
              <h2 className="text-xl font-black text-gray-900 mt-2">Where do you live?</h2>
              <p className="text-gray-500 text-sm">Select your locality for accurate delivery.</p>
            </div>

            {/* ── Thiruvottriyur Localities ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  ✅ Delivering Now
                </span>
                <span className="text-xs font-bold text-gray-700">Thiruvottriyur, Chennai</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {THIRUVOTTRIYUR_LOCALITIES.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => selectLocality(loc.value, loc.pincode)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-0.5 ${
                      formData.area === loc.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-gray-800 leading-tight">{loc.label}</span>
                      {formData.area === loc.value && (
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    {loc.pincode && (
                      <span className="text-[10px] text-gray-400 font-medium">{loc.pincode}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Coming Soon Areas ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={9} /> Coming Soon
                </span>
                <span className="text-xs font-bold text-gray-500">Expanding to more Chennai areas</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COMING_SOON_AREAS.map((loc) => (
                  <div
                    key={loc.value}
                    className="p-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 opacity-70 cursor-not-allowed"
                  >
                    <span className="text-xs font-bold text-gray-500">{loc.label}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Coming soon</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional pincode + landmark (shown when a locality is selected) */}
            {formData.area && isAreaServiceable(formData.area) && (
              <div className="space-y-3 animate-in fade-in duration-300 border-t pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Fine-tune your location (optional)</p>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Pincode (auto-filled)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => updateField('landmark', e.target.value)}
                  placeholder="Landmark (e.g. near temple, bus stop)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={completeOnboarding.isPending || !formData.area}
                className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {completeOnboarding.isPending ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  'Confirm & Continue'
                )}
              </button>
              <button
                onClick={() => {
                  // Allow skip — saves profile but without confirmed area
                  completeOnboarding.mutate({ ...formData, area: formData.area || 'Not set' });
                }}
                disabled={completeOnboarding.isPending}
                className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now (browse only)
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Success ─────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in duration-500">
                <CheckCircle size={44} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">You're all set! 🎉</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Welcome to Deeshora, {formData.name.split(' ')[0]}! You can now order from local shops in{' '}
                <span className="font-bold text-orange-600">{formData.area}</span>.
              </p>
            </div>
            <button
              onClick={onSuccess}
              className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase"
            >
              Start Shopping!
            </button>
          </div>
        )}

        {/* ─── STEP: Outside Serviceable Area ────────────────────────── */}
        {step === 'unavailable' && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-100 flex items-center justify-center">
              <AlertTriangle size={36} className="text-orange-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Not Available Yet</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                We're currently delivering in <span className="font-bold text-orange-600">Thiruvottriyur &amp; nearby areas, Chennai</span>.
                You can still browse our products — we're expanding soon!
              </p>
            </div>
            <div className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs font-black text-orange-700 uppercase tracking-wider">Coming to your area soon:</p>
              {COMING_SOON_AREAS.map(a => (
                <p key={a.value} className="text-xs text-orange-600 font-medium">• {a.label}</p>
              ))}
            </div>
            <div className="space-y-3 w-full">
              <button
                onClick={onClose}
                className="btn-primary w-full h-12 rounded-2xl font-black text-sm uppercase"
              >
                Browse Products
              </button>
              <p className="text-xs text-gray-400">We're expanding soon — stay tuned!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
