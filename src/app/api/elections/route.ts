import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOrSetCached, CacheKeys, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    // Cache elections list for 1 minute (frequently accessed)
    const elections = await getOrSetCached(
      CacheKeys.ELECTIONS_LIST,
      async () => {
        return await prisma.election.findMany({
          orderBy: { startTime: "desc" },
          include: {
            _count: {
              select: {
                candidates: true,
                ballots: true,
              },
            },
          },
        });
      },
      CacheTTL.SHORT
    );

    return NextResponse.json({ elections });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get elections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
