import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");

    if (!electionId) {
      return NextResponse.json(
        { error: "Election ID required" },
        { status: 400 }
      );
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isElectionActive = now >= election.startTime && now <= election.endTime;
    const isElectionEnded = now > election.endTime;

    // Access control for voter-candidate mapping
    const isSuperAdmin = session.user.role === "super_admin";
    const isAdmin = session.user.role === "admin";

    // During election: only super_admin
    if (isElectionActive && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // After election: super_admin always, admins only after resultsVisible
    if (isElectionEnded) {
      if (!isSuperAdmin && (!isAdmin || !election.resultsVisible)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get all ballots with voter and candidate information
    const ballots = await prisma.ballot.findMany({
      where: { electionId },
      include: {
        voter: {
          select: {
            id: true,
            name: true,
            email: true,
            indexNumber: true,
          },
        },
        choices: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                indexNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ ballots, election });
  } catch (error) {
    console.error("Get ballots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
