"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tag, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Offer } from "@/types";
import { contentApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function OffersSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await contentApi.getOffers();
        if (response.success && response.data) {
          setOffers(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleBookNow = (offer: Offer) => {
    // Navigate to flights page with offer parameters
    router.push(`/flights?offer=${offer.id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No special offers available</h3>
        <p className="text-muted-foreground">Check back later for amazing deals!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map((offer) => (
        <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Offer Image Placeholder */}
          <div className="h-48 bg-gradient-to-br from-orange-400 to-pink-500 relative flex items-center justify-center">
            <div className="text-center text-white">
              <Tag className="h-12 w-12 mx-auto mb-2" />
              <div className="text-3xl font-bold">{offer.discount}% OFF</div>
            </div>
          </div>

          {/* Offer Content */}
          <CardHeader>
            <CardTitle className="text-xl">{offer.title}</CardTitle>
            <CardDescription>{offer.description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Validity Period */}
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Valid: {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
              </span>
            </div>

            {/* Discount Badge */}
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Tag className="h-3 w-3 mr-1" />
              {offer.discount}% Discount
            </Badge>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={() => handleBookNow(offer)}>
              <span>Book Now</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
