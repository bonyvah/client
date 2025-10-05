"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Check if we're on company manager or admin routes
  const isCompanyRoute = pathname.startsWith("/company");
  const isAdminRoute = pathname.startsWith("/admin");
  const shouldHideRegularLayout = isCompanyRoute || isAdminRoute;

  if (shouldHideRegularLayout) {
    // For company and admin routes, just render children without regular header/footer
    return <>{children}</>;
  }

  // For regular user routes, render with header and footer
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-primary-foreground text-muted-foreground py-12 mt-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Asmanga</h3>
              <p className="text-muted-foreground">Your trusted partner for finding the best flight deals worldwide.</p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-foreground">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Search Flights
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    My Bookings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Check-in
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center">
            <p>&copy; 2025 Asmanga. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
