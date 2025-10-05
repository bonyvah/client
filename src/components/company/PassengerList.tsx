"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search, Plane, Mail, Phone } from "lucide-react";
import { Flight, Booking } from "@/types";
import { flightApi, bookingApi } from "@/lib/api";

interface PassengerListProps {
  airlineId?: string;
}

export function PassengerList({ airlineId }: PassengerListProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (airlineId) {
      fetchData();
    }
  }, [airlineId]);

  useEffect(() => {
    filterBookings();
  }, [selectedFlightId, searchTerm, bookings]);

  const fetchData = async () => {
    if (!airlineId) return;

    try {
      const [flightsResponse, bookingsResponse] = await Promise.all([
        flightApi.getCompanyFlights(airlineId),
        bookingApi.getCompanyBookings(airlineId),
      ]);

      if (flightsResponse.success && flightsResponse.data) {
        setFlights(flightsResponse.data);
      }
      if (bookingsResponse.success && bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by flight
    if (selectedFlightId !== "all") {
      filtered = filtered.filter((booking) => booking.flightId === selectedFlightId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((booking) =>
        booking.passengers.some(
          (passenger) =>
            `${passenger.firstName} ${passenger.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passenger.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.confirmationId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredBookings(filtered);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Passenger Management</h2>
        <p className="text-muted-foreground">View passengers booked on your flights</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flight-filter">Filter by Flight</Label>
              <Select value={selectedFlightId} onValueChange={setSelectedFlightId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flights</SelectItem>
                  {flights.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      {flight.flightNumber} - {flight.origin.code} → {flight.destination.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Passengers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or confirmation ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBookings.reduce((total, booking) => total + booking.passengers.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredBookings.reduce((total, booking) => total + booking.totalPrice, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                {bookings.length === 0
                  ? "No bookings found for your flights."
                  : "No bookings match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      {booking.flight.flightNumber}
                    </CardTitle>
                    <CardDescription>Confirmation ID: {booking.confirmationId}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    <Badge className={getPaymentStatusColor(booking.paymentStatus)}>{booking.paymentStatus}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Flight Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Route</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.flight.origin.name} ({booking.flight.origin.code}) → {booking.flight.destination.name}{" "}
                        ({booking.flight.destination.code})
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Departure</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.flight.departureTime).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <h4 className="font-medium mb-3">Passengers ({booking.passengers.length})</h4>
                    <div className="grid gap-3">
                      {booking.passengers.map((passenger, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <p className="font-medium">
                                {passenger.firstName} {passenger.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Born: {new Date(passenger.dateOfBirth).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{passenger.email}</span>
                            </div>
                            {passenger.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{passenger.phone}</span>
                              </div>
                            )}
                          </div>
                          {passenger.passportNumber && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm">
                                <span className="font-medium">Passport:</span> {passenger.passportNumber}
                                {passenger.nationality && (
                                  <span className="ml-4">
                                    <span className="font-medium">Nationality:</span> {passenger.nationality}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">${booking.totalPrice}</p>
                        <p className="text-sm text-muted-foreground">Total Price</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{booking.passengers.length}</p>
                        <p className="text-sm text-muted-foreground">Passengers</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{new Date(booking.bookedAt).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">Booked On</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
