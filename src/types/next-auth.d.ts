declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "voter" | "admin" | "super_admin";
      indexNumber: string;
    };
  }

  interface User {
    role: string;
    indexNumber?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    indexNumber?: string;
  }
}
