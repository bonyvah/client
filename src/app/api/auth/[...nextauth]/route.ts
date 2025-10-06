import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { authApi } from "@/lib/api";

// Define interfaces for type safety
interface BackendUser {
  id: string;
  email: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role: string;
  airline_id?: string;
  airlineId?: string;
}

interface BackendAuthResponse {
  user?: BackendUser;
  access_token?: string;
  accessToken?: string;
  id?: string;
  email?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role?: string;
  airline_id?: string;
  airlineId?: string;
}

interface NextAuthUser extends User {
  id: string;
  email: string;
  name: string;
  role: string;
  firstName: string;
  lastName: string;
  airlineId?: string;
  accessToken: string;
}

interface ExtendedJWT extends JWT {
  role?: string;
  firstName?: string;
  lastName?: string;
  airlineId?: string;
  accessToken?: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    firstName: string;
    lastName: string;
    airlineId?: string;
  };
  accessToken: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log("Attempting login with:", credentials.email);

          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
          });

          console.log("Login response:", response);

          if (response.success && response.data) {
            // Handle the backend response structure which has user data nested
            const backendData = response.data as BackendAuthResponse; // Cast to interface instead of any
            const userData = backendData.user || backendData; // Handle both structures

            // Validate required fields
            if (!userData.id || !userData.email || !userData.role) {
              console.error("Missing required user data:", userData);
              return null;
            }

            const user: NextAuthUser = {
              id: userData.id,
              email: userData.email,
              name:
                `${userData.first_name || userData.firstName || ""} ${
                  userData.last_name || userData.lastName || ""
                }`.trim() || userData.email,
              role: userData.role,
              firstName: userData.first_name || userData.firstName || "",
              lastName: userData.last_name || userData.lastName || "",
              airlineId: userData.airline_id || userData.airlineId,
              accessToken: backendData.access_token || backendData.accessToken || "",
            };
            console.log("NextAuth user object:", user);
            return user;
          }

          console.log("Login failed:", response.error);
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: ExtendedJWT; user?: NextAuthUser }): Promise<ExtendedJWT> {
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.airlineId = user.airlineId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: ExtendedJWT }): Promise<ExtendedSession> {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role || "";
        session.user.firstName = token.firstName || "";
        session.user.lastName = token.lastName || "";
        session.user.airlineId = token.airlineId;
        session.accessToken = token.accessToken || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  debug: true, // Enable debug mode
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
