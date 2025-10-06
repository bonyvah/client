import apiClient from "./api-client";
import {
  User,
  Flight,
  Airline,
  Airport,
  Booking,
  Banner,
  Offer,
  FlightSearchParams,
  FlightFilters,
  LoginForm,
  RegisterForm,
  FlightForm,
  BookingForm,
  CompanyStatistics,
  AdminStatistics,
  ApiResponse,
  PaginatedResponse,
  AuthUser,
  StatisticsPeriod,
  UserRole,
} from "@/types";

// API Response interfaces based on backend schemas
interface ApiCallResponse {
  data: unknown;
}

interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

interface BackendFlight {
  id: string;
  flight_number: string;
  airline_id: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departure_time: string;
  arrival_time: string;
  duration: number;
  price: number;
  available_seats: number;
  total_seats: number;
  status: string;
  layovers?: unknown[];
  created_at: string;
  updated_at: string;
}

interface BackendPassenger {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  passport_number?: string;
  nationality?: string;
}

interface BackendBooking {
  id: string;
  confirmation_id: string;
  user_id: string;
  user: User;
  flight_id: string;
  flight: BackendFlight;
  passengers: BackendPassenger[];
  total_price: number;
  status: string;
  payment_status: string;
  booked_at: string;
}

interface BackendUser {
  id: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  airline_id?: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendAirline {
  id: string;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

interface BackendBanner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link?: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

interface BackendOffer {
  id: string;
  title: string;
  description?: string;
  discount: number;
  valid_from: string;
  valid_to: string;
  min_price?: number;
  max_discount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  applicable_flights?: string[];
  applicable_airlines?: string[];
  applicable_routes?: unknown[];
}

interface ErrorResponse {
  code?: string;
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

// Helper function to handle API responses
const handleApiResponse = async <T>(apiCall: Promise<ApiCallResponse>): Promise<ApiResponse<T>> => {
  try {
    const response = await apiCall;
    return {
      success: true,
      data: transformKeys(response.data) as T,
    };
  } catch (error: unknown) {
    const apiError = error as ErrorResponse;
    console.error("API Error:", apiError);
    console.error("Error response:", apiError.response);
    console.error("Error request:", (apiError as unknown as { request?: unknown }).request);
    console.error("Error config:", (apiError as unknown as { config?: unknown }).config);

    if (apiError.code === "NETWORK_ERROR" || !apiError.response) {
      return {
        success: false,
        error: "Network error - please check your connection and try again",
      };
    }

    return {
      success: false,
      error: apiError.response?.data?.detail || apiError.message || "An error occurred",
    };
  }
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Helper function to transform object keys from snake_case to camelCase
const transformKeys = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(value);
    }
    return transformed;
  }

  return obj;
};

// Authentication API
export const authApi = {
  async login(credentials: LoginForm): Promise<ApiResponse<AuthUser>> {
    return handleApiResponse(
      apiClient
        .post("/auth/login", {
          email: credentials.email,
          password: credentials.password,
        })
        .then((response) => {
          // Store tokens in localStorage
          if (typeof window !== "undefined") {
            const authData = response.data as AuthTokenResponse;
            localStorage.setItem("access_token", authData.access_token);
            if (authData.refresh_token) {
              localStorage.setItem("refresh_token", authData.refresh_token);
            }
          }
          return response;
        })
    );
  },

  async register(userData: RegisterForm): Promise<ApiResponse<AuthUser>> {
    return handleApiResponse(
      apiClient
        .post("/auth/register", {
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: "regular", // Default role for registration
        })
        .then((response) => {
          // Store tokens in localStorage
          if (typeof window !== "undefined") {
            const authData = response.data as AuthTokenResponse;
            localStorage.setItem("access_token", authData.access_token);
            if (authData.refresh_token) {
              localStorage.setItem("refresh_token", authData.refresh_token);
            }
          }
          return response;
        })
    );
  },

  async logout(): Promise<ApiResponse<void>> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    return { success: true, data: undefined };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return handleApiResponse(apiClient.get("/auth/me"));
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    return handleApiResponse(
      apiClient
        .post("/auth/refresh", {
          refresh_token: refreshToken,
        })
        .then((response) => {
          if (typeof window !== "undefined") {
            const tokenData = response.data as { access_token: string };
            localStorage.setItem("access_token", tokenData.access_token);
          }
          return response;
        })
    );
  },
};

