// src/components/customer/OnboardingModal.tsx
'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { X, User, Phone, MapPin, CheckCircle, AlertTriangle, Loader2, ChevronRight, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICEABLE_AREA = 'Thiruvottriyur';

type Step = 'intro' | 'details' | 'location' | 'success' | 'unavailable';

export default function OnboardingModal({ isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState<Step>('intro');
  const [formData, setFormData] = useState({
    name: clerkUser?.fullName ?? '',
    phone: '',
    area: '',
    pincode: '',
    landmark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-md"
        onClick={step !== 'success' ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        
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

        {/* STEP: Intro */}
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
                We just need a couple of quick details to place your order. Takes less than a minute!
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full pt-2">
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

        {/* STEP: Contact Details */}
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
              className="btn-primary w-full h-13 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 py-4"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP: Location (optional but important) */}
        {step === 'location' && (
          <div className="p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-500">Step 2 of 2</p>
              </div>
              <h2 className="text-xl font-black text-gray-900 mt-2">Where do you live?</h2>
              <p className="text-gray-500 text-sm">We currently deliver in <span className="font-bold text-orange-600">Thiruvottriyur</span> only. Select your area.</p>
            </div>

            {/* Area selection chips */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Thiruvottriyur, Chennai', value: 'Thiruvottriyur', tag: '✅ Serviceable', color: 'border-emerald-500 bg-emerald-50' },
                { label: 'Other area in Chennai', value: 'Other Chennai', tag: '🚫 Not yet available', color: 'border-gray-200 bg-gray-50' },
                { label: 'Outside Chennai', value: 'Outside Chennai', tag: '🚫 Not yet available', color: 'border-gray-200 bg-gray-50' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField('area', opt.value)}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    formData.area === opt.value ? opt.color : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.tag}</p>
                  </div>
                  {formData.area === opt.value && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Optional pincode + landmark */}
            {formData.area === 'Thiruvottriyur' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Pincode (optional)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => updateField('landmark', e.target.value)}
                  placeholder="Landmark (optional, e.g. near bus stand)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            )}

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
                // Allow skip — but won't be able to order
                completeOnboarding.mutate({ ...formData, area: formData.area || 'Not set' });
              }}
              className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now (browse only)
            </button>
          </div>
        )}

        {/* STEP: Success */}
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
                Welcome to Deeshora, {formData.name.split(' ')[0]}! You can now order from local shops in <span className="font-bold text-orange-600">Thiruvottriyur</span>.
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

        {/* STEP: Outside Serviceable Area */}
        {step === 'unavailable' && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-100 flex items-center justify-center">
              <AlertTriangle size={36} className="text-orange-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Not Available Yet</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                We're currently only delivering in <span className="font-bold text-orange-600">Thiruvottriyur, Chennai</span>. You can still browse our products, but ordering isn't available in your area yet.
              </p>
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
