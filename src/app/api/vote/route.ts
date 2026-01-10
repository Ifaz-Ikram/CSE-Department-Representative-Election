import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logVoteWithDetails } from "@/lib/auditLog";
import { rateLimit } from "@/lib/rateLimit";

const SubmitBallotSchema = z.object({
  electionId: z.string(),
  candidateIds: z.array(z.string()).min(0).max(10),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResponse = await rateLimit(req, "vote");
    if (rateLimitResponse) return rateLimitResponse;

    const session = await requireAuth();
    const body = await req.json();

    // Validate input
    const { electionId, candidateIds } = SubmitBallotSchema.parse(body);

    // Use transaction to ensure atomic validation and update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate Election (Atomic Check)
      const election = await tx.election.findUnique({
        where: { id: electionId },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      const now = new Date();
      if (now < election.startTime) {
        throw new Error("Election has not started yet");
      }

      if (now > election.endTime) {
        throw new Error("Election has ended. Votes are locked.");
      }

      // 2. Validate Candidates
      let candidateNames: string[] = [];
      if (candidateIds.length > 0) {
        const candidates = await tx.candidate.findMany({
          where: {
            id: { in: candidateIds },
            electionId,
          },
          select: { id: true, name: true },
        });

        if (candidates.length !== candidateIds.length) {
          throw new Error("Invalid candidate selection");
        }
        candidateNames = candidates.map(c => c.name);
      }

      // 3. Find or create ballot
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

      // 4. Update choices
      await tx.ballotChoice.deleteMany({
        where: { ballotId: ballot.id },
      });

      if (candidateIds.length > 0) {
        await tx.ballotChoice.createMany({
          data: candidateIds.map((candidateId) => ({
            ballotId: ballot.id,
            candidateId,
          })),
        });
      }

      // 5. Update ballot timestamp
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

      return { ballot, electionName: election.name, candidateNames };
    });

    // Log vote with details (outside transaction to keep it fast, but using data from inside)
    await logVoteWithDetails(
      session.user.email!,
      electionId,
      result.electionName,
      result.candidateNames
    );

    return NextResponse.json({
      success: true,
      ballot: result.ballot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Election not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message === "Election has not started yet" ||
        error.message === "Election has ended. Votes are locked."
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Invalid candidate selection") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
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
