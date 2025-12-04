import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

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

    // Access control
    const isSuperAdmin = session.user.role === UserRole.super_admin;
    const isAdmin = session.user.role === UserRole.admin;

    // During election: only super_admin can see stats
    if (isElectionActive && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // After election: only super_admin can see stats unless resultsVisible is true
    if (isElectionEnded && !isSuperAdmin) {
      if (!election.resultsVisible) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // If resultsVisible but user is not admin or super_admin, they can't see detailed stats
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get vote counts per candidate
    const candidates = await prisma.candidate.findMany({
      where: { electionId },
      include: {
        _count: {
          select: {
            ballotChoices: true,
          },
        },
      },
      orderBy: {
        ballotChoices: {
          _count: "desc",
        },
      },
    });

    const stats = candidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      indexNumber: candidate.indexNumber,
      email: candidate.email,
      photoUrl: candidate.photoUrl,
      voteCount: candidate._count.ballotChoices,
    }));

    const totalBallots = await prisma.ballot.count({
      where: { electionId },
    });

    return NextResponse.json({
      stats,
      totalBallots,
      election: {
        id: election.id,
        name: election.name,
        startTime: election.startTime,
        endTime: election.endTime,
        resultsVisible: election.resultsVisible,
        publicResultsVisible: election.publicResultsVisible,
      },
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
