import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    async signIn({ user, account, profile }) {
      // Only allow emails from the whitelisted domain
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "cse.du.ac.bd";
      
      if (!user.email?.endsWith(`@${allowedDomain}`)) {
        return false;
      }

      // Check if user exists and update indexNumber if needed
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser && !existingUser.indexNumber) {
        // Extract index number from email (e.g., "2307001@cse.du.ac.bd" -> "2307001")
        const indexNumber = user.email.split("@")[0];
        
        await prisma.user.update({
          where: { email: user.email },
          data: {
            indexNumber,
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, role: true, indexNumber: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role as "voter" | "admin" | "super_admin";
          session.user.indexNumber = dbUser.indexNumber || "";
        }
      }
      return session;
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
