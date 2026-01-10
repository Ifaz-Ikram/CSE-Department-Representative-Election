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

    // Fetch election data directly (no cache) - election status is critical for UI
    // and must always reflect the latest endTime (especially after extensions)
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

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
