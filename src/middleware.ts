// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "ta"],
  defaultLocale: "en",
});

const isProtectedRoute = createRouteMatcher([
  "/(en|ta)/onboarding(.*)",
  "/(en|ta)/cart(.*)",
  "/(en|ta)/checkout(.*)",
  "/(en|ta)/orders(.*)",
  "/(en|ta)/vendor/(.*)",
  "/(en|ta)/admin/(.*)",
  "/(en|ta)/delivery/(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // E2E Test bypass: If secret matches, bypass Clerk auth check
  const e2eSecret = req.headers.get("x-e2e-secret") || req.cookies.get("x-e2e-secret")?.value;
  const isE2E = e2eSecret && e2eSecret === process.env.CRON_SECRET;

  if (isProtectedRoute(req) && !isE2E) {
    auth().protect();
  }

  // HACK: Skip next-intl for API and tRPC routes to prevent HTML redirects on JSON requests
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/trpc")
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json|ico)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
