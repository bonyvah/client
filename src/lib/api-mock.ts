// import {
//   User,
//   Flight,
//   Airline,
//   Airport,
//   Booking,
//   Banner,
//   Offer,
//   FlightSearchParams,
//   FlightFilters,
//   LoginForm,
//   RegisterForm,
//   FlightForm,
//   BookingForm,
//   CompanyStatistics,
//   AdminStatistics,
//   ApiResponse,
//   PaginatedResponse,
//   AuthUser,
//   StatisticsPeriod,
// } from "@/types";

// import {
//   users,
//   flights,
//   airlines,
//   airports,
//   bookings,
//   banners,
//   offers,
//   companyStatistics,
//   adminStatistics,
// } from "./dummy-data";

// // Simulate API delay
// const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// // Authentication API
// export const authApi = {
//   async login(credentials: LoginForm): Promise<ApiResponse<AuthUser>> {
//     await delay();

//     const user = users.find((u) => u.email === credentials.email);
//     if (!user) {
//       return { success: false, error: "User not found" };
//     }

//     // Check password
//     if (user.password !== credentials.password) {
//       return { success: false, error: "Invalid password" };
//     }

//     // Check if user is blocked
//     if (user.isBlocked) {
//       return { success: false, error: "User account is blocked" };
//     }

//     const authUser: AuthUser = {
//       ...user,
//       accessToken: "dummy-access-token",
//       refreshToken: "dummy-refresh-token",
//     };

//     return { success: true, data: authUser };
//   },

//   async register(userData: RegisterForm): Promise<ApiResponse<AuthUser>> {
//     await delay();

//     // Check if user already exists
//     const existingUser = users.find((u) => u.email === userData.email);
//     if (existingUser) {
//       return { success: false, error: "User already exists" };
//     }

//     const newUser: User = {
//       id: (users.length + 1).toString(),
//       email: userData.email,
//       password: userData.password,
//       firstName: userData.firstName,
//       lastName: userData.lastName,
//       phone: userData.phone,
//       role: "regular",
//       isBlocked: false,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     // Add to users array (in real app, this would be saved to database)
//     users.push(newUser);

//     const authUser: AuthUser = {
//       ...newUser,
//       accessToken: "dummy-access-token",
//       refreshToken: "dummy-refresh-token",
//     };

//     return { success: true, data: authUser };
//   },

//   async logout(): Promise<ApiResponse<void>> {
//     await delay(200);
//     return { success: true };
//   },

//   async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
//     await delay(300);
//     return {
//       success: true,
//       data: { accessToken: "new-dummy-access-token" },
//     };
//   },
// };

// // Flight API
// export const flightApi = {
//   async searchFlights(params: FlightSearchParams, filters?: FlightFilters): Promise<ApiResponse<Flight[]>> {
//     await delay();

//     let filteredFlights = flights.filter((flight) => {
//       const matchesRoute = flight.origin.code === params.origin && flight.destination.code === params.destination;

//       const flightDate = new Date(flight.departureTime).toDateString();
//       const searchDate = new Date(params.departureDate).toDateString();
//       const matchesDate = flightDate === searchDate;

//       const hasSeats = flight.availableSeats >= params.passengers;

//       return matchesRoute && matchesDate && hasSeats;
//     });

//     // Apply filters
//     if (filters) {
//       if (filters.priceRange) {
//         filteredFlights = filteredFlights.filter(
//           (flight) => flight.price >= filters.priceRange!.min && flight.price <= filters.priceRange!.max
//         );
//       }

//       if (filters.airlines && filters.airlines.length > 0) {
//         filteredFlights = filteredFlights.filter((flight) => filters.airlines!.includes(flight.airlineId));
//       }

//       if (filters.maxStops !== undefined) {
//         filteredFlights = filteredFlights.filter((flight) => (flight.layovers?.length || 0) <= filters.maxStops!);
//       }