// Flight API
export const flightApi = {
  async searchFlights(params: FlightSearchParams, filters?: FlightFilters): Promise<ApiResponse<Flight[]>> {
    const searchParams = new URLSearchParams();

    if (params.origin) searchParams.append("origin", params.origin);
    if (params.destination) searchParams.append("destination", params.destination);
    if (params.departureDate) searchParams.append("departure_date", params.departureDate);
    if (params.returnDate) searchParams.append("return_date", params.returnDate);
    if (params.passengers) searchParams.append("passengers", params.passengers.toString());

    // Add filters
    if (filters?.priceRange?.min) searchParams.append("price_min", filters.priceRange.min.toString());
    if (filters?.priceRange?.max) searchParams.append("price_max", filters.priceRange.max.toString());
    if (filters?.airlines?.length) {
      filters.airlines.forEach((airline) => searchParams.append("airlines", airline));
    }
    if (filters?.maxStops !== undefined) searchParams.append("max_stops", filters.maxStops.toString());
    if (filters?.duration?.max) searchParams.append("max_duration", filters.duration.max.toString());

    return handleApiResponse(apiClient.get(`/flights/search?${searchParams.toString()}`));
  },

  async getFlightById(id: string): Promise<ApiResponse<Flight>> {
    return handleApiResponse(apiClient.get(`/flights/${id}`));
  },

  async getAllFlights(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Flight>>> {
    return handleApiResponse(
      apiClient.get(`/flights?skip=${(page - 1) * limit}&limit=${limit}`).then((response) => ({
        ...response,
        data: {
          data: response.data,
          total: response.data.length, // Backend should provide total count
          page,
          limit,
          totalPages: Math.ceil(response.data.length / limit),
        },
      }))
    );
  },

  async createFlight(flightData: FlightForm & { airlineId: string }): Promise<ApiResponse<Flight>> {
    return handleApiResponse(
      apiClient.post("/flights", {
        flight_number: flightData.flightNumber,
        airline_id: flightData.airlineId,
        origin_id: flightData.originId,
        destination_id: flightData.destinationId,
        departure_time: flightData.departureTime,
        arrival_time: flightData.arrivalTime,
        price: flightData.price,
        total_seats: flightData.totalSeats,
      })
    );
  },

  async updateFlight(id: string, flightData: Partial<FlightForm>): Promise<ApiResponse<Flight>> {
    const updateData: Record<string, unknown> = {};

    if (flightData.flightNumber) updateData.flight_number = flightData.flightNumber;
    if (flightData.originId) updateData.origin_id = flightData.originId;
    if (flightData.destinationId) updateData.destination_id = flightData.destinationId;
    if (flightData.departureTime) updateData.departure_time = flightData.departureTime;
    if (flightData.arrivalTime) updateData.arrival_time = flightData.arrivalTime;
    if (flightData.price) updateData.price = flightData.price;
    if (flightData.totalSeats) updateData.total_seats = flightData.totalSeats;

    return handleApiResponse(apiClient.put(`/flights/${id}`, updateData));
  },

  async deleteFlight(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.delete(`/flights/${id}`));
  },

  async addFlight(flightData: FlightForm & { airlineId: string }): Promise<ApiResponse<Flight>> {
    return this.createFlight(flightData);
  },

  async getCompanyFlights(airlineId: string): Promise<ApiResponse<Flight[]>> {
    return handleApiResponse(
      apiClient.get(`/flights/company/${airlineId}`).then((response) => ({
        ...response,
        data: response.data.map((flight: BackendFlight) => ({
          id: flight.id,
          flightNumber: flight.flight_number,
          airlineId: flight.airline_id,
          airline: flight.airline,
          origin: flight.origin,
          destination: flight.destination,
          departureTime: flight.departure_time,
          arrivalTime: flight.arrival_time,
          duration: flight.duration,
          price: flight.price,
          availableSeats: flight.available_seats,
          totalSeats: flight.total_seats,
          status: flight.status,
          layovers: flight.layovers,
          createdAt: flight.created_at,
          updatedAt: flight.updated_at,
        })),
      }))
    );
  },
};

