"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane,
  Calendar,
  Clock,
  Users,
  MapPin,
  Search,
  Download,
  CreditCard,
  Tag,
  X,
  Bell,
  BellOff,
} from "lucide-react";
import { Booking, Offer } from "@/types";
import { bookingApi, contentApi } from "@/lib/api";
import { calculateDiscount, formatPrice } from "@/lib/utils";
import { RoleBasedRedirect } from "@/components/layout/RoleBasedRedirect";
import { notificationService } from "@/lib/notifications";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchConfirmationId, setSearchConfirmationId] = useState("");
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect company managers and admins to their respective dashboards
      if (user.role === "company_manager") {
        router.replace("/company");
        return;
      }
      if (user.role === "admin") {
        router.replace("/admin");
        return;
      }

      fetchUserBookings();
      loadOffers();
      setupNotifications();
    }
  }, [isAuthenticated, user, router]);

  const setupNotifications = async () => {
    // Request notification permission
    const hasPermission = await notificationService.requestPermission();
    setNotificationPermission(hasPermission);

    // Restore any previously scheduled reminders
    notificationService.restoreScheduledReminders();
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

  const fetchUserBookings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await bookingApi.getUserBookings();
      if (response.success && response.data) {
        setBookings(response.data);
        // Setup flight reminders for all confirmed bookings
        if (notificationPermission) {
          notificationService.setupBookingReminders(response.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchByConfirmationId = async () => {
    if (!searchConfirmationId.trim()) return;

    try {
      const response = await bookingApi.getBookingByConfirmation(searchConfirmationId);
      if (response.success && response.data) {
        setSearchedBooking(response.data);
      } else {
        setSearchedBooking(null);
        alert("Booking not found");
      }
    } catch (error) {
      console.error("Failed to search booking:", error);
      alert("Error searching for booking");
    }
  };

  const handleCancelBooking = async (bookingId: string, flightDate: string) => {
    const flightDateTime = new Date(flightDate);
    const now = new Date();
    const hoursUntilFlight = (flightDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let confirmMessage = "";
    if (hoursUntilFlight < 24) {
      confirmMessage =
        "This flight departs in less than 24 hours. You will NOT receive a refund. Are you sure you want to cancel?";
    } else {
      confirmMessage = "Are you sure you want to cancel this booking? You will receive a full refund.";
    }

    if (!confirm(confirmMessage)) return;

    try {
      const response = await bookingApi.cancelBooking(bookingId);
      if (response.success) {
        alert("Booking cancelled successfully");
        // Clear any scheduled reminders for this booking
        notificationService.clearBookingReminders(bookingId);
        // Refresh bookings
        fetchUserBookings();
        // If this was a searched booking, refresh that too
        if (searchedBooking && searchedBooking.id === bookingId) {
          setSearchedBooking(null);
        }
      } else {
        alert(response.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    // Calculate discount for this booking's flight
    const discountInfo = calculateDiscount(booking.flight, offers);
    const originalPricePerPerson = booking.flight.price;
    const discountedPricePerPerson =
      discountInfo.discountAmount > 0 ? discountInfo.discountedPrice : booking.flight.price;
    const totalOriginalPrice = originalPricePerPerson * booking.passengers.length;
    const totalDiscountedPrice = discountedPricePerPerson * booking.passengers.length;
    const totalSavings = discountInfo.discountAmount * booking.passengers.length;

    return (
      <Card key={booking.id} className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                {booking.flight.flightNumber} - {booking.flight.airline.name}
              </CardTitle>
              <CardDescription>Confirmation ID: {booking.confirmationId}</CardDescription>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flight Details */}
            <div>
              <h4 className="font-semibold mb-3">Flight Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.flight.origin.city} ({booking.flight.origin.code}) → {booking.flight.destination.city} (
                    {booking.flight.destination.code})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(booking.flight.departureTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {formatDuration(booking.flight.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.passengers.length} passenger{booking.passengers.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <h4 className="font-semibold mb-3">Passengers</h4>
              <div className="space-y-2">
                {booking.passengers.map((passenger, index) => (
                  <div key={index} className="text-sm">
                    {passenger.firstName} {passenger.lastName}
                    {passenger.email && <div className="text-muted-foreground">{passenger.email}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div>
              {discountInfo.appliedOffer ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg line-through text-muted-foreground">
                      {formatPrice(totalOriginalPrice)}
                    </span>
                    <div className="flex items-center gap-1 text-green-600">
                      <Tag className="h-3 w-3" />
                      <span className="text-sm font-medium">{discountInfo.appliedOffer.title}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{formatPrice(totalDiscountedPrice)}</span>
                  <span className="text-muted-foreground ml-2">Total</span>
                  <div className="text-sm text-green-600 font-medium">You saved {formatPrice(totalSavings)}</div>
                </div>
              ) : (
                <div>
                  <span className="text-2xl font-bold">{formatPrice(booking.totalPrice)}</span>
                  <span className="text-muted-foreground ml-2">Total</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-1">Booked on {formatDateTime(booking.bookedAt)}</div>
            </div>

            {/* Cancel Button - only show for confirmed bookings */}
            {booking.status === "confirmed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBooking(booking.id, booking.flight.departureTime)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
              <p className="text-muted-foreground">Manage your flights and bookings</p>
            </div>

            {/* Notification status */}
            <div className="flex items-center gap-2 text-sm">
              {notificationPermission ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Bell className="h-4 w-4" />
                  <span>Flight reminders enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <BellOff className="h-4 w-4" />
                  <span>Flight reminders disabled</span>
                  <Button variant="outline" size="sm" onClick={setupNotifications} className="ml-2">
                    Enable
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="search">Search Booking</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>View and manage your flight reservations</CardDescription>
              </CardHeader>
            </Card>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-4">You haven't booked any flights yet.</p>
                  <Button asChild>
                    <a href="/flights">Search Flights</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Booking</CardTitle>
                <CardDescription>Find your booking using the confirmation ID</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="confirmationId">Confirmation ID</Label>
                    <Input
                      id="confirmationId"
                      placeholder="Enter confirmation ID (e.g., AVA-2025-001)"
                      value={searchConfirmationId}
                      onChange={(e) => setSearchConfirmationId(e.target.value)}
                    />
                  </div>
                  <Button onClick={searchByConfirmationId} className="mt-6">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {searchedBooking && <BookingCard booking={searchedBooking} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
