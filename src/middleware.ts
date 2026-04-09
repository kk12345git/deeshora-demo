// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";


const isProtectedRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/cart(.*)',
  '/checkout(.*)',
  '/orders(.*)',
  '/vendor/(.*)',
  '/admin/(.*)',
]);


export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});


export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};