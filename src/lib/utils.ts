import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Flight, Offer, DiscountedPrice } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Discount calculation utilities
export function calculateDiscount(flight: Flight, offers: Offer[]): DiscountedPrice {
  const originalPrice = flight.price;
  let bestOffer: Offer | undefined;
  let maxDiscountAmount = 0;

  // Find the best applicable offer
  for (const offer of offers) {
    if (!offer.isActive) continue;

    // Check if offer is valid (date range)
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validTo = new Date(offer.validTo);

    if (now < validFrom || now > validTo) continue;

    // Check if offer applies to this flight
    if (!isOfferApplicable(flight, offer)) continue;

    // Check minimum price requirement
    if (offer.minPrice && originalPrice < offer.minPrice) continue;

    // Calculate discount amount
    let discountAmount = (originalPrice * offer.discount) / 100;

    // Apply max discount limit if specified
    if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
      discountAmount = offer.maxDiscount;
    }

    // Keep track of the best offer
    if (discountAmount > maxDiscountAmount) {
      maxDiscountAmount = discountAmount;
      bestOffer = offer;
    }
  }

  const discountedPrice = originalPrice - maxDiscountAmount;
  const discountPercentage = maxDiscountAmount > 0 ? (maxDiscountAmount / originalPrice) * 100 : 0;

  return {
    originalPrice,
    discountedPrice,
    discountAmount: maxDiscountAmount,
    discountPercentage,
    appliedOffer: bestOffer,
  };
}

function isOfferApplicable(flight: Flight, offer: Offer): boolean {
  // Check specific flights
  if (offer.applicableFlights && offer.applicableFlights.length > 0) {
    if (!offer.applicableFlights.includes(flight.id)) {
      return false;
    }
  }

  // Check specific airlines
  if (offer.applicableAirlines && offer.applicableAirlines.length > 0) {
    if (!offer.applicableAirlines.includes(flight.airlineId)) {
      return false;
    }
  }

  // Check specific routes
  if (offer.applicableRoutes && offer.applicableRoutes.length > 0) {
    const flightRoute = { origin: flight.origin.code, destination: flight.destination.code };
    const routeMatch = offer.applicableRoutes.some(
      (route) => route.origin === flightRoute.origin && route.destination === flightRoute.destination
    );
    if (!routeMatch) {
      return false;
    }
  }

  // If no specific applicability rules are defined, offer applies to all flights
  return true;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Date formatting utilities
export function formatBackendDate(dateString: string | null | undefined): Date {
  // Handle null/undefined values
  if (!dateString) {
    return new Date(); // Return current date as fallback
  }

  // Handle backend date format that doesn't include timezone
  // Assume backend sends UTC time and append 'Z' to make it explicit
  const utcDateString = dateString.endsWith("Z") ? dateString : dateString + "Z";
  return new Date(utcDateString);
}

export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return "--:--";
  }
  return formatBackendDate(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "---";
  }
  return formatBackendDate(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatFullDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "---";
  }
  return formatBackendDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return "---";
  }
  return formatBackendDate(dateString).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