//       if (filters.duration?.max) {
//         filteredFlights = filteredFlights.filter((flight) => flight.duration <= filters.duration!.max);
//       }
//     }

//     return { success: true, data: filteredFlights };
//   },

//   async getFlightById(id: string): Promise<ApiResponse<Flight>> {
//     await delay();

//     const flight = flights.find((f) => f.id === id);
//     if (!flight) {
//       return { success: false, error: "Flight not found" };
//     }

//     return { success: true, data: flight };
//   },

//   async getAllFlights(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Flight>>> {
//     await delay();

//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;
//     const paginatedFlights = flights.slice(startIndex, endIndex);

//     return {
//       success: true,
//       data: {
//         data: paginatedFlights,
//         total: flights.length,
//         page,
//         limit,
//         totalPages: Math.ceil(flights.length / limit),
//       },
//     };
//   },

//   async createFlight(flightData: FlightForm & { airlineId: string }): Promise<ApiResponse<Flight>> {
//     await delay();

//     const origin = airports.find((a) => a.id === flightData.originId);
//     const destination = airports.find((a) => a.id === flightData.destinationId);
//     const airline = airlines.find((a) => a.id === flightData.airlineId);

//     if (!origin || !destination) {
//       return { success: false, error: "Invalid airport selected" };
//     }

//     if (!airline) {
//       return { success: false, error: "Invalid airline" };
//     }

//     const newFlight: Flight = {
//       id: (flights.length + 1).toString(),
//       flightNumber: flightData.flightNumber,
//       airlineId: flightData.airlineId,
//       airline,
//       origin,
//       destination,
//       departureTime: flightData.departureTime,
//       arrivalTime: flightData.arrivalTime,
//       duration: Math.floor(
//         (new Date(flightData.arrivalTime).getTime() - new Date(flightData.departureTime).getTime()) / (1000 * 60)
//       ), // Calculate duration in minutes
//       price: flightData.price,
//       availableSeats: flightData.totalSeats,
//       totalSeats: flightData.totalSeats,
//       status: "scheduled",
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     // Add to flights array
//     flights.push(newFlight);

//     return { success: true, data: newFlight };
//   },

//   async updateFlight(id: string, flightData: Partial<FlightForm>): Promise<ApiResponse<Flight>> {
//     await delay();

//     const flightIndex = flights.findIndex((f) => f.id === id);
//     if (flightIndex === -1) {
//       return { success: false, error: "Flight not found" };
//     }

//     const flight = flights[flightIndex];

//     // Update airports if changed
//     let origin = flight.origin;
//     let destination = flight.destination;

//     if (flightData.originId) {
//       const newOrigin = airports.find((a) => a.id === flightData.originId);
//       if (newOrigin) origin = newOrigin;
//     }

//     if (flightData.destinationId) {
//       const newDestination = airports.find((a) => a.id === flightData.destinationId);
//       if (newDestination) destination = newDestination;
//     }

//     const updatedFlight: Flight = {
//       ...flight,
//       ...flightData,
//       origin,
//       destination,
//       updatedAt: new Date().toISOString(),
//     };

//     // Recalculate duration if departure or arrival time changed
//     if (flightData.departureTime || flightData.arrivalTime) {
//       const departureTime = flightData.departureTime || flight.departureTime;
//       const arrivalTime = flightData.arrivalTime || flight.arrivalTime;
//       updatedFlight.duration = Math.floor(
//         (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / (1000 * 60)
//       );
//     }

//     // Update the flight in the array
//     flights[flightIndex] = updatedFlight;

//     return { success: true, data: updatedFlight };
//   },

//   async deleteFlight(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const flightIndex = flights.findIndex((f) => f.id === id);
//     if (flightIndex === -1) {
//       return { success: false, error: "Flight not found" };
//     }

//     // Remove the flight from the array
//     flights.splice(flightIndex, 1);

//     return { success: true };
//   },

//   async addFlight(flightData: FlightForm & { airlineId: string }): Promise<ApiResponse<Flight>> {
//     return this.createFlight(flightData);
//   },

//   async getCompanyFlights(airlineId: string): Promise<ApiResponse<Flight[]>> {
//     await delay();

//     const companyFlights = flights.filter((flight) => flight.airlineId === airlineId);
//     return { success: true, data: companyFlights };
//   },
// };

// // Booking API
// export const bookingApi = {
//   async createBooking(bookingData: BookingForm): Promise<ApiResponse<Booking>> {
//     await delay();

//     const flight = flights.find((f) => f.id === bookingData.flightId);
//     if (!flight) {
//       return { success: false, error: "Flight not found" };
//     }

//     if (flight.availableSeats < bookingData.passengers.length) {
//       return { success: false, error: "Not enough seats available" };
//     }

//     const newBooking: Booking = {
//       id: (bookings.length + 1).toString(),
//       confirmationId: `AVA-2025-${String(bookings.length + 1).padStart(3, "0")}`,
//       userId: "1", // Default user for demo
//       user: users[0],
//       flightId: flight.id,
//       flight,
//       passengers: bookingData.passengers.map((p, index) => ({ ...p, id: (index + 1).toString() })),
//       totalPrice: flight.price * bookingData.passengers.length,
//       status: "confirmed",
//       paymentStatus: "paid",
//       bookedAt: new Date().toISOString(),
//     };

//     // Add booking to the array and update flight availability
//     bookings.push(newBooking);
//     flight.availableSeats -= bookingData.passengers.length;

//     return { success: true, data: newBooking };
//   },

//   async getUserBookings(userId: string): Promise<ApiResponse<Booking[]>> {
//     await delay();

//     const userBookings = bookings.filter((b) => b.userId === userId);
//     return { success: true, data: userBookings };
//   },

//   async getBookingByConfirmation(confirmationId: string): Promise<ApiResponse<Booking>> {
//     await delay();

//     const booking = bookings.find((b) => b.confirmationId === confirmationId);
//     if (!booking) {
//       return { success: false, error: "Booking not found" };
//     }

//     return { success: true, data: booking };
//   },

//   async cancelBooking(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const booking = bookings.find((b) => b.id === id);
//     if (!booking) {
//       return { success: false, error: "Booking not found" };
//     }

//     return { success: true };
//   },

//   async getCompanyBookings(airlineId: string): Promise<ApiResponse<Booking[]>> {
//     await delay();

//     // Filter bookings for flights belonging to the company
//     const companyBookings = bookings.filter((booking) => booking.flight.airlineId === airlineId);
//     return { success: true, data: companyBookings };
//   },
// };

// // Airport and Airline API
// export const airportApi = {
//   async getAllAirports(): Promise<ApiResponse<Airport[]>> {
//     await delay(200);
//     return { success: true, data: airports };
//   },

//   async getAirports(): Promise<ApiResponse<Airport[]>> {
//     return this.getAllAirports();
//   },

//   async searchAirports(query: string): Promise<ApiResponse<Airport[]>> {
//     await delay(300);

//     const searchResults = airports.filter(
//       (airport) =>
//         airport.name.toLowerCase().includes(query.toLowerCase()) ||
//         airport.code.toLowerCase().includes(query.toLowerCase()) ||
//         airport.city.toLowerCase().includes(query.toLowerCase())
//     );

//     return { success: true, data: searchResults };
//   },
// };

// export const airlineApi = {
//   async getAllAirlines(): Promise<ApiResponse<Airline[]>> {
//     await delay(200);
//     return { success: true, data: airlines };
//   },

//   async getAirlineById(id: string): Promise<ApiResponse<Airline>> {
//     await delay();

//     const airline = airlines.find((a) => a.id === id);
//     if (!airline) {
//       return { success: false, error: "Airline not found" };
//     }

//     return { success: true, data: airline };
//   },

//   async createAirline(airlineData: Omit<Airline, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Airline>> {
//     await delay();

//     const newAirline: Airline = {
//       id: (airlines.length + 1).toString(),
//       ...airlineData,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     airlines.push(newAirline);
//     return { success: true, data: newAirline };
//   },

//   async updateAirline(id: string, airlineData: Partial<Airline>): Promise<ApiResponse<Airline>> {
//     await delay();

//     const airlineIndex = airlines.findIndex((a) => a.id === id);
//     if (airlineIndex === -1) {
//       return { success: false, error: "Airline not found" };
//     }

//     const updatedAirline = {
//       ...airlines[airlineIndex],
//       ...airlineData,
//       updatedAt: new Date().toISOString(),
//     };

//     airlines[airlineIndex] = updatedAirline;
//     return { success: true, data: updatedAirline };
//   },

//   async deleteAirline(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const airlineIndex = airlines.findIndex((a) => a.id === id);
//     if (airlineIndex === -1) {
//       return { success: false, error: "Airline not found" };
//     }

//     airlines.splice(airlineIndex, 1);
//     return { success: true };
//   },

//   async assignManager(airlineId: string, managerId: string): Promise<ApiResponse<void>> {
//     await delay();

//     const airline = airlines.find((a) => a.id === airlineId);
//     const user = users.find((u) => u.id === managerId);

//     if (!airline) {
//       return { success: false, error: "Airline not found" };
//     }

//     if (!user) {
//       return { success: false, error: "User not found" };
//     }

//     if (user.role !== "company_manager") {
//       return { success: false, error: "User is not a company manager" };
//     }

//     // Update airline manager
//     airline.managerId = managerId;
//     airline.updatedAt = new Date().toISOString();

//     // Update user's airline assignment
//     user.airlineId = airlineId;
//     user.updatedAt = new Date().toISOString();

//     return { success: true };
//   },
// };

// // Content Management API
// export const contentApi = {
//   async getBanners(): Promise<ApiResponse<Banner[]>> {
//     await delay(200);
//     return { success: true, data: banners };
//   },

//   async getOffers(): Promise<ApiResponse<Offer[]>> {
//     await delay(200);
//     return { success: true, data: offers };
//   },

//   async updateBanner(id: string, bannerData: Partial<Banner>): Promise<ApiResponse<Banner>> {
//     await delay();

//     const bannerIndex = banners.findIndex((b) => b.id === id);
//     if (bannerIndex === -1) {
//       return { success: false, error: "Banner not found" };
//     }

//     const updatedBanner = {
//       ...banners[bannerIndex],
//       ...bannerData,
//       updatedAt: new Date().toISOString(),
//     };

//     banners[bannerIndex] = updatedBanner;
//     return { success: true, data: updatedBanner };
//   },

//   async createBanner(bannerData: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Banner>> {
//     await delay();

//     const newBanner: Banner = {
//       id: (banners.length + 1).toString(),
//       ...bannerData,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     banners.push(newBanner);
//     return { success: true, data: newBanner };
//   },

//   async deleteBanner(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const bannerIndex = banners.findIndex((b) => b.id === id);
//     if (bannerIndex === -1) {
//       return { success: false, error: "Banner not found" };
//     }

//     banners.splice(bannerIndex, 1);
//     return { success: true };
//   },

//   async updateOffer(id: string, offerData: Partial<Offer>): Promise<ApiResponse<Offer>> {
//     await delay();

//     const offerIndex = offers.findIndex((o) => o.id === id);
//     if (offerIndex === -1) {
//       return { success: false, error: "Offer not found" };
//     }

//     const updatedOffer = {
//       ...offers[offerIndex],
//       ...offerData,
//       updatedAt: new Date().toISOString(),
//     };

//     offers[offerIndex] = updatedOffer;
//     return { success: true, data: updatedOffer };
//   },

//   async createOffer(offerData: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Offer>> {
//     await delay();

//     const newOffer: Offer = {
//       id: (offers.length + 1).toString(),
//       ...offerData,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     offers.push(newOffer);
//     return { success: true, data: newOffer };
//   },

