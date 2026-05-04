// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ta'],
  defaultLocale: 'en'
});

const isProtectedRoute = createRouteMatcher([
  '/(en|ta)/onboarding(.*)',
  '/(en|ta)/cart(.*)',
  '/(en|ta)/checkout(.*)',
  '/(en|ta)/orders(.*)',
  '/(en|ta)/vendor/(.*)',
  '/(en|ta)/admin/(.*)',
  '/(en|ta)/delivery/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
  return intlMiddleware(req);
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ta|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};