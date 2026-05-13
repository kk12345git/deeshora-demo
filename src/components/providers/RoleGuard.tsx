"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check if user has a role in metadata
      const role = user?.publicMetadata?.role;

      // Skip onboarding redirect for the onboarding page itself and auth pages
      const publicPaths = ["/sign-in", "/sign-up", "/onboarding"];
      const isPublicPath = publicPaths.some((path) => pathname.includes(path));

      // Check if it's the root page (with or without locale)
      const isRoot =
        pathname === "/" ||
        pathname === "/en" ||
        pathname === "/ta" ||
        pathname === "/en/" ||
        pathname === "/ta/";

      if (!role && !isPublicPath && !isRoot) {
        router.push("/onboarding");
      }
    }
  }, [isLoaded, isSignedIn, user, pathname, router]);

  return <>{children}</>;
}
