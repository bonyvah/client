import axios from "axios";
import { getSession } from "next-auth/react";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: "https://server-raxe.onrender.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get token from NextAuth session
      const session = await getSession();
      const token = session?.accessToken;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to get session token:", error);
      // Fallback to localStorage for manual token storage
      const localToken = localStorage.getItem("access_token");
      if (localToken && config.headers) {
        config.headers.Authorization = `Bearer ${localToken}`;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const newToken = response.data.access_token;
          localStorage.setItem("access_token", newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