// Booking API
export const bookingApi = {
  async createBooking(bookingData: BookingForm): Promise<ApiResponse<Booking>> {
    return handleApiResponse(
      apiClient
        .post("/bookings", {
          flight_id: bookingData.flightId,
          passengers: bookingData.passengers.map((p) => ({
            first_name: p.firstName,
            last_name: p.lastName,
            email: p.email,
            phone: p.phone,
            date_of_birth: p.dateOfBirth,
            passport_number: p.passportNumber,
            nationality: p.nationality,
          })),
        })
        .then((response) => {
          const bookingData = response.data as BackendBooking;
          return {
            ...response,
            data: {
              id: bookingData.id,
              confirmationId: bookingData.confirmation_id,
              userId: bookingData.user_id,
              user: bookingData.user,
              flightId: bookingData.flight_id,
              flight: {
                id: bookingData.flight.id,
                flightNumber: bookingData.flight.flight_number,
                airlineId: bookingData.flight.airline_id,
                airline: bookingData.flight.airline,
                origin: bookingData.flight.origin,
                destination: bookingData.flight.destination,
                departureTime: bookingData.flight.departure_time,
                arrivalTime: bookingData.flight.arrival_time,
                duration: bookingData.flight.duration,
                price: bookingData.flight.price,
                availableSeats: bookingData.flight.available_seats,
                totalSeats: bookingData.flight.total_seats,
                status: bookingData.flight.status,
                createdAt: bookingData.flight.created_at,
                updatedAt: bookingData.flight.updated_at,
              },
              passengers: bookingData.passengers.map((passenger: BackendPassenger) => ({
                id: passenger.id,
                firstName: passenger.first_name,
                lastName: passenger.last_name,
                email: passenger.email,
                phone: passenger.phone,
                dateOfBirth: passenger.date_of_birth,
                passportNumber: passenger.passport_number,
                nationality: passenger.nationality,
              })),
              totalPrice: bookingData.total_price,
              status: bookingData.status,
              paymentStatus: bookingData.payment_status,
              bookedAt: bookingData.booked_at,
            },
          };
        })
    );
  },

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    return handleApiResponse(apiClient.get(`/bookings/${id}`));
  },

  async getUserBookings(): Promise<ApiResponse<Booking[]>> {
    return handleApiResponse(
      apiClient.get(`/bookings/my-bookings`).then((response) => ({
        ...response,
        data: response.data.map((booking: BackendBooking) => ({
          id: booking.id,
          confirmationId: booking.confirmation_id,
          userId: booking.user_id,
          user: booking.user,
          flightId: booking.flight_id,
          flight: {
            id: booking.flight.id,
            flightNumber: booking.flight.flight_number,
            airlineId: booking.flight.airline_id,
            airline: booking.flight.airline,
            origin: booking.flight.origin,
            destination: booking.flight.destination,
            departureTime: booking.flight.departure_time,
            arrivalTime: booking.flight.arrival_time,
            duration: booking.flight.duration,
            price: booking.flight.price,
            availableSeats: booking.flight.available_seats,
            totalSeats: booking.flight.total_seats,
            status: booking.flight.status,
            createdAt: booking.flight.created_at,
            updatedAt: booking.flight.updated_at,
          },
          passengers: booking.passengers.map((passenger: BackendPassenger) => ({
            id: passenger.id,
            firstName: passenger.first_name,
            lastName: passenger.last_name,
            email: passenger.email,
            phone: passenger.phone,
            dateOfBirth: passenger.date_of_birth,
            passportNumber: passenger.passport_number,
            nationality: passenger.nationality,
          })),
          totalPrice: booking.total_price,
          status: booking.status,
          paymentStatus: booking.payment_status,
          bookedAt: booking.booked_at,
        })),
      }))
    );
  },

  async cancelBooking(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.post(`/bookings/${id}/cancel`));
  },

  async getBookingByConfirmation(confirmationId: string): Promise<ApiResponse<Booking>> {
    return handleApiResponse(apiClient.get(`/bookings/confirmation/${confirmationId}`));
  },

  async getCompanyBookings(airlineId: string): Promise<ApiResponse<Booking[]>> {
    return handleApiResponse(
      apiClient.get(`/bookings/company/${airlineId}`).then((response) => ({
        ...response,
        data: response.data.map((booking: BackendBooking) => ({
          id: booking.id,
          confirmationId: booking.confirmation_id,
          userId: booking.user_id,
          user: booking.user,
          flightId: booking.flight_id,
          flight: {
            id: booking.flight.id,
            flightNumber: booking.flight.flight_number,
            airlineId: booking.flight.airline_id,
            airline: booking.flight.airline,
            origin: booking.flight.origin,
            destination: booking.flight.destination,
            departureTime: booking.flight.departure_time,
            arrivalTime: booking.flight.arrival_time,
            duration: booking.flight.duration,
            price: booking.flight.price,
            availableSeats: booking.flight.available_seats,
            totalSeats: booking.flight.total_seats,
            status: booking.flight.status,
            createdAt: booking.flight.created_at,
            updatedAt: booking.flight.updated_at,
          },
          passengers: booking.passengers.map((passenger: BackendPassenger) => ({
            id: passenger.id,
            firstName: passenger.first_name,
            lastName: passenger.last_name,
            email: passenger.email,
            phone: passenger.phone,
            dateOfBirth: passenger.date_of_birth,
            passportNumber: passenger.passport_number,
            nationality: passenger.nationality,
          })),
          totalPrice: booking.total_price,
          status: booking.status,
          paymentStatus: booking.payment_status,
          bookedAt: booking.booked_at,
        })),
      }))
    );
  },
};