//   async deleteOffer(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const offerIndex = offers.findIndex((o) => o.id === id);
//     if (offerIndex === -1) {
//       return { success: false, error: "Offer not found" };
//     }

//     offers.splice(offerIndex, 1);
//     return { success: true };
//   },
// };

// // Statistics API
// export const statisticsApi = {
//   async getCompanyStatistics(
//     airlineId: string,
//     period: StatisticsPeriod = "all"
//   ): Promise<ApiResponse<CompanyStatistics>> {
//     await delay();

//     // Filter flights by airline
//     const airlineFlights = flights.filter((flight) => flight.airlineId === airlineId);
//     const airlineBookings = bookings.filter((booking) =>
//       airlineFlights.some((flight) => flight.id === booking.flightId)
//     );

//     // Calculate statistics for this specific airline
//     const stats: CompanyStatistics = {
//       totalFlights: airlineFlights.length,
//       activeFlights: airlineFlights.filter((f) => f.status === "scheduled").length,
//       completedFlights: airlineFlights.filter((f) => f.status === "arrived").length,
//       totalPassengers: airlineBookings.reduce((total, booking) => total + booking.passengers.length, 0),
//       totalRevenue: airlineBookings.reduce((total, booking) => total + booking.totalPrice, 0),
//       period,
//     };

//     return { success: true, data: stats };
//   },

//   async getAdminStatistics(period: StatisticsPeriod = "all"): Promise<ApiResponse<AdminStatistics>> {
//     await delay();

//     const stats = { ...adminStatistics, period };
//     return { success: true, data: stats };
//   },
// };

// // User Management API
// export const userApi = {
//   async getAllUsers(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> {
//     await delay();

//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;
//     const paginatedUsers = users.slice(startIndex, endIndex);

//     return {
//       success: true,
//       data: {
//         data: paginatedUsers,
//         total: users.length,
//         page,
//         limit,
//         totalPages: Math.ceil(users.length / limit),
//       },
//     };
//   },

//   async getUserById(id: string): Promise<ApiResponse<User>> {
//     await delay();

//     const user = users.find((u) => u.id === id);
//     if (!user) {
//       return { success: false, error: "User not found" };
//     }

//     return { success: true, data: user };
//   },

//   async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
//     await delay();

//     const userIndex = users.findIndex((u) => u.id === id);
//     if (userIndex === -1) {
//       return { success: false, error: "User not found" };
//     }

//     const updatedUser = {
//       ...users[userIndex],
//       ...userData,
//       updatedAt: new Date().toISOString(),
//     };

//     users[userIndex] = updatedUser;
//     return { success: true, data: updatedUser };
//   },

//   async blockUser(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const userIndex = users.findIndex((u) => u.id === id);
//     if (userIndex === -1) {
//       return { success: false, error: "User not found" };
//     }

//     users[userIndex].isBlocked = true;
//     users[userIndex].updatedAt = new Date().toISOString();
//     return { success: true };
//   },

//   async unblockUser(id: string): Promise<ApiResponse<void>> {
//     await delay();

//     const userIndex = users.findIndex((u) => u.id === id);
//     if (userIndex === -1) {
//       return { success: false, error: "User not found" };
//     }

//     users[userIndex].isBlocked = false;
//     users[userIndex].updatedAt = new Date().toISOString();
//     return { success: true };
//   },

//   async getCompanyManagers(): Promise<ApiResponse<User[]>> {
//     await delay();

//     const managers = users.filter((u) => u.role === "company_manager");
//     return { success: true, data: managers };
//   },

//   async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<User>> {
//     await delay();

//     const existingUser = users.find((u) => u.email === userData.email);
//     if (existingUser) {
//       return { success: false, error: "User with this email already exists" };
//     }

//     const newUser: User = {
//       id: (users.length + 1).toString(),
//       ...userData,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     users.push(newUser);
//     return { success: true, data: newUser };
//   },
// };
