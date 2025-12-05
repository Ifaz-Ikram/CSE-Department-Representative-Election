import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOrSetCached, CacheKeys, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

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

    // Cache election data for 5 minutes
    const election = await getOrSetCached(
      CacheKeys.ELECTION(electionId),
      async () => {
        return await prisma.election.findUnique({
          where: { id: electionId },
        });
      },
      CacheTTL.MEDIUM
    );

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Cache candidates list for 5 minutes
    const candidates = await getOrSetCached(
      CacheKeys.CANDIDATES(electionId),
      async () => {
        return await prisma.candidate.findMany({
          where: { electionId },
          orderBy: { id: "asc" },
        });
      },
      CacheTTL.MEDIUM
    );

    return NextResponse.json({ candidates, election });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get candidates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