// Airport API
export const airportApi = {
  async getAllAirports(): Promise<ApiResponse<Airport[]>> {
    return handleApiResponse(apiClient.get("/airports"));
  },

  async getAirports(): Promise<ApiResponse<Airport[]>> {
    return this.getAllAirports();
  },

  async searchAirports(query: string): Promise<ApiResponse<Airport[]>> {
    return handleApiResponse(apiClient.get(`/airports/search?query=${encodeURIComponent(query)}`));
  },
};

// Airline API
export const airlineApi = {
  // Helper function to map airline data from backend format to frontend format
  mapAirlineData: (airlineData: BackendAirline): Airline => ({
    id: airlineData.id,
    name: airlineData.name,
    code: airlineData.code,
    logo: airlineData.logo,
    description: airlineData.description,
    isActive: airlineData.is_active,
    managerId: airlineData.manager_id,
    createdAt: airlineData.created_at,
    updatedAt: airlineData.updated_at,
  }),

  async getAllAirlines(): Promise<ApiResponse<Airline[]>> {
    return handleApiResponse(
      apiClient.get("/airlines").then((response) => ({
        ...response,
        data: response.data.map((airline: BackendAirline) => airlineApi.mapAirlineData(airline)),
      }))
    );
  },

  async getAirlineById(id: string): Promise<ApiResponse<Airline>> {
    return handleApiResponse(
      apiClient.get(`/airlines/${id}`).then((response) => ({
        ...response,
        data: airlineApi.mapAirlineData(response.data),
      }))
    );
  },

  async createAirline(airlineData: Omit<Airline, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Airline>> {
    return handleApiResponse(
      apiClient
        .post("/airlines", {
          name: airlineData.name,
          code: airlineData.code,
          logo: airlineData.logo,
          description: airlineData.description,
          is_active: airlineData.isActive,
        })
        .then((response) => ({
          ...response,
          data: airlineApi.mapAirlineData(response.data),
        }))
    );
  },

  async updateAirline(id: string, airlineData: Partial<Airline>): Promise<ApiResponse<Airline>> {
    return handleApiResponse(
      apiClient
        .put(`/airlines/${id}`, {
          name: airlineData.name,
          code: airlineData.code,
          logo: airlineData.logo,
          description: airlineData.description,
          is_active: airlineData.isActive,
          manager_id: airlineData.managerId,
        })
        .then((response) => ({
          ...response,
          data: airlineApi.mapAirlineData(response.data),
        }))
    );
  },

  async deleteAirline(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.delete(`/airlines/${id}`));
  },

  async assignManager(airlineId: string, managerId: string): Promise<ApiResponse<void>> {
    return handleApiResponse(
      apiClient.post(`/airlines/${airlineId}/assign-manager`, {
        manager_id: managerId,
      })
    );
  },
};

