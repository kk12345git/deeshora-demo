// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl opacity-10" />
      
      {/* Navigation */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
        >
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 border border-white/10">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4 relative z-10 pb-20">
        <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-10 space-y-2">
            <div className="inline-block bg-orange-500 text-white font-black text-2xl w-14 h-14 flex items-center justify-center rounded-[1.25rem] shadow-2xl shadow-orange-500/40 mx-auto mb-6">
              D
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Welcome Back</h1>
            <p className="text-white/40 font-medium">Continue your hyperlocal shopping journey</p>
          </div>

          <div className="glass-card shadow-2xl border-white/5 overflow-hidden">
            <div className="p-1">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none p-6",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all rounded-xl h-12 font-bold",
                    dividerLine: "bg-white/10",
                    dividerText: "text-white/40 font-bold px-4",
                    formFieldLabel: "text-white/60 font-black uppercase text-[10px] tracking-widest mb-2",
                    formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-2 focus:ring-orange-500/40 transition-all",
                    formButtonPrimary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase tracking-widest h-12 rounded-xl border-none shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-sm",
                    footerActionText: "text-white/40 font-medium",
                    footerActionLink: "text-orange-500 hover:text-orange-400 font-black transition-colors",
                    identityPreviewText: "text-white",
                    identityPreviewEditButtonIcon: "text-white/60",
                    formResendCodeLink: "text-orange-500 font-bold",
                    otpCodeFieldInput: "bg-white/5 border-white/10 text-white"
                  }
                }}
              />
            </div>
          </div>

          {/* Trust Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              Secured by Deeshora Trust Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
