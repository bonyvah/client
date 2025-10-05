"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FlightSearchParams, Airport } from "@/types";
import { airportApi } from "@/lib/api";

interface FlightSearchFormProps {
  onSearch?: (params: FlightSearchParams) => void;
  showCard?: boolean;
  initialValues?: Partial<FlightSearchParams>;
}

export function FlightSearchForm({ onSearch, showCard = true, initialValues }: FlightSearchFormProps) {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: initialValues?.origin || "",
    destination: initialValues?.destination || "",
    departureDate: initialValues?.departureDate || "",
    returnDate: initialValues?.returnDate || "",
    passengers: initialValues?.passengers || 1,
    tripType: initialValues?.tripType || "one-way",
  });

  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load airports when component mounts
  useEffect(() => {
    const loadAirports = async () => {
      try {
        const response = await airportApi.getAllAirports();
        if (response.success && response.data) {
          setAirports(response.data);
        } else {
          console.error("Failed to load airports:", response.error);
        }
      } catch (error) {
        console.error("Error loading airports:", error);
      }
    };

    loadAirports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
        alert("Please fill in all required fields");
        return;
      }

      // If onSearch prop is provided (from flights page), use it
      if (onSearch) {
        onSearch(searchParams);
      } else {
        // Navigate to flights page with search parameters
        const queryParams = new URLSearchParams({
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          passengers: searchParams.passengers.toString(),
          tripType: searchParams.tripType,
          ...(searchParams.returnDate && { returnDate: searchParams.returnDate }),
        });

        router.push(`/flights?${queryParams.toString()}`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSearchParams = (field: keyof FlightSearchParams, value: any) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const swapOriginDestination = () => {
    setSearchParams((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trip Type Selection */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="one-way"
            name="tripType"
            value="one-way"
            checked={searchParams.tripType === "one-way"}
            onChange={(e) => updateSearchParams("tripType", e.target.value)}
            className="border-primary text-primary focus:ring-primary"
          />
          <Label htmlFor="one-way" className="cursor-pointer">
            One Way
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="round-trip"
            name="tripType"
            value="round-trip"
            checked={searchParams.tripType === "round-trip"}
            onChange={(e) => updateSearchParams("tripType", e.target.value)}
            className="border-primary text-primary focus:ring-primary"
          />
          <Label htmlFor="round-trip" className="cursor-pointer">
            Round Trip
          </Label>
        </div>
      </div>

      {/* Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4 justify-between items-end">
        {/* Origin */}
        <div className="space-y-2 md:col-span-2 lg:col-span-2">
          <Label htmlFor="origin">From</Label>
          <Select value={searchParams.origin} onValueChange={(value) => updateSearchParams("origin", value)}>
            <SelectTrigger className="truncate">
              <div className="flex items-center w-full min-w-0">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="Select origin airport" className="truncate" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {airports.map((airport) => (
                <SelectItem key={airport.id} value={airport.code}>
                  <div className="flex flex-col">
                    <span>
                      {airport.code} - {airport.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {airport.city}, {airport.country}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Swap Button */}
        <div className="flex items-end justify-center md:col-span-1 lg:col-span-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={swapOriginDestination}
            className="mb-2 flex-shrink-0"
          >
            <ArrowLeftRight className="h-4 w-4 text-black" />
          </Button>
        </div>

        {/* Destination */}
        <div className="space-y-2 md:col-span-2 lg:col-span-2">
          <Label htmlFor="destination">To</Label>
          <Select value={searchParams.destination} onValueChange={(value) => updateSearchParams("destination", value)}>
            <SelectTrigger className="truncate">
              <div className="flex items-center w-full min-w-0">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="Select destination airport" className="truncate" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {airports
                .filter((airport) => airport.code !== searchParams.origin)
                .map((airport) => (
                  <SelectItem key={airport.id} value={airport.code}>
                    <div className="flex flex-col">
                      <span>
                        {airport.code} - {airport.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {airport.city}, {airport.country}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Second Row - Return Date and Passengers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Departure Date */}
        <div className="space-y-2 ">
          <Label htmlFor="departure">Departure</Label>
          <DatePicker
            value={searchParams.departureDate}
            onChange={(value) => updateSearchParams("departureDate", value)}
            placeholder="Select departure date"
            minDate={new Date()}
            className="w-full text-black"
          />
        </div>
        {/* Return Date (for round trips) */}
        {searchParams.tripType === "round-trip" && (
          <div className="space-y-2">
            <Label htmlFor="return">Return</Label>
            <DatePicker
              value={searchParams.returnDate || ""}
              onChange={(value) => updateSearchParams("returnDate", value)}
              placeholder="Select return date"
              minDate={searchParams.departureDate ? new Date(searchParams.departureDate) : new Date()}
              className="w-full"
            />
          </div>
        )}

        {/* Passengers */}
        <div className="space-y-2">
          <Label htmlFor="passengers">Passengers</Label>
          <Select
            value={searchParams.passengers.toString()}
            onValueChange={(value) => updateSearchParams("passengers", parseInt(value))}
          >
            <SelectTrigger>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "Passenger" : "Passengers"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-center pt-4">
        <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-amber-200 text-black sm:w-auto px-8">
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? "Searching..." : "Search Flights"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {showCard ? (
        <Card>
          <CardContent className="p-6">
            <FormContent />
          </CardContent>
        </Card>
      ) : (
        <FormContent />
      )}
    </>
  );
}
