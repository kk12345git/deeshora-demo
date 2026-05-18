// src/components/customer/OnboardingModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Briefcase,
  GraduationCap,
  Home,
  Check,
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

  // 3D Card Tilt State variables
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch screens on mount to safely bypass 3D mouse tilt computations
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // Track cursor movement on card for dynamic 3D parallax tilt (only on desktop pointers)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return; // Touch screen safe check
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Limit maximum tilt to a refined 8 degrees
    const rotateX = -(y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Pre-fill name when Clerk user data loads
  useEffect(() => {
    if (clerkUser?.fullName && !formData.name) {
      setFormData((prev) => ({ ...prev, name: clerkUser.fullName ?? "" }));
    }
  }, [clerkUser?.fullName, formData.name]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("intro");
      setRotate({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Fetch live areas from DB
  const { data: allAreas = [] } = trpc.admin.getServiceAreas.useQuery();
  const liveAreas = allAreas.filter((a: ServiceArea) => a.isServiceable);

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-x-hidden overflow-y-auto">
      {/* Dynamic styles tag to ensure animations run cleanly */}
      <style>{`
        @keyframes float3d {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.15); }
        }
        .animate-float3d {
          animation: float3d 5s ease-in-out infinite;
        }
        .animate-glowPulse {
          animation: glowPulse 8s ease-in-out infinite;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .perspective-container {
          perspective: 1200px;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl transition-opacity duration-500"
        onClick={step !== "success" ? onClose : undefined}
      />

      {/* 3D Glowing Ambient backlights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-500/30 blur-[100px] pointer-events-none animate-glowPulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-rose-500/25 blur-[120px] pointer-events-none animate-glowPulse" style={{ animationDelay: "2s" }} />

      {/* Perspective Container */}
      <div className="relative z-10 w-full sm:max-w-xl p-4 sm:p-0 perspective-container">
        {/* Interactive 3D Modal Card Wrapper - responsive scroll limits */}
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: isTouchDevice ? undefined : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transition: isHovered
              ? "none"
              : "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          className="preserve-3d relative w-full max-h-[92vh] sm:max-h-none overflow-y-auto sm:overflow-visible bg-white/70 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/50 shadow-[0_30px_70px_rgba(0,0,0,0.3)]"
        >
          {/* Glass highlight glare border strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-rose-500" />

          {/* Close Button */}
          {step !== "success" && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100/80 hover:bg-gray-200/80 text-gray-500 hover:text-gray-900 rounded-2xl flex items-center justify-center transition-all z-20 shadow-md shadow-black/5 hover:scale-105 active:scale-95"
            >
              <X size={18} />
            </button>
          )}

          {/* 3D Transitions prism deck wrapper - responsive paddings */}
          <div className="relative w-full transition-all duration-500 ease-out p-5 sm:p-8">
            
            {/* ─── STEP: Intro ──────────────────────────────────────────── */}
            {step === "intro" && (
              <div className="flex flex-col items-center text-center gap-5 sm:gap-6 animate-in fade-in zoom-in-95 duration-500 preserve-3d">
                
                {/* Responsive 3D Floating Isometric Scene */}
                <div className="relative w-44 h-36 sm:w-52 sm:h-44 flex items-center justify-center preserve-3d animate-float3d mt-2 sm:mt-4">
                  {/* Layer -40px: Glowing Neon Blur Sphere */}
                  <div className="absolute w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br from-brand-400 to-rose-500 rounded-full opacity-35 blur-2xl [transform:translateZ(-40px)]" />

                  {/* Layer -20px: Dynamic Wireframe Grid Pattern */}
                  <div className="absolute w-32 h-32 sm:w-40 sm:h-40 border-2 border-dashed border-brand-200/40 rounded-full animate-[spin_25s_linear_infinite] [transform:translateZ(-20px)]" />

                  {/* Layer 10px: Central Glassmorphic Hexagon panel */}
                  <div className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex items-center justify-center [transform:translateZ(10px)] preserve-3d">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-brand-500 to-rose-500 flex items-center justify-center shadow-lg shadow-brand-500/20 [transform:translateZ(15px)] animate-pulse">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>

                  {/* Layer 35px: Foreground Parallax Element 1 (Star Coin) */}
                  <div className="absolute top-2 right-4 w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg [transform:translateZ(35px)] animate-[bounce_3s_ease-in-out_infinite]">
                    <span className="text-lg sm:text-xl">✨</span>
                  </div>

                  {/* Layer 45px: Foreground Parallax Element 2 (Location Pin) */}
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center shadow-lg [transform:translateZ(45px)] animate-[bounce_4s_ease-in-out_infinite_delay-1000]">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  {/* Layer 30px: Foreground Parallax Element 3 (Basket Badge) */}
                  <div className="absolute bottom-0 right-6 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 bg-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg [transform:translateZ(30px)] animate-[bounce_3.5s_ease-in-out_infinite]">
                    <span className="text-base sm:text-lg">🛒</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 preserve-3d [transform:translateZ(15px)]">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Welcome to Deeshora!
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                    North Chennai&apos;s own Daily 1Mart. Let&apos;s build your profile to start delivering fresh items!
                  </p>
                </div>

                {/* Local Area coverage banner */}
                <div className="w-full bg-emerald-50/70 border border-emerald-200/60 rounded-3xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 text-left shadow-sm shadow-emerald-500/5 preserve-3d [transform:translateZ(10px)]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                      Now Active &amp; Delivering
                    </p>
                    <p className="text-xs sm:text-sm font-black text-emerald-950 mt-1 leading-snug">
                      Thiruvottriyur &amp; {liveAreas.length} localities
                    </p>
                    <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 font-bold">
                      Direct-from-store delivery in minutes 🚀
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full preserve-3d [transform:translateZ(20px)] mt-1 sm:mt-2">
                  <button
                    onClick={() => setStep("details")}
                    className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-rose-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Start Onboarding <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors py-1"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP: Contact & Profile Details ──────────────────────── */}
            {step === "details" && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-12 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                        Step 1 of 2
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
                      Personal Information
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Help us tailor your shopping experience.</p>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full pl-12 pr-4 py-3 sm:py-3.5 bg-gray-50 rounded-2xl text-sm font-semibold border-2 border-transparent outline-none transition-all focus:bg-white focus:border-brand-500 ${
                        errors.name ? "border-red-400 bg-red-50/50" : "focus:border-brand-500"
                      }`}
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
                      <Phone size={18} className="text-gray-400" />
                      <span className="text-xs font-black text-gray-400 border-r border-gray-200 pr-2 leading-none">
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
                      placeholder="10-digit mobile"
                      className={`w-full pl-20 pr-4 py-3 sm:py-3.5 bg-gray-50 rounded-2xl text-sm font-semibold border-2 border-transparent outline-none transition-all focus:bg-white focus:border-brand-500 ${
                        errors.phone ? "border-red-400 bg-red-50/50" : "focus:border-brand-500"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Responsive Gender Cards */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Gender *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: "Male", label: "Male", emoji: "🧔" },
                      { value: "Female", label: "Female", emoji: "👩" },
                      { value: "Others", label: "Others", emoji: "🌈" },
                    ].map((g) => {
                      const isSelected = formData.gender === g.value;
                      return (
                        <button
                          key={g.value}
                          onClick={() => updateField("gender", g.value)}
                          className={`relative py-3 sm:py-4 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                            isSelected
                              ? "border-brand-500 bg-gradient-to-b from-brand-50/30 to-brand-50/10 scale-105 shadow-md shadow-brand-500/10"
                              : "border-gray-100 bg-gray-50 text-gray-400 hover:border-brand-200"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                          <span className="text-xl sm:text-2xl">{g.emoji}</span>
                          <span className={`text-xs font-black tracking-wide ${isSelected ? "text-brand-600" : "text-gray-500"}`}>
                            {g.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Compact Occupation Cards */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Occupation *
                  </label>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {formData.gender === "Female" ? (
                      [
                        { value: "Student", label: "Student", icon: GraduationCap },
                        { value: "Employee", label: "Working Pro", icon: Briefcase },
                        { value: "Housewife", label: "Homemaker", icon: Home },
                      ].map((occ) => {
                        const isSelected = formData.occupation === occ.value;
                        const Icon = occ.icon;
                        return (
                          <button
                            key={occ.value}
                            onClick={() => updateField("occupation", occ.value)}
                            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border-2 text-xs font-black tracking-wide transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                              isSelected
                                ? "border-brand-500 bg-brand-50/50 text-brand-600 scale-[1.03] shadow-md shadow-brand-500/5"
                                : "border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-200"
                            }`}
                          >
                            <Icon size={15} />
                            {occ.label}
                          </button>
                        );
                      })
                    ) : formData.gender === "Male" ? (
                      [
                        { value: "Student", label: "Student", icon: GraduationCap },
                        { value: "Employee", label: "Working Pro", icon: Briefcase },
                      ].map((occ) => {
                        const isSelected = formData.occupation === occ.value;
                        const Icon = occ.icon;
                        return (
                          <button
                            key={occ.value}
                            onClick={() => updateField("occupation", occ.value)}
                            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border-2 text-xs font-black tracking-wide transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                              isSelected
                                ? "border-brand-500 bg-brand-50/50 text-brand-600 scale-[1.03] shadow-md shadow-brand-500/5"
                                : "border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-200"
                            }`}
                          >
                            <Icon size={15} />
                            {occ.label}
                          </button>
                        );
                      })
                    ) : (
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-gray-400 italic mb-2 ml-1">
                          Occupation details are optional for others
                        </p>
                        <button
                          onClick={() => updateField("occupation", "Not Specified")}
                          className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border-2 text-xs font-black tracking-wide transition-all duration-300 ${
                            formData.occupation === "Not Specified"
                              ? "border-brand-500 bg-brand-50/50 text-brand-600 scale-[1.03]"
                              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-brand-200"
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

                {/* Continue button */}
                <button
                  onClick={() => {
                    if (!validate()) return;
                    setStep("location");
                  }}
                  className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-rose-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* ─── STEP: Location Area Select ───────────────────────────── */}
            {step === "location" && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-12 duration-500">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                      Step 2 of 2
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
                    Delivery Address
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">Where should we deliver your fresh orders?</p>
                </div>

                {/* Localities Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      ✅ Delivering Now
                    </span>
                    <span className="text-xs font-black text-gray-700">
                      Thiruvottriyur Region
                    </span>
                  </div>

                  {/* Scroll restricted locality chip grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[22vh] sm:max-h-[30vh] overflow-y-auto pr-1">
                    {liveAreas.map((loc: ServiceArea) => {
                      const isSelected = formData.area === loc.value;
                      return (
                        <button
                          key={loc.value}
                          onClick={() =>
                            selectLocality(loc.value, loc.pincode ?? undefined)
                          }
                          className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-1 sm:gap-1.5 relative ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/60 scale-[1.03] shadow-md shadow-emerald-500/5"
                              : "border-gray-100 bg-gray-50 hover:border-emerald-200"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                          <span className="text-xs font-black text-gray-800 leading-tight uppercase tracking-tight max-w-[80%]">
                            {loc.label}
                          </span>
                          {loc.pincode && (
                            <span className="text-[10px] text-gray-400 font-bold leading-none">
                              {loc.pincode}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pincode & Landmark Details */}
                {formData.area && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-gray-100 pt-3.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Additional details (Optional)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
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
                        className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 rounded-2xl text-sm font-semibold border-2 border-transparent outline-none focus:border-brand-500 focus:bg-white transition-all"
                      />
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => updateField("landmark", e.target.value)}
                        placeholder="Landmark"
                        className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 rounded-2xl text-sm font-semibold border-2 border-transparent outline-none focus:border-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={completeOnboarding.isPending || !formData.area}
                    className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-rose-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {completeOnboarding.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Completing...
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
                    className="w-full text-center text-[10px] font-black text-gray-400 hover:text-gray-700 uppercase tracking-widest transition-colors py-1"
                  >
                    Skip &amp; Browse
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP: Success ─────────────────────────────────────────── */}
            {step === "success" && (
              <div className="flex flex-col items-center text-center gap-5 sm:gap-6 animate-in fade-in zoom-in-95 duration-500 preserve-3d">
                {/* 3D Success scene */}
                <div className="relative w-44 h-36 sm:w-52 sm:h-44 flex items-center justify-center preserve-3d animate-float3d mt-2 sm:mt-4">
                  {/* Glowing success background */}
                  <div className="absolute w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-35 blur-2xl [transform:translateZ(-40px)]" />

                  {/* Wireframe rotating ring */}
                  <div className="absolute w-32 h-32 sm:w-40 sm:h-40 border-2 border-dashed border-emerald-300/40 rounded-full animate-[spin_20s_linear_infinite] [transform:translateZ(-20px)]" />

                  {/* Central Hexagon Panel */}
                  <div className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex items-center justify-center [transform:translateZ(10px)] preserve-3d">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 [transform:translateZ(15px)] animate-pulse">
                      <CheckCircle size={30} className="text-white" />
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute top-2 right-4 w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg [transform:translateZ(35px)] animate-[bounce_3s_ease-in-out_infinite]">
                    <span className="text-lg sm:text-xl">🎉</span>
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center shadow-lg [transform:translateZ(45px)] animate-[bounce_4s_ease-in-out_infinite_delay-1000]">
                    <span className="text-lg sm:text-xl">🛵</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 preserve-3d [transform:translateZ(15px)]">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Onboarding Complete! 🎉
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">
                    Welcome to the Deeshora family, {formData.name.split(" ")[0]}! We have configured your local store routes.
                  </p>
                </div>

                <button
                  onClick={onSuccess}
                  className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  Start Shopping!
                </button>
              </div>
            )}

            {/* ─── STEP: Service Unavailable ────────────────────────────── */}
            {step === "unavailable" && (
              <div className="flex flex-col items-center text-center gap-5 sm:gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
                  <AlertTriangle size={30} className="text-rose-500 animate-bounce" />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Coming Soon! 🌍
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">
                    We currently deliver in <span className="font-bold text-brand-600">Thiruvottriyur</span>. While we expand to your area, feel free to browse our products and stores!
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase bg-gray-900 text-white shadow-lg hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Browse Store
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
