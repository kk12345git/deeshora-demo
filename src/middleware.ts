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
  
  // HACK: Skip next-intl for API and tRPC routes to prevent HTML redirects on JSON requests
  if (req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/trpc')) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};