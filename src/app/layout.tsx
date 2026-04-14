// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import JsonLd from "@/components/JsonLd";
import NextTopLoader from 'nextjs-toploader';

const outfit = Outfit({ 
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-outfit'
});

const inter = Inter({
    subsets: ["latin"],
    variable: '--font-inter'
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com'),
  title: {
    default: "Deeshora - Instant Delivery in Thiruvottriyur, Chennai",
    template: "%s | Deeshora"
  },
  description: "Shop local, get it now. Deeshora is Thiruvottriyur's favorite delivery platform connecting you with neighborhood shops for groceries, food, and essentials in minutes.",
  keywords: ["Thiruvottriyur delivery", "Chennai local shops", "instant delivery Chennai", "grocery delivery Thiruvottriyur", "Deeshora Chennai", "hyperlocal marketplace"],
  authors: [{ name: "Deeshora Team" }],
  creator: "Deeshora Inc.",
  publisher: "Deeshora Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://deeshora.com",
    title: "Deeshora - Your Local Delivery Partner in Chennai",
    description: "The fastest way to get items from your local neighborhood shops delivered in Thiruvottriyur and across North Chennai.",
    siteName: "Deeshora",
    images: [
      {
        url: "/og-main.jpg",
        width: 1200,
        height: 630,
        alt: "Deeshora - Local Commerce Platform Chennai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deeshora - Instant Delivery in Thiruvottriyur",
    description: "Your city's shops, delivered fast to your doorstep.",
    images: ["/og-main.jpg"],
    creator: "@deeshora",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body className={`${outfit.variable} ${inter.variable} font-outfit antialiased bg-gray-50 text-gray-900`}>
          <NextTopLoader color="#f97316" showSpinner={false} height={3} />
          <TRPCProvider>
            <JsonLd />
            {children}
            <Toaster 
                position="bottom-center"
                toastOptions={{
                    className: 'rounded-2xl font-bold text-sm shadow-2xl border border-gray-100',
                    duration: 4000,
                }}
            />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}