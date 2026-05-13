// src/components/customer/OnboardingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";
import {
  X,
  User,
  Phone,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Sparkles,
  Clock,
  Briefcase,
} from "lucide-react";
import type { ServiceArea } from "@prisma/client";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "intro" | "details" | "location" | "success" | "unavailable";

export default function OnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: OnboardingModalProps) {
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState<Step>("intro");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    occupation: "",
    area: "",
    pincode: "",
    landmark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill name when Clerk user data loads
  useEffect(() => {
    if (clerkUser?.fullName && !formData.name) {
      setFormData((prev) => ({ ...prev, name: clerkUser.fullName ?? "" }));
    }
  }, [clerkUser?.fullName, formData.name]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) setStep("intro");
  }, [isOpen]);

  // Fetch live areas from DB
  const { data: allAreas = [] } = trpc.admin.getServiceAreas.useQuery();
  const liveAreas = allAreas.filter((a: ServiceArea) => a.isServiceable);
  const comingSoonAreas = allAreas.filter((a: ServiceArea) => !a.isServiceable);

  const utils = trpc.useUtils();
  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: (data) => {
      utils.user.canOrder.invalidate();
      utils.user.me.invalidate();
      if (data.isServiceable) {
        setStep("success");
      } else {
        setStep("unavailable");
      }
    },
  });

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your full name";
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
    }
    if (!formData.occupation) {
      newErrors.occupation = "Please select your occupation";
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
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));

    // Reset occupation if gender changes and it's not applicable
    if (field === "gender") {
      if (value === "Male" && formData.occupation === "Housewife") {
        setFormData((prev) => ({ ...prev, gender: value, occupation: "" }));
      }
    }
  };

  // Auto fill pincode when area is selected
  const selectLocality = (value: string, pincode?: string | null) => {
    setFormData((prev) => ({
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
        onClick={step !== "success" ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        {/* Decorative gradient header strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-rose-500" />

        {/* Close Button */}
        {step !== "success" && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* ─── STEP: Intro ──────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-brand-400 to-rose-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
                <Sparkles size={36} className="text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle size={16} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Welcome to Deeshora!
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                North Chennai&apos;s own online ₹1 mart. Let&apos;s set up your
                profile for a personalized experience!
              </p>
            </div>

            {/* Coverage badge */}
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                  Now Delivering In
                </p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">
                  Thiruvottriyur &amp; {liveAreas.length} localities
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Instant delivery in minutes ✨
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setStep("details")}
                className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2"
              >
                Start Onboarding <ChevronRight size={18} />
              </button>
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Contact Details ─────────────────────────────────── */}
        {step === "details" && (
          <div className="p-8 space-y-5 max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-500">
                  Step 1 of 2
                </p>
              </div>
              <h2 className="text-xl font-black text-gray-900 mt-2">
                Personal Information
              </h2>
              <p className="text-gray-500 text-sm">Help us know you better.</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Full Name *
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 outline-none transition-all focus:bg-white focus:border-brand-500 ${errors.name ? "border-red-400 bg-red-50" : "border-transparent"}`}
                />
              </div>
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold ml-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-xs font-black text-gray-400 border-r border-gray-200 pr-2">
                    +91
                  </span>
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    updateField(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="10-digit number"
                  className={`w-full pl-20 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 outline-none transition-all focus:bg-white focus:border-brand-500 ${errors.phone ? "border-red-400 bg-red-50" : "border-transparent"}`}
                />
              </div>
              {errors.phone && (
                <p className="text-[10px] text-red-500 font-bold ml-1">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Gender Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Gender *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Male", "Female", "Others"].map((g) => (
                  <button
                    key={g}
                    onClick={() => updateField("gender", g)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-black transition-all ${
                      formData.gender === g
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : "border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-[10px] text-red-500 font-bold ml-1">
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Occupation Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Occupation *
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.gender === "Female" ? (
                  ["Student", "Employee", "Housewife"].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => updateField("occupation", occ)}
                      className={`px-5 py-2.5 rounded-xl border-2 text-xs font-black transition-all ${
                        formData.occupation === occ
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200"
                      }`}
                    >
                      {occ}
                    </button>
                  ))
                ) : formData.gender === "Male" ? (
                  ["Student", "Employee"].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => updateField("occupation", occ)}
                      className={`px-5 py-2.5 rounded-xl border-2 text-xs font-black transition-all ${
                        formData.occupation === occ
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200"
                      }`}
                    >
                      {occ}
                    </button>
                  ))
                ) : (
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 italic mb-2">
                      Occupation is optional for others
                    </p>
                    <button
                      onClick={() => updateField("occupation", "Not Specified")}
                      className={`px-5 py-2.5 rounded-xl border-2 text-xs font-black transition-all ${
                        formData.occupation === "Not Specified"
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200"
                      }`}
                    >
                      Skip Occupation
                    </button>
                  </div>
                )}
              </div>
              {errors.occupation && (
                <p className="text-[10px] text-red-500 font-bold ml-1">
                  {errors.occupation}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                if (!validate()) return;
                setStep("location");
              }}
              className="btn-primary w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 mt-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ─── STEP: Location ────────────────────────────────────────── */}
        {step === "location" && (
          <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center">
                  <MapPin size={12} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-500">
                  Step 2 of 2
                </p>
              </div>
              <h2 className="text-xl font-black text-gray-900 mt-2">
                Delivery Location
              </h2>
              <p className="text-gray-500 text-sm">
                Where should we deliver your orders?
              </p>
            </div>

            {/* ── Thiruvottriyur Localities ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  ✅ Delivering Now
                </span>
                <span className="text-xs font-bold text-gray-700">
                  Thiruvottriyur Area
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {liveAreas.map((loc: ServiceArea) => (
                  <button
                    key={loc.value}
                    onClick={() =>
                      selectLocality(loc.value, loc.pincode ?? undefined)
                    }
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-0.5 ${
                      formData.area === loc.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 bg-gray-50 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-black text-gray-800 leading-tight uppercase tracking-tight">
                        {loc.label}
                      </span>
                      {formData.area === loc.value && (
                        <CheckCircle
                          size={14}
                          className="text-emerald-500 flex-shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                    {loc.pincode && (
                      <span className="text-[10px] text-gray-400 font-bold">
                        {loc.pincode}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional pincode + landmark */}
            {formData.area && (
              <div className="space-y-3 animate-in fade-in duration-300 border-t pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Additional details (Optional)
                </p>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="Pincode"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => updateField("landmark", e.target.value)}
                  placeholder="Landmark (e.g. Near Bus Stand)"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-2 border-transparent outline-none focus:border-brand-500 focus:bg-white transition-all"
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
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </button>
              <button
                onClick={() => {
                  completeOnboarding.mutate({
                    ...formData,
                    area: formData.area || "Not set",
                  });
                }}
                disabled={completeOnboarding.isPending}
                className="w-full text-center text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
              >
                Skip &amp; Browse
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Success ─────────────────────────────────────────── */}
        {step === "success" && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in duration-500">
                <CheckCircle size={44} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Profile Complete! 🎉
              </h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Welcome to the Deeshora family, {formData.name.split(" ")[0]}!
                Start exploring our ₹1 store and combo deals.
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

        {/* ─── STEP: Unavailable ──────────────────────────────────────── */}
        {step === "unavailable" && (
          <div className="p-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={36} className="text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Not Available Yet
              </h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                We&apos;re currently delivering in{" "}
                <span className="font-bold text-brand-600">Thiruvottriyur</span>
                . You can still browse our products — we&apos;re expanding soon!
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-primary w-full h-12 rounded-2xl font-black text-sm uppercase"
            >
              Browse Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
