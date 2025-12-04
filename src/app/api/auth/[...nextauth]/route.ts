import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;

      if (!email || !allowedDomain) return false;

      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (emailDomain !== allowedDomain.toLowerCase()) {
        return false;
      }

      return true;
    },

    // Store extra fields in the JWT
    async jwt({ token, user }) {
      if (user) {
        // user comes from Prisma (adapter) on first login
        // @ts-expect-error - extending token
        token.id = (user as any).id;
        // @ts-expect-error
        token.role = (user as any).role ?? "voter";
        // @ts-expect-error
        token.indexNumber = (user as any).indexNumber ?? null;
      }
      return token;
    },

    // Expose them on session.user
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - extending session user
        session.user.id = token.id;
        // @ts-expect-error
        session.user.role = token.role ?? "voter";
        // @ts-expect-error
        session.user.indexNumber = token.indexNumber ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // landing page
    error: "/",  // send errors back to home with ?error=
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
