"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Plane, Clock, MapPin } from "lucide-react";
import { Flight, Airport, FlightForm } from "@/types";
import { flightApi, airportApi } from "@/lib/api";
import { DateTimePicker } from "@/components/ui/datetime-picker";

interface FlightManagementProps {
  airlineId?: string;
}

export function FlightManagement({ airlineId }: FlightManagementProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);

  // Helper function to safely format dates
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Helper function to safely format duration
  const formatDuration = (duration: number | null | undefined) => {
    if (!duration || isNaN(duration)) {
      return "0h 0m";
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [formData, setFormData] = useState<FlightForm>({
    flightNumber: "",
    originId: "",
    destinationId: "",
    departureTime: "",
    arrivalTime: "",
    price: 0,
    totalSeats: 0,
  });

  useEffect(() => {
    if (airlineId) {
      fetchData();
    }
  }, [airlineId]);

  const fetchData = async () => {
    if (!airlineId) return;

    try {
      const [flightsResponse, airportsResponse] = await Promise.all([
        flightApi.getCompanyFlights(airlineId),
        airportApi.getAllAirports(),
      ]);

      if (flightsResponse.success && flightsResponse.data) {
        setFlights(flightsResponse.data);
      }
      if (airportsResponse.success && airportsResponse.data) {
        setAirports(airportsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!airlineId) {
      console.error("No airline ID provided");
      return;
    }

    try {
      // Convert datetime-local format to ISO string
      const formatForAPI = (datetimeLocal: string) => {
        return new Date(datetimeLocal).toISOString();
      };

      const apiFormData = {
        ...formData,
        departureTime: formatForAPI(formData.departureTime),
        arrivalTime: formatForAPI(formData.arrivalTime),
      };

      if (editingFlight) {
        const response = await flightApi.updateFlight(editingFlight.id, apiFormData);
        if (response.success) {
          await fetchData();
          resetForm();
        }
      } else {
        const response = await flightApi.addFlight({ ...apiFormData, airlineId });
        if (response.success) {
          await fetchData();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to save flight:", error);
    }
  };

  const handleEdit = (flight: Flight) => {
    setEditingFlight(flight);

    // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForDatetimeLocal = (isoString: string) => {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    };

    setFormData({
      flightNumber: flight.flightNumber,
      originId: flight.origin.id,
      destinationId: flight.destination.id,
      departureTime: formatForDatetimeLocal(flight.departureTime),
      arrivalTime: formatForDatetimeLocal(flight.arrivalTime),
      price: flight.price,
      totalSeats: flight.totalSeats,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (flightId: string) => {
    console.log("Delete button clicked with flightId:", flightId);
    console.log("Type of flightId:", typeof flightId);

    if (!flightId) {
      alert("Error: Flight ID is missing");
      return;
    }

    if (confirm("Are you sure you want to delete this flight?")) {
      try {
        console.log("Attempting to delete flight:", flightId);
        const response = await flightApi.deleteFlight(flightId);
        console.log("Delete response:", response);
        if (response.success) {
          console.log("Flight deleted successfully");
          await fetchData();
        } else {
          console.error("Delete failed:", response.error);
          alert(`Cannot delete this flight, it is already in use`);
        }
      } catch (error) {
        console.error("Failed to delete flight:", error);
        alert(`Error deleting flight: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      flightNumber: "",
      originId: "",
      destinationId: "",
      departureTime: "",
      arrivalTime: "",
      price: 0,
      totalSeats: 0,
    });
    setEditingFlight(null);
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "boarding":
        return "bg-yellow-100 text-yellow-800";
      case "departed":
        return "bg-green-100 text-green-800";
      case "arrived":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "delayed":
        return "bg-orange-100 text-orange-800";
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Flight Management</h2>
          <p className="text-muted-foreground">Manage your airline&apos;s flights</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Flight
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFlight ? "Edit Flight" : "Add New Flight"}</DialogTitle>
              <DialogDescription>
                {editingFlight ? "Update the flight details below." : "Enter the details for the new flight."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Flight Number</Label>
                  <Input
                    id="flightNumber"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, flightNumber: e.target.value }))}
                    placeholder="e.g., AA123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              {/* Origin and Destination - Full width for long names */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Airport</Label>
                  <Select
                    value={formData.originId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, originId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={airport.id}>
                          {airport.code} - {airport.name}, {airport.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Airport</Label>
                  <Select
                    value={formData.destinationId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, destinationId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={airport.id}>
                          {airport.code} - {airport.name}, {airport.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Date & Time</Label>
                  <DateTimePicker
                    value={formData.departureTime}
                    onChange={(value) => setFormData((prev) => ({ ...prev, departureTime: value }))}
                    placeholder="Select departure date and time"
                    minDate={new Date()}
                  />
                  <p className="text-xs text-muted-foreground">Select the departure date and time</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Date & Time</Label>
                  <DateTimePicker
                    value={formData.arrivalTime}
                    onChange={(value) => setFormData((prev) => ({ ...prev, arrivalTime: value }))}
                    placeholder="Select arrival date and time"
                    minDate={new Date()}
                  />
                  <p className="text-xs text-muted-foreground">Select the arrival date and time</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalSeats: Number(e.target.value) }))}
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingFlight ? "Update Flight" : "Add Flight"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {flights.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No flights found. Add your first flight!</p>
            </CardContent>
          </Card>
        ) : (
          flights.map((flight) => (
            <Card key={flight.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      {flight.flightNumber || "N/A"}
                    </CardTitle>
                    <CardDescription>
                      {flight.origin?.code || "???"} → {flight.destination?.code || "???"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(flight.status)}>{flight.status}</Badge>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(flight)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(flight.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{flight.origin?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(flight.departureTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDuration(flight.duration)}</p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{flight.destination?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(flight.arrivalTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">${flight.price?.toLocaleString() || "0"}</p>
                      <p className="text-sm text-muted-foreground">Price</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{flight.totalSeats || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Seats</p>
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
