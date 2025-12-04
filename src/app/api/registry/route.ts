import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins and super_admins can access voter registry
    const user = session.user as { role: string };
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all active voters from registry
    const registry = await prisma.voterRegistry.findMany({
      where: { isActive: true },
      orderBy: { regNo: "asc" },
      select: {
        regNo: true,
        firstName: true,
        lastName: true,
        email: true,
        indexNumber: true,
      },
    });

    return NextResponse.json(registry);
  } catch (error) {
    console.error("Error fetching voter registry:", error);
    return NextResponse.json(
      { error: "Failed to fetch voter registry" },
      { status: 500 }
    );
  }
}
