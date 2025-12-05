import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAuditEvent, AuditActions, AuditCategories } from "@/lib/auditLog";
import { sanitizeInput, sanitizeHtml, sanitizeUrl, sanitizeEmail } from "@/lib/sanitize";

const CreateCandidateSchema = z.object({
  electionId: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1),
  indexNumber: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  languages: z.array(z.enum(["English", "Sinhala", "Tamil"])).optional().default([]),
});

const UpdateCandidateSchema = z.object({
  id: z.string(),
  bio: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional().or(z.literal("")).or(z.null()),
  languages: z.array(z.enum(["English", "Sinhala", "Tamil"])).optional(),
});


export async function POST(request: NextRequest) {
  try {
    await requireRole(["super_admin"]);
    const body = await request.json();
    const data = CreateCandidateSchema.parse(body);

    // SECURITY: Validate candidate is from the 200-student whitelist
    if (data.email && data.email.trim() !== "") {
      const sanitizedEmail = sanitizeEmail(data.email);
      if (!sanitizedEmail) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
      
      const registryEntry = await prisma.voterRegistry.findUnique({
        where: { email: sanitizedEmail },
      });

      if (!registryEntry || !registryEntry.isActive) {
        return NextResponse.json(
          {
            error: "Candidate must be from the authorized CSE23 voter list",
            details: "Only students from the 200-person whitelist can be candidates"
          },
          { status: 400 }
        );
      }
    }

    // Sanitize all input fields
    const sanitizedName = sanitizeInput(data.name, 100);
    const sanitizedIndexNumber = sanitizeInput(data.indexNumber, 20);
    const sanitizedEmail = data.email ? sanitizeEmail(data.email) : null;
    const sanitizedBio = data.bio ? sanitizeHtml(data.bio) : undefined;
    const sanitizedPhotoUrl = data.photoUrl ? sanitizeUrl(data.photoUrl) : null;

    // Find or create user for the candidate (only if email is provided)
    let userId = data.userId || null;

    if (sanitizedEmail && sanitizedEmail.trim() !== "") {
      let user = await prisma.user.findUnique({
        where: { email: sanitizedEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: sanitizedEmail,
            name: sanitizedName,
            indexNumber: sanitizedIndexNumber,
            role: "voter",
          },
        });
      }
      userId = user.id;
    }

    const candidate = await prisma.candidate.create({
      data: {
        electionId: data.electionId,
        userId: userId,
        name: sanitizedName,
        indexNumber: sanitizedIndexNumber,
        email: sanitizedEmail,
        bio: sanitizedBio,
        photoUrl: sanitizedPhotoUrl,
        languages: data.languages || [],
      },
    });

    // Log audit event
    const session = await requireRole(["super_admin"]);
    await logAuditEvent({
      action: AuditActions.CANDIDATE_ADDED,
      category: AuditCategories.CANDIDATE,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Candidate',
      targetId: candidate.id,
      targetName: candidate.name,
      details: { electionId: candidate.electionId, indexNumber: candidate.indexNumber },
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole(["super_admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Candidate ID required" },
        { status: 400 }
      );
    }

    // Get candidate info before deleting for audit log
    const candidate = await prisma.candidate.findUnique({ where: { id } });

    await prisma.candidate.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      action: AuditActions.CANDIDATE_REMOVED,
      category: AuditCategories.CANDIDATE,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Candidate',
      targetId: id,
      targetName: candidate?.name || 'Unknown',
      details: { electionId: candidate?.electionId },
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

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(["super_admin"]);
    const body = await request.json();
    const data = UpdateCandidateSchema.parse(body);

    const candidate = await prisma.candidate.update({
      where: { id: data.id },
      data: {
        bio: data.bio,
        photoUrl: data.photoUrl === "" ? null : data.photoUrl,
        ...(data.languages !== undefined && { languages: data.languages }),
      },
    });

    // Log audit event
    await logAuditEvent({
      action: AuditActions.CANDIDATE_UPDATED,
      category: AuditCategories.CANDIDATE,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Candidate',
      targetId: candidate.id,
      targetName: candidate.name,
      details: { bio: data.bio, photoUrl: data.photoUrl, languages: data.languages },
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

    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
