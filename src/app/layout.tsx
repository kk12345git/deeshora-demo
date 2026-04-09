// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import JsonLd from "@/components/JsonLd";

const outfit = Outfit({ 
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: {
    default: "Deeshora - Your Local Delivery Partner",
    template: "%s | Deeshora"
  },
  description: "Hyperlocal delivery platform connecting local shops with customers. Instant delivery in minutes across India.",
  keywords: ["hyperlocal delivery", "delivery app", "local shops", "instant delivery", "grocery delivery", "deeshora"],
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
    title: "Deeshora - Your Local Delivery Partner",
    description: "The fastest way to get items from your local neighborhood shops delivered.",
    siteName: "Deeshora",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Deeshora - Local Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deeshora - Instant Local Delivery",
    description: "Your city's shops, delivered fast.",
    images: ["/twitter-image.jpg"],
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
        <body className={`${outfit.variable} font-outfit antialiased bg-gray-50 text-gray-900`}>
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