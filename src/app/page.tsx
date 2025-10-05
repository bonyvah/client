import { Suspense } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { BannerSlider } from "@/components/landing/BannerSlider";
import { OffersSection } from "@/components/landing/OffersSection";
import { FlightSearchForm } from "@/components/flight/FlightSearchForm";
import { RoleBasedRedirect } from "@/components/layout/RoleBasedRedirect";

export default function Home() {
  return (
    <>
      <RoleBasedRedirect />
      <div className="space-y-12">
        {/* Hero Section with Flight Search */}
        <HeroSection>
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<div>Loading search form...</div>}>
              <FlightSearchForm />
            </Suspense>
          </div>
        </HeroSection>

        {/* Banner Slider */}
        <section className="py-8">
          <Suspense fallback={<div>Loading banners...</div>}>
            <BannerSlider />
          </Suspense>
        </section>

        {/* Highlighted Offers */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Special Offers</h2>
            <Suspense fallback={<div>Loading offers...</div>}>
              <OffersSection />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
