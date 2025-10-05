"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export function RoleBasedRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session?.user?.role) {
      // Define regular user routes that admins/company managers shouldn't access
      const regularUserRoutes = ["/", "/flights", "/book", "/dashboard", "/offers"];

      // Check if current path starts with any regular user route
      const isRegularUserRoute = regularUserRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      if (isRegularUserRoute) {
        switch (session.user.role) {
          case "admin":
            router.replace("/admin");
            return;
          case "company_manager":
            router.replace("/company");
            return;
          case "regular":
          default:
            // Regular users can access these routes
            return;
        }
      }
    }
  }, [session, status, router, pathname]);

  // This component doesn't render anything
  return null;
}
