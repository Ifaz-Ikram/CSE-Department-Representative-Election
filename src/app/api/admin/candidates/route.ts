import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const CreateCandidateSchema = z.object({
  electionId: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1),
  indexNumber: z.string().min(1),
  email: z.string().email(),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole([UserRole.super_admin]);
    const body = await req.json();
    const data = CreateCandidateSchema.parse(body);

    // Find or create user for the candidate
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          indexNumber: data.indexNumber,
          role: UserRole.voter,
        },
      });
    }

    const candidate = await prisma.candidate.create({
      data: {
        electionId: data.electionId,
        userId: user.id,
        name: data.name,
        indexNumber: data.indexNumber,
        email: data.email,
        bio: data.bio,
        photoUrl: data.photoUrl,
      },
    });

    return NextResponse.json({ success: true, candidate });
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
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    console.error("Create candidate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole([UserRole.super_admin]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Candidate ID required" },
        { status: 400 }
      );
    }

    await prisma.candidate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    console.error("Delete candidate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
