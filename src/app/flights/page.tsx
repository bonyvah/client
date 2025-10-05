"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Clock, MapPin, Plane, Calendar, Filter, SortAsc, Users, Star, Tag } from "lucide-react";
import { Flight, FlightFilters, FlightSearchParams, Airline, Offer } from "@/types";
import { flightApi, airlineApi, contentApi } from "@/lib/api";
import { FlightSearchForm } from "@/components/flight/FlightSearchForm";
import { RoleBasedRedirect } from "@/components/layout/RoleBasedRedirect";
import { calculateDiscount, formatPrice, formatTime, formatDate } from "@/lib/utils";

export default function FlightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price");

  const [filters, setFilters] = useState<FlightFilters>({
    priceRange: { min: 0, max: 2000 },
    airlines: [],
    maxStops: undefined,
    duration: { max: 1440 }, // 24 hours in minutes
  });

  const [searchCriteria, setSearchCriteria] = useState<FlightSearchParams>({
    origin: searchParams.get("origin") || "",
    destination: searchParams.get("destination") || "",
    departureDate: searchParams.get("departureDate") || "",
    returnDate: searchParams.get("returnDate") || "",
    passengers: parseInt(searchParams.get("passengers") || "1"),
    tripType: (searchParams.get("tripType") as "one-way" | "round-trip") || "one-way",
  });

  // Check if user came from a specific offer
  const selectedOfferId = searchParams.get("offer");
  const [highlightedOffer, setHighlightedOffer] = useState<string | null>(selectedOfferId);

  useEffect(() => {
    loadAirlines();
    loadOffers();
  }, []);

  useEffect(() => {
    if (searchCriteria.origin && searchCriteria.destination && searchCriteria.departureDate) {
      searchFlights();
    }
  }, [searchCriteria]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [flights, filters, sortBy]);

  const handleSearch = (newSearchParams: FlightSearchParams) => {
    setSearchCriteria(newSearchParams);
  };

  const loadAirlines = async () => {
    try {
      const response = await airlineApi.getAllAirlines();
      if (response.success && response.data) {
        setAirlines(response.data);
      }
    } catch (error) {
      console.error("Failed to load airlines:", error);
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

  const searchFlights = async () => {
    setIsLoading(true);
    try {
      const response = await flightApi.searchFlights(searchCriteria, filters);
      if (response.success && response.data) {
        setFlights(response.data);
      }
    } catch (error) {
      console.error("Failed to search flights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...flights];

    // Apply filters
    if (filters.priceRange) {
      filtered = filtered.filter(
        (flight) => flight.price >= filters.priceRange!.min && flight.price <= filters.priceRange!.max
      );
    }

    if (filters.airlines && filters.airlines.length > 0) {
      filtered = filtered.filter((flight) => filters.airlines!.includes(flight.airlineId));
    }

    if (filters.maxStops !== undefined) {
      filtered = filtered.filter((flight) => (flight.layovers?.length || 0) <= filters.maxStops!);
    }

    if (filters.duration?.max) {
      filtered = filtered.filter((flight) => flight.duration <= filters.duration!.max);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "duration":
          return a.duration - b.duration;
        case "departure":
          return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        default:
          return 0;
      }
    });

    setFilteredFlights(filtered);
  };

  const handleSelectFlight = (flight: Flight) => {
    const queryParams = new URLSearchParams({
      flightId: flight.id,
      passengers: searchCriteria.passengers.toString(),
    });
    router.push(`/book?${queryParams.toString()}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <RoleBasedRedirect />
      <div className="space-y-8">
        {/* Search Form */}
        <div className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold mb-6">Search Flights</h1>
            <div className="max-w-4xl mx-auto">
              <FlightSearchForm onSearch={handleSearch} showCard={false} initialValues={searchCriteria} />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Slider
                      value={[filters.priceRange?.min || 0, filters.priceRange?.max || 2000]}
                      onValueChange={([min, max]) => setFilters((prev) => ({ ...prev, priceRange: { min, max } }))}
                      max={2000}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${filters.priceRange?.min || 0}</span>
                      <span>${filters.priceRange?.max || 2000}</span>
                    </div>
                  </div>

                  {/* Stops */}
                  <div className="space-y-2">
                    <Label>Stops</Label>
                    <Select
                      value={filters.maxStops?.toString() || "any"}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxStops: value === "any" ? undefined : parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any number of stops" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0">Nonstop</SelectItem>
                        <SelectItem value="1">1 stop</SelectItem>
                        <SelectItem value="2">2 stops</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Airlines */}
                  <div className="space-y-2">
                    <Label>Airlines</Label>
                    <Select
                      value={filters.airlines && filters.airlines.length > 0 ? filters.airlines[0] : "any"}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          airlines: value === "any" ? [] : [value],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any airline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any airline</SelectItem>
                        {airlines.map((airline) => (
                          <SelectItem key={airline.id} value={airline.id}>
                            {airline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Max Duration</Label>
                    <Slider
                      value={[filters.duration?.max || 1440]}
                      onValueChange={([max]) => setFilters((prev) => ({ ...prev, duration: { max } }))}
                      max={1440}
                      min={60}
                      step={30}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground">
                      Up to {formatDuration(filters.duration?.max || 1440)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Offer Notice */}
              {highlightedOffer && offers.length > 0 && (
                <div className="mb-6">
                  {(() => {
                    const selectedOffer = offers.find((offer) => offer.id === highlightedOffer);
                    if (selectedOffer) {
                      return (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Tag className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-green-800">{selectedOffer.title}</h4>
                                <p className="text-sm text-green-700">{selectedOffer.description}</p>
                              </div>
                              <Badge className="bg-green-600 text-white">{selectedOffer.discount}% OFF</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Sort and Results Count */}
              <div className="flex justify-between items-center mb-6">
                <div className="text-muted-foreground">{filteredFlights.length} flights found</div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Sort by Price</SelectItem>
                    <SelectItem value="duration">Sort by Duration</SelectItem>
                    <SelectItem value="departure">Sort by Departure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flight Results */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Searching flights...</p>
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No flights found</p>
                    <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
                  </div>
                ) : (
                  filteredFlights.map((flight) => {
                    const discountInfo = calculateDiscount(flight, offers);
                    const hasDiscount = discountInfo.discountAmount > 0;

                    return (
                      <Card key={flight.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            {/* Airline and Flight Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Plane className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{flight.airline.name}</div>
                                <div className="text-sm text-muted-foreground">{flight.flightNumber}</div>
                                {hasDiscount && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {Math.round(discountInfo.discountPercentage)}% OFF
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Route and Time */}
                            <div className="md:col-span-2">
                              <div className="flex items-center justify-between">
                                <div className="text-center">
                                  <div className="text-lg font-bold">{formatTime(flight.departureTime)}</div>
                                  <div className="text-sm text-muted-foreground">{flight.origin.code}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(flight.departureTime)}
                                  </div>
                                </div>

                                <div className="flex-1 mx-4">
                                  <div className="flex items-center justify-center">
                                    <div className="flex-1 h-px bg-border"></div>
                                    <div className="mx-2 text-xs text-muted-foreground">
                                      {formatDuration(flight.duration)}
                                      {flight.layovers && flight.layovers.length > 0 && (
                                        <div>
                                          {flight.layovers.length} stop{flight.layovers.length > 1 ? "s" : ""}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 h-px bg-border"></div>
                                  </div>
                                </div>

                                <div className="text-center">
                                  <div className="text-lg font-bold">{formatTime(flight.arrivalTime)}</div>
                                  <div className="text-sm text-muted-foreground">{flight.destination.code}</div>
                                  <div className="text-xs text-muted-foreground">{formatDate(flight.arrivalTime)}</div>
                                </div>
                              </div>
                            </div>

                            {/* Price and Book */}
                            <div className="text-right">
                              <div className="space-y-2">
                                {hasDiscount ? (
                                  <>
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="text-2xl font-bold text-green-600">
                                        {formatPrice(discountInfo.discountedPrice)}
                                      </div>
                                      <div className="text-sm text-muted-foreground line-through">
                                        {formatPrice(discountInfo.originalPrice)}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-2xl font-bold">{formatPrice(flight.price)}</div>
                                )}
                              </div>
                              <Button onClick={() => handleSelectFlight(flight)} className="w-full">
                                Select Flight
                              </Button>
                              <div className="text-xs text-muted-foreground mt-1">
                                {flight.availableSeats} seats left
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