// Content Management API
export const contentApi = {
  // Helper function to map banner data from backend format to frontend format
  mapBannerData: (bannerData: BackendBanner): Banner => ({
    id: bannerData.id,
    title: bannerData.title,
    description: bannerData.description,
    imageUrl: bannerData.image_url,
    link: bannerData.link,
    isActive: bannerData.is_active,
    order: bannerData.order,
    createdAt: bannerData.created_at,
    updatedAt: bannerData.updated_at,
  }),

  async getBanners(): Promise<ApiResponse<Banner[]>> {
    return handleApiResponse(
      apiClient.get("/content/banners").then((response) => ({
        ...response,
        data: response.data.map((banner: BackendBanner) => contentApi.mapBannerData(banner)),
      }))
    );
  },

  async createBanner(bannerData: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Banner>> {
    return handleApiResponse(
      apiClient
        .post("/content/banners", {
          title: bannerData.title,
          description: bannerData.description,
          image_url: bannerData.imageUrl,
          link: bannerData.link,
          is_active: bannerData.isActive,
          order: bannerData.order,
        })
        .then((response) => ({
          ...response,
          data: contentApi.mapBannerData(response.data),
        }))
    );
  },

  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<ApiResponse<Banner>> {
    return handleApiResponse(
      apiClient
        .put(`/content/banners/${id}`, {
          title: bannerData.title,
          description: bannerData.description,
          image_url: bannerData.imageUrl,
          link: bannerData.link,
          is_active: bannerData.isActive,
          order: bannerData.order,
        })
        .then((response) => ({
          ...response,
          data: contentApi.mapBannerData(response.data),
        }))
    );
  },

  async deleteBanner(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.delete(`/content/banners/${id}`));
  },

  async getOffers(): Promise<ApiResponse<Offer[]>> {
    return handleApiResponse(
      apiClient.get("/content/offers").then((response) => ({
        ...response,
        data: response.data.map((offer: BackendOffer) => contentApi.mapOfferData(offer)),
      }))
    );
  },

  // Helper function to map offer data from backend format to frontend format
  mapOfferData: (offerData: BackendOffer): Offer => ({
    id: offerData.id,
    title: offerData.title,
    description: offerData.description,
    discount: offerData.discount,
    validFrom: offerData.valid_from,
    validTo: offerData.valid_to,
    minPrice: offerData.min_price,
    maxDiscount: offerData.max_discount,
    isActive: offerData.is_active,
    createdAt: offerData.created_at,
    updatedAt: offerData.updated_at,
    applicableFlights: offerData.applicable_flights,
    applicableAirlines: offerData.applicable_airlines,
    applicableRoutes: offerData.applicable_routes as { origin: string; destination: string }[] | undefined,
  }),

  async createOffer(offerData: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Offer>> {
    return handleApiResponse(
      apiClient
        .post("/content/offers", {
          title: offerData.title,
          description: offerData.description,
          discount: offerData.discount,
          valid_from: offerData.validFrom,
          valid_to: offerData.validTo,
          min_price: offerData.minPrice,
          max_discount: offerData.maxDiscount,
          is_active: offerData.isActive,
          applicable_flights: offerData.applicableFlights,
          applicable_airlines: offerData.applicableAirlines,
          applicable_routes: offerData.applicableRoutes,
        })
        .then((response) => ({
          ...response,
          data: contentApi.mapOfferData(response.data),
        }))
    );
  },

  async updateOffer(id: string, offerData: Partial<Offer>): Promise<ApiResponse<Offer>> {
    return handleApiResponse(
      apiClient
        .put(`/content/offers/${id}`, {
          title: offerData.title,
          description: offerData.description,
          discount: offerData.discount,
          valid_from: offerData.validFrom,
          valid_to: offerData.validTo,
          min_price: offerData.minPrice,
          max_discount: offerData.maxDiscount,
          is_active: offerData.isActive,
          applicable_flights: offerData.applicableFlights,
          applicable_airlines: offerData.applicableAirlines,
          applicable_routes: offerData.applicableRoutes,
        })
        .then((response) => ({
          ...response,
          data: contentApi.mapOfferData(response.data),
        }))
    );
  },

  async deleteOffer(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.delete(`/content/offers/${id}`));
  },
};

