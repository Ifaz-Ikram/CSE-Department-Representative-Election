import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const elections = await prisma.election.findMany({
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
