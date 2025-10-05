import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";

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
            const backendData = response.data as any; // Cast to any to handle backend structure
            const userData = backendData.user || backendData; // Handle both structures

            const user = {
              id: userData.id,
              email: userData.email,
              name: `${userData.first_name || userData.firstName} ${userData.last_name || userData.lastName}`,
              role: userData.role,
              firstName: userData.first_name || userData.firstName,
              lastName: userData.last_name || userData.lastName,
              airlineId: userData.airline_id || userData.airlineId,
              accessToken: backendData.access_token || backendData.accessToken,
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
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.airlineId = user.airlineId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.airlineId = token.airlineId as string;
        session.accessToken = token.accessToken as string;
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
