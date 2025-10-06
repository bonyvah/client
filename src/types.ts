// User Types
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  airlineId?: string; // For company managers - which airline they manage
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "regular" | "company_manager" | "admin";

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}

// Flight and Airline Types
export interface Flight {
  id: string;
  flightNumber: string;
  airlineId: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in minutes
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: FlightStatus;
  layovers?: Layover[];
  createdAt: string;
  updatedAt: string;
}

export type FlightStatus = "scheduled" | "boarding" | "departed" | "arrived" | "cancelled" | "delayed";

export interface Airline {
  id: string;
  name: string;
  code: string; // IATA code like "AA", "DL"
  logo?: string;
  description?: string;
  isActive: boolean;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Airport {
  id: string;
  name: string;
  code: string; // IATA code like "JFK", "LAX"
  city: string;
  country: string;
  timezone: string;
}

export interface Layover {
  airport: Airport;
  arrivalTime: string;
  departureTime: string;
  duration: number; // in minutes
}

// Booking and Ticket Types
export interface Booking {
  id: string;
  confirmationId: string;
  userId: string;
  user: User;
  flightId: string;
  flight: Flight;
  passengers: Passenger[];
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookedAt: string;
}

export type BookingStatus = "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality?: string;
}

// Search and Filter Types
export interface FlightSearchParams {
  origin: string; // airport code
  destination: string; // airport code
  departureDate: string;
  returnDate?: string; // for round trips
  passengers: number;
  tripType: "one-way" | "round-trip";
}

export interface FlightFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  airlines?: string[]; // airline IDs
  departureTimeRange?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  arrivalTimeRange?: {
    start: string;
    end: string;
  };
  maxStops?: number;
  duration?: {
    max: number; // in minutes
  };
}

// Statistics Types
export interface CompanyStatistics {
  totalFlights: number;
  activeFlights: number;
  completedFlights: number;
  totalPassengers: number;
  totalRevenue: number;
  period: StatisticsPeriod;
}

export interface AdminStatistics extends CompanyStatistics {
  totalUsers: number;
  totalAirlines: number;
  totalBookings: number;
}

export type StatisticsPeriod = "today" | "week" | "month" | "all";

// Content Management Types
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  discount: number; // percentage
  validFrom: string;
  validTo: string;
  applicableFlights?: string[]; // flight IDs
  applicableAirlines?: string[]; // airline IDs
  applicableRoutes?: {
    origin: string;
    destination: string;
  }[];
  minPrice?: number; // minimum price to apply discount
  maxDiscount?: number; // maximum discount amount in currency
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Discount Calculation Types
export interface DiscountedPrice {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedOffer?: Offer;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface FlightForm {
  flightNumber: string;
  originId: string;
  destinationId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
}

export interface BookingForm {
  flightId: string;
  passengers: Omit<Passenger, "id">[];
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = "flight_reminder" | "booking_confirmation" | "flight_update" | "system";
