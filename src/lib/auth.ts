import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

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
      if (!user.email) return "/?error=InvalidDomain";

      // Check if it's a CSE email but not CSE23
      if (user.email.endsWith('@cse.mrt.ac.lk') && !user.email.includes('.23@cse.mrt.ac.lk')) {
        // CSE email but wrong batch
        return "/?error=NotCSE23";
      }

      // 1) Check whitelist - must be in the 200 authorized CSE23 students
      const registry = await prisma.voterRegistry.findUnique({
        where: { email: user.email },
      });

      if (!registry || !registry.isActive) {
        // Not in our whitelist of 200 CSE23 students - deny access
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
