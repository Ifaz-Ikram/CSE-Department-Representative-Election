import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateElectionCache } from "@/lib/cache";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    // Only super admins can extend elections
    if (userRole !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can extend elections" },
        { status: 403 }
      );
    }

    const { newEndTime } = await req.json();

    if (!newEndTime) {
      return NextResponse.json(
        { error: "New end time is required" },
        { status: 400 }
      );
    }

    const newEndDate = new Date(newEndTime);
    const now = new Date();

    // Validate new end time is in the future
    if (newEndDate <= now) {
      return NextResponse.json(
        { error: "New end time must be in the future" },
        { status: 400 }
      );
    }

    // Get the election
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Validate new end time is after start time
    if (newEndDate <= election.startTime) {
      return NextResponse.json(
        { error: "New end time must be after the start time" },
        { status: 400 }
      );
    }

    // Update the election end time
    const updatedElection = await prisma.election.update({
      where: { id },
      data: { endTime: newEndDate },
    });

    // IMPORTANT: Invalidate cache so the new endTime is immediately available
    await invalidateElectionCache(id);

    return NextResponse.json({
      message: "Election extended successfully",
      election: updatedElection,
    });
  } catch (error) {
    console.error("Error extending election:", error);
    return NextResponse.json(
      { error: "Failed to extend election" },
      { status: 500 }
    );
  }
}
