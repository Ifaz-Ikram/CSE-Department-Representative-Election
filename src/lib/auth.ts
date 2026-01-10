import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { monitorAuthFailure, monitorSecurityEvent, AlertSeverity } from "./monitoring";

function normalizeName(raw: string | null | undefined): string {
  if (!raw) return "";
  const lower = raw.trim().toLowerCase();
  if (!lower) return "";
  return lower[0].toUpperCase() + lower.slice(1);
}

export const authOptions: NextAuthOptions = {
  // Removed PrismaAdapter - we handle user creation manually in signIn callback
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        // Timing attack mitigation: Add random delay
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100)); // 100-300ms
        monitorAuthFailure("No email provided", undefined, undefined);
        return "/?error=InvalidDomain";
      }

      // 1) Check whitelist - must be in the authorized voter registry
      const registry = await prisma.voterRegistry.findUnique({
        where: { email: user.email },
      });

      if (!registry || !registry.isActive) {
        // Not in our whitelist of 200 CSE23 students - deny access

        // Timing attack mitigation: Add random delay
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100)); // 100-300ms

        monitorAuthFailure(
          "User not in voter registry or inactive",
          user.email,
          undefined
        );
        monitorSecurityEvent(
          "unauthorized_login_attempt",
          AlertSeverity.WARNING,
          { email: user.email, reason: "not_in_whitelist" }
        );
        return "/?error=NotWhitelisted";
      }

      // 2) Build normalized full name
      const firstName = normalizeName(registry.firstName);
      const lastName = normalizeName(registry.lastName);
      const fullName = (firstName + " " + lastName).trim() || (user.name ?? "");

      // 3) Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: registry.email },
      });

      if (existingUser) {
        // User exists - update name, indexNumber, and image, preserve role
        await prisma.user.update({
          where: { email: registry.email },
          data: {
            name: fullName,
            indexNumber: registry.regNo,
            image: user.image || existingUser.image, // Update image from Google
            // Don't touch role - preserves super_admin if already set
          },
        });
      } else {
        // New user - create with voter role
        await prisma.user.create({
          data: {
            email: registry.email,
            name: fullName,
            indexNumber: registry.regNo,
            image: user.image, // Save Google profile picture
            role: "voter", // All new users start as voter
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, role: true, indexNumber: true, image: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role as "voter" | "admin" | "super_admin";
          session.user.indexNumber = dbUser.indexNumber || "";
          session.user.image = dbUser.image || session.user.image;
        }
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // Set token expiration
      if (!token.exp) {
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      }

      // On sign in, store account info
      if (account) {
        token.accessToken = account.access_token;
      }

      // Force refresh user data if session was updated
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.role = dbUser.role as "voter" | "admin" | "super_admin";
        }
      }

      return token;
    },
    async redirect({ url, baseUrl }) {
      try {
        const parsed = new URL(url, baseUrl);

        // If NextAuth is trying to send us back with an AccessDenied error,
        // ignore it and just go to the base URL
        if (parsed.searchParams.get("error") === "AccessDenied") {
          return baseUrl;
        }

        // If redirect is within the same origin, allow it
        if (parsed.origin === baseUrl) {
          return parsed.toString();
        }

        // For any external or weird URL, always fall back to base URL
        return baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh token if older than this
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
