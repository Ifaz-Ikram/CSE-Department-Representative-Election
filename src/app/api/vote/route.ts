import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAnonymousVote } from "@/lib/auditLog";

const SubmitBallotSchema = z.object({
  electionId: z.string(),
  candidateIds: z.array(z.string()).min(0).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Validate input
    const { electionId, candidateIds } = SubmitBallotSchema.parse(body);

    // Check if election exists and is active
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
    if (now < election.startTime) {
      return NextResponse.json(
        { error: "Election has not started yet" },
        { status: 403 }
      );
    }

    if (now > election.endTime) {
      return NextResponse.json(
        { error: "Election has ended. Votes are locked." },
        { status: 403 }
      );
    }

    // Verify all candidate IDs belong to this election
    if (candidateIds.length > 0) {
      const candidates = await prisma.candidate.findMany({
        where: {
          id: { in: candidateIds },
          electionId,
        },
      });

      if (candidates.length !== candidateIds.length) {
        return NextResponse.json(
          { error: "Invalid candidate selection" },
          { status: 400 }
        );
      }
    }

    // Use transaction to ensure atomic update
    const result = await prisma.$transaction(async (tx) => {
      // Find or create ballot
      let ballot =
        (await tx.ballot.findUnique({
          where: {
            electionId_voterId: {
              electionId,
              voterId: session.user.id,
            },
          },
        })) ??
        (await tx.ballot.create({
          data: {
            electionId,
            voterId: session.user.id,
          },
        }));

      // Delete existing choices
      await tx.ballotChoice.deleteMany({
        where: { ballotId: ballot.id },
      });

      // Create new choices
      if (candidateIds.length > 0) {
        await tx.ballotChoice.createMany({
          data: candidateIds.map((candidateId) => ({
            ballotId: ballot.id,
            candidateId,
          })),
        });
      }

      // Update ballot timestamp
      ballot = await tx.ballot.update({
        where: { id: ballot.id },
        data: { updatedAt: new Date() },
        include: {
          choices: {
            include: {
              candidate: true,
            },
          },
        },
      });

      return ballot;
    });

    // Log anonymous vote (no voter identity)
    await logAnonymousVote(electionId, election.name);

    return NextResponse.json({
      success: true,
      ballot: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Vote submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");

    if (!electionId) {
      return NextResponse.json(
        { error: "Election ID required" },
        { status: 400 }
      );
    }

    // Get user's ballot for this election
    const ballot = await prisma.ballot.findUnique({
      where: {
        electionId_voterId: {
          electionId,
          voterId: session.user.id,
        },
      },
      include: {
        choices: {
          include: {
            candidate: true,
          },
        },
        election: true,
      },
    });

    return NextResponse.json({ ballot });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get ballot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
