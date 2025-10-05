"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Plane, Users, DollarSign, Calendar } from "lucide-react";
import { FlightManagement } from "@/components/company/FlightManagement";
import { PassengerList } from "@/components/company/PassengerList";
import { CompanyStatistics } from "@/components/company/CompanyStatistics";
import { CompanyStatistics as CompanyStatsType, Airline, Flight } from "@/types";
import { statisticsApi, airlineApi, flightApi } from "@/lib/api";

export default function CompanyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CompanyStatsType | null>(null);
  const [airline, setAirline] = useState<Airline | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    console.log("Company page session:", session);
    console.log("Session accessToken:", session?.accessToken);

    if (!session || session.user.role !== "company_manager") {
      router.push("/login");
      return;
    }

    fetchStatistics();
  }, [session, status, router]);

  const fetchStatistics = async () => {
    try {
      if (!session?.user.airlineId) {
        console.error("User is not associated with any airline");
        return;
      }

      console.log("Fetching statistics for airline:", session.user.airlineId);

      // Fetch airline information
      const airlineResponse = await airlineApi.getAirlineById(session.user.airlineId);
      console.log("Airline response:", airlineResponse);
      if (airlineResponse.success && airlineResponse.data) {
        setAirline(airlineResponse.data);
      }

      // Fetch flights for this airline
      const flightsResponse = await flightApi.getCompanyFlights(session.user.airlineId);
      console.log("Flights response:", flightsResponse);
      let companyFlights: Flight[] = [];
      if (flightsResponse.success && flightsResponse.data) {
        companyFlights = flightsResponse.data;
        setFlights(companyFlights);
      }

      // Fetch statistics for this airline
      const response = await statisticsApi.getCompanyStatistics(session.user.airlineId);
      console.log("Statistics response:", response);
      if (response.success && response.data) {
        console.log("Statistics data:", response.data);

        // Calculate completed flights from the flight data
        const now = new Date();
        const completedFlights = companyFlights.filter((flight) => {
          const departureTime = new Date(flight.departureTime);
          return departureTime <= now && (flight.status === "departed" || flight.status === "arrived");
        }).length;

        // Update stats with calculated completed flights
        const updatedStats = {
          ...response.data,
          completedFlights: completedFlights,
        };

        console.log("Updated statistics with calculated completed flights:", updatedStats);
        setStats(updatedStats);
      } else {
        console.error("Failed to get statistics:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "company_manager") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{airline?.name || "Company"} Dashboard</h1>
            {airline && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {airline.code}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Welcome back, {session.user.firstName} {session.user.lastName}
          </p>
          {airline && <p className="text-sm text-muted-foreground mt-1">Managing {airline.name} operations</p>}
        </div>
      </div>

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalFlights || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.activeFlights || 0} active flights</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPassengers || 0}</div>
              <p className="text-xs text-muted-foreground">Across all flights</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Flights</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedFlights || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="flights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flights">Flight Management</TabsTrigger>
          <TabsTrigger value="passengers">Passengers</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="space-y-6">
          <FlightManagement airlineId={session.user.airlineId} />
        </TabsContent>

        <TabsContent value="passengers" className="space-y-6">
          <PassengerList airlineId={session.user.airlineId} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <CompanyStatistics airlineId={session.user.airlineId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
