"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, MapPin, Users, CreditCard, Check, Tag } from "lucide-react";
import { Flight, Passenger, BookingForm, Offer } from "@/types";
import { flightApi, bookingApi, contentApi } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { RoleBasedRedirect } from "@/components/layout/RoleBasedRedirect";
import { calculateDiscount, formatPrice, formatTime, formatFullDate } from "@/lib/utils";

export default function BookFlightPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get("flightId");
  const passengers = parseInt(searchParams.get("passengers") || "1");

  const [flight, setFlight] = useState<Flight | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState<"details" | "payment" | "confirmation">("details");
  const [confirmationId, setConfirmationId] = useState("");

  const [passengerDetails, setPassengerDetails] = useState<Omit<Passenger, "id">[]>(
    Array.from({ length: passengers }, () => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      passportNumber: "",
      nationality: "",
    }))
  );

  useEffect(() => {
    if (flightId) {
      loadFlight();
      loadOffers();
    }
  }, [flightId]);

  const loadFlight = async () => {
    if (!flightId) return;

    setIsLoading(true);
    try {
      const response = await flightApi.getFlightById(flightId);
      if (response.success && response.data) {
        setFlight(response.data);
      }
    } catch (error) {
      console.error("Failed to load flight:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      const response = await contentApi.getOffers();
      if (response.success && response.data) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error("Failed to load offers:", error);
    }
  };

  const updatePassenger = (index: number, field: keyof Omit<Passenger, "id">, value: string) => {
    setPassengerDetails((prev) =>
      prev.map((passenger, i) => (i === index ? { ...passenger, [field]: value } : passenger))
    );
  };

  const validatePassengerDetails = () => {
    return passengerDetails.every(
      (passenger) => passenger.firstName && passenger.lastName && passenger.email && passenger.dateOfBirth
    );
  };

  const handleBooking = async () => {
    if (!flight || !validatePassengerDetails()) {
      alert("Please fill in all required passenger details");
      return;
    }

    setIsBooking(true);
    try {
      const bookingData: BookingForm = {
        flightId: flight.id,
        passengers: passengerDetails,
      };

      const response = await bookingApi.createBooking(bookingData);
      if (response.success && response.data) {
        setConfirmationId(response.data.confirmationId);
        setBookingStep("confirmation");
      } else {
        alert("Booking failed: " + (response.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Flight not found</p>
          <Button onClick={() => router.push("/flights")} className="mt-4">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  if (bookingStep === "confirmation") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your flight has been successfully booked. Please save your confirmation ID for future reference.
            </p>

            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">Confirmation ID</p>
              <p className="text-2xl font-bold">{confirmationId}</p>
            </div>

            <div className="space-y-4">
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate discount and total price
  const discountInfo = calculateDiscount(flight, offers);
  const pricePerPerson = discountInfo.discountAmount > 0 ? discountInfo.discountedPrice : flight.price;
  const totalPrice = pricePerPerson * passengers;
  const totalSavings = discountInfo.discountAmount * passengers;

  return (
    <>
      <RoleBasedRedirect />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Flight Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Plane className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{flight.airline.name}</div>
                        <div className="text-sm text-muted-foreground">{flight.flightNumber}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{flight.status}</Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Departure</div>
                      <div className="font-medium">{formatTime(flight.departureTime)}</div>
                      <div className="text-sm">{formatFullDate(flight.departureTime)}</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.origin.name} ({flight.origin.code})
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Arrival</div>
                      <div className="font-medium">{formatTime(flight.arrivalTime)}</div>
                      <div className="text-sm">{formatFullDate(flight.arrivalTime)}</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.destination.name} ({flight.destination.code})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {formatDuration(flight.duration)}</span>
                    </div>
                    {flight.layovers && flight.layovers.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {flight.layovers.length} stop{flight.layovers.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Details Form */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Passenger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {passengerDetails.map((passenger, index) => (
                    <div key={index} className="space-y-4">
                      <h3 className="font-medium">Passenger {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                          <Input
                            id={`firstName-${index}`}
                            value={passenger.firstName}
                            onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                          <Input
                            id={`lastName-${index}`}
                            value={passenger.lastName}
                            onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email-${index}`}>Email *</Label>
                          <Input
                            id={`email-${index}`}
                            type="email"
                            value={passenger.email}
                            onChange={(e) => updatePassenger(index, "email", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`phone-${index}`}>Phone</Label>
                          <Input
                            id={`phone-${index}`}
                            type="tel"
                            value={passenger.phone}
                            onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`dateOfBirth-${index}`}>Date of Birth *</Label>
                          <Input
                            id={`dateOfBirth-${index}`}
                            type="date"
                            value={passenger.dateOfBirth}
                            onChange={(e) => updatePassenger(index, "dateOfBirth", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`passportNumber-${index}`}>Passport Number</Label>
                          <Input
                            id={`passportNumber-${index}`}
                            value={passenger.passportNumber}
                            onChange={(e) => updatePassenger(index, "passportNumber", e.target.value)}
                          />
                        </div>
                      </div>
                      {index < passengerDetails.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Flight Price (per person)</span>
                    <div className="text-right">
                      {discountInfo.discountAmount > 0 ? (
                        <>
                          <div className="text-md ">{formatPrice(flight.price)}</div>
                        </>
                      ) : (
                        <span>{formatPrice(flight.price)}</span>
                      )}
                    </div>
                  </div>

                  {discountInfo.appliedOffer && (
                    <div className="flex justify-between text-green-600">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span className="text-sm">{discountInfo.appliedOffer.title}</span>
                      </div>
                      <span className="text-sm">-{formatPrice(discountInfo.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Passengers</span>
                    <span>{passengers}</span>
                  </div>

                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{flight.availableSeats} seats available</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleBooking}
                    disabled={isBooking || !validatePassengerDetails()}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isBooking ? "Processing..." : `Book Flight - ${formatPrice(totalPrice)}`}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By clicking "Book Flight", you agree to our terms and conditions. This is a demo booking - no actual
                    payment will be processed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
