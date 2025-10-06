import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { authApi } from "@/lib/api";

// Define interfaces for type safety
interface NextAuthUser extends User {
  id: string;
  email: string;
  name: string;
  role: string;
  firstName: string;
  lastName: string;
  accessToken: string;
}

interface ExtendedJWT extends JWT {
  role?: string;
  firstName?: string;
  lastName?: string;
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
            return {
              id: response.data.id,
              email: response.data.email,
              name: `${response.data.firstName} ${response.data.lastName}`,
              role: response.data.role,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              accessToken: response.data.accessToken,
            };
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
