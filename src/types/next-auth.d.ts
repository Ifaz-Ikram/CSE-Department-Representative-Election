import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: "voter" | "admin" | "super_admin";
      indexNumber: string;
    };
  }

  interface User extends DefaultUser {
    role: "voter" | "admin" | "super_admin";
    indexNumber?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    role: "voter" | "admin" | "super_admin";
    indexNumber?: string | null;
  }
}
