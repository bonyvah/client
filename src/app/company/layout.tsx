import type { Metadata } from "next";
import { CompanyHeader } from "@/components/company/CompanyHeader";

export const metadata: Metadata = {
  title: "Company Dashboard - Asmanga",
  description: "Airline Company Management Dashboard",
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <CompanyHeader />
      <main className="w-full">{children}</main>
    </div>
  );
}
