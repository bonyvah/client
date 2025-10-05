"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Plane, Users, DollarSign, Calendar } from "lucide-react";
import { CompanyStatistics as CompanyStatsType, StatisticsPeriod } from "@/types";
import { statisticsApi } from "@/lib/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface CompanyStatisticsProps {
  airlineId?: string;
}

export function CompanyStatistics({ airlineId }: CompanyStatisticsProps) {
  const [stats, setStats] = useState<CompanyStatsType | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (airlineId) {
      fetchStatistics();
    }
  }, [selectedPeriod, airlineId]);

  const fetchStatistics = async () => {
    if (!airlineId) return;

    setIsLoading(true);
    try {
      const response = await statisticsApi.getCompanyStatistics(airlineId, selectedPeriod);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load statistics</p>
      </div>
    );
  }

  // Prepare chart data
  const flightStatusData = [
    { name: "Active", value: stats.activeFlights, color: COLORS[0] },
    { name: "Completed", value: stats.completedFlights, color: COLORS[1] },
  ];

  // Calculate meaningful metrics for the current period
  const averageRevenuePerFlight = stats.totalFlights > 0 ? stats.totalRevenue / stats.totalFlights : 0;
  const averageRevenuePerPassenger = stats.totalPassengers > 0 ? stats.totalRevenue / stats.totalPassengers : 0;

  const periodLabels = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Company Statistics</h2>
          <p className="text-muted-foreground">Detailed analytics for your airline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select value={selectedPeriod} onValueChange={(value: StatisticsPeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlights}</div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="text-xs">
                {periodLabels[selectedPeriod]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flights</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFlights}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">
                {Math.round((stats.activeFlights / stats.totalFlights) * 100)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPassengers}</div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Avg: {Math.round(stats.totalPassengers / stats.totalFlights)} per flight
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">
                ${Math.round(stats.totalRevenue / stats.totalPassengers)} per passenger
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flight Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Flight Status Distribution</CardTitle>
            <CardDescription>Breakdown of active vs completed flights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={flightStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {flightStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue metrics for {periodLabels[selectedPeriod].toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${averageRevenuePerFlight.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Avg per Flight</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">${averageRevenuePerPassenger.toFixed(0)}</div>
                  <p className="text-sm text-muted-foreground">Avg per Passenger</p>
                </div>
              </div>

              {stats.totalFlights > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue Efficiency</span>
                    <span className="font-medium">
                      {((stats.totalRevenue / (stats.totalFlights * 1000)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${Math.min((stats.totalRevenue / (stats.totalFlights * 1000)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Based on $1,000 target per flight</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{Math.round((stats.completedFlights / stats.totalFlights) * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Flights</span>
              <Badge variant="outline">{stats.activeFlights}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed Flights</span>
              <Badge variant="secondary">{stats.completedFlights}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passenger Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Passengers</span>
              <span className="font-medium">{stats.totalPassengers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg per Flight</span>
              <span className="font-medium">{Math.round(stats.totalPassengers / stats.totalFlights)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Load Factor</span>
              <Badge variant="outline">85%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-medium">${stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenue per Passenger</span>
              <span className="font-medium">${Math.round(stats.totalRevenue / stats.totalPassengers)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Ticket Price</span>
              <Badge variant="outline">${Math.round(stats.totalRevenue / stats.totalPassengers)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
