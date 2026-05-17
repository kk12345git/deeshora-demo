// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import JsonLd from "@/components/JsonLd";
import NextTopLoader from "nextjs-toploader";
import { CartSync } from "@/components/cart/CartSync";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PageTransition from "@/components/layout/PageTransition";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import PWARegistration from "@/components/PWARegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import RoleGuard from "@/components/providers/RoleGuard";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://deeshora.in",
  ),
  title: {
    default: "Deeshora - North Chennai's Own Daily 1Mart | 1% Wallet Cashback Store",
    template: "%s | Deeshora",
  },
  description:
    "Deeshora is North Chennai's own Daily 1Mart. Shop daily essentials, groceries, and premium items with 1% instant wallet cashback credited on every purchase.",
  keywords: [
    "North Chennai mart",
    "Daily 1Mart",
    "1% cashback store",
    "daily essentials delivery",
    "Deeshora Chennai",
    "instant delivery",
  ],
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
    url: "https://deeshora.in",
    title: "Deeshora - North Chennai's Own Daily 1Mart | 1% Wallet Cashback Store",
    description:
      "Get daily essentials and premium items delivered instantly to your door with 1% wallet cashback on all orders.",
    siteName: "Deeshora",
    images: [
      {
        url: "/og-main.jpg",
        width: 1200,
        height: 630,
        alt: "Deeshora - Premium Commerce Platform Chennai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deeshora - North Chennai's Own Daily 1Mart | 1% Wallet Cashback Store",
    description: "Your daily essentials, delivered fast to your doorstep with 1% instant cashback.",
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

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // Ensure that the incoming `locale` is valid
  if (!["en", "ta"].includes(locale)) {
    notFound();
  }

  // Receiving messages provided in `i18n.ts`
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#d41d6d" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta name="apple-mobile-web-app-title" content="Deeshora" />
          <link rel="apple-touch-icon" href="/logo.jpg" />
        </head>
        <body
          className={`${plusJakartaSans.variable} ${manrope.variable} font-manrope antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}
        >
          <NextTopLoader color="#d41d6d" showSpinner={false} height={3} />
          <TRPCProvider>
            <PWARegistration />
            <PWAInstallPrompt />
            <NextIntlClientProvider messages={messages}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <CartSync />
                <RoleSwitcher />
                <JsonLd />
                <RoleGuard>
                  <PageTransition>{children}</PageTransition>
                </RoleGuard>
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    className:
                      "rounded-2xl font-bold text-sm shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white",
                    duration: 4000,
                  }}
                />
              </ThemeProvider>
            </NextIntlClientProvider>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
