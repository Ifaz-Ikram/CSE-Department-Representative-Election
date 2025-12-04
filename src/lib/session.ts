import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

type UserRole = "voter" | "admin" | "super_admin";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
