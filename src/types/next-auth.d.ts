import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      indexNumber: string;
    };
  }

  interface User {
    role: UserRole;
    indexNumber: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    indexNumber: string;
  }
}
