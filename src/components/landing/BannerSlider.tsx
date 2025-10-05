"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banner } from "@/types";
import { contentApi } from "@/lib/api";

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await contentApi.getBanners();
        if (response.success && response.data) {
          setBanners(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <Card className="h-64 md:h-80 animate-pulse bg-muted"></Card>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="relative">
        <Card className="relative overflow-hidden">
          {/* Banner Images */}
          <div className="relative h-64 md:h-80">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Placeholder for banner image */}
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h3 className="text-2xl md:text-4xl font-bold mb-4">{banner.title}</h3>
                    <p className="text-lg md:text-xl mb-6 opacity-90 max-w-2xl mx-auto">{banner.description}</p>
                    {banner.link && (
                      <Button variant="secondary" size="lg" asChild>
                        <Link href={banner.link}>Learn More</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          {banners.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm z-20"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm z-20"
                aria-label="Next banner"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </Card>

        {/* Dots indicator - moved outside Card */}
        {banners.length > 1 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  index === currentSlide
                    ? "bg-blue-600 border-blue-600 shadow-lg scale-110"
                    : "bg-gray-300 border-gray-400 hover:bg-gray-400 hover:scale-105"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