// Statistics API
export const statisticsApi = {
  async getCompanyStatistics(
    airlineId: string,
    period: StatisticsPeriod = "all"
  ): Promise<ApiResponse<CompanyStatistics>> {
    return handleApiResponse(
      apiClient.get(`/statistics/company/${airlineId}?period=${period}`).then((response) => ({
        ...response,
        data: {
          totalFlights: response.data.total_flights,
          activeFlights: response.data.active_flights,
          completedFlights: response.data.completed_flights,
          totalPassengers: response.data.total_passengers,
          totalRevenue: response.data.total_revenue,
          period: response.data.period,
        },
      }))
    );
  },

  async getAdminStatistics(period: StatisticsPeriod = "all"): Promise<ApiResponse<AdminStatistics>> {
    return handleApiResponse(
      apiClient.get(`/statistics/admin?period=${period}`).then((response) => ({
        ...response,
        data: {
          totalFlights: response.data.total_flights,
          activeFlights: response.data.active_flights,
          completedFlights: response.data.completed_flights,
          totalPassengers: response.data.total_passengers,
          totalRevenue: response.data.total_revenue,
          totalUsers: response.data.total_users,
          totalAirlines: response.data.total_airlines,
          totalBookings: response.data.total_bookings,
          period: response.data.period,
        },
      }))
    );
  },
};

// User Management API
export const userApi = {
  // Helper function to map user data from backend format to frontend format
  mapUserData: (userData: BackendUser): User => ({
    id: userData.id,
    email: userData.email,
    password: userData.password || "",
    firstName: userData.first_name,
    lastName: userData.last_name,
    phone: userData.phone,
    role: userData.role as UserRole,
    airlineId: userData.airline_id,
    isBlocked: userData.is_blocked,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
  }),

  async getAllUsers(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> {
    return handleApiResponse(
      apiClient.get(`/users?skip=${(page - 1) * limit}&limit=${limit}`).then((response) => ({
        ...response,
        data: {
          data: response.data.map((user: BackendUser) => userApi.mapUserData(user)),
          total: response.data.length, // Backend should provide total count
          page,
          limit,
          totalPages: Math.ceil(response.data.length / limit),
        },
      }))
    );
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return handleApiResponse(
      apiClient.get(`/users/${id}`).then((response) => ({
        ...response,
        data: userApi.mapUserData(response.data),
      }))
    );
  },

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return handleApiResponse(
      apiClient
        .put(`/users/${id}`, {
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          airline_id: userData.airlineId,
          is_blocked: userData.isBlocked,
        })
        .then((response) => ({
          ...response,
          data: userApi.mapUserData(response.data),
        }))
    );
  },

  async blockUser(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.post(`/users/${id}/block`));
  },

  async unblockUser(id: string): Promise<ApiResponse<void>> {
    return handleApiResponse(apiClient.post(`/users/${id}/unblock`));
  },

  async getCompanyManagers(): Promise<ApiResponse<User[]>> {
    return handleApiResponse(
      apiClient.get("/users/managers/company-managers").then((response) => ({
        ...response,
        data: response.data.map((user: BackendUser) => userApi.mapUserData(user)),
      }))
    );
  },

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<User>> {
    return handleApiResponse(
      apiClient
        .post("/users", {
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          airline_id: userData.airlineId,
        })
        .then((response) => ({
          ...response,
          data: userApi.mapUserData(response.data),
        }))
    );
  },
};
