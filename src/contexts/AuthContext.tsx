"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log("AuthContext session:", session);
    if (session?.user) {
      console.log("Setting user with role:", session.user.role);
      setUser({
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        password: "123",
        phone: "", // Not available from session
        role: session.user.role as "regular" | "company_manager" | "admin",
        isBlocked: false,
        createdAt: "",
        updatedAt: "",
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
