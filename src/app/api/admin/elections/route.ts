import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAuditEvent, AuditActions, AuditCategories } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

const CreateElectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const UpdateElectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  resultsVisible: z.boolean().optional(),
  publicResultsVisible: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["super_admin"]);
    const body = await request.json();
    const data = CreateElectionSchema.parse(body);

    const election = await prisma.election.create({
      data: {
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });

    // Log audit event
    await logAuditEvent({
      action: AuditActions.ELECTION_CREATED,
      category: AuditCategories.ELECTION,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Election',
      targetId: election.id,
      targetName: election.name,
      details: { startTime: election.startTime, endTime: election.endTime },
    });

    return NextResponse.json({ success: true, election });
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

    console.error("Create election error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole(["super_admin"]);
    const body = await request.json();
    const data = UpdateElectionSchema.parse(body);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.resultsVisible !== undefined) updateData.resultsVisible = data.resultsVisible;
    if (data.publicResultsVisible !== undefined) updateData.publicResultsVisible = data.publicResultsVisible;

    const election = await prisma.election.update({
      where: { id: data.id },
      data: updateData,
    });

    // Log audit event
    const action = (data.resultsVisible !== undefined || data.publicResultsVisible !== undefined)
      ? AuditActions.ELECTION_VISIBILITY_CHANGED
      : AuditActions.ELECTION_UPDATED;
    await logAuditEvent({
      action,
      category: AuditCategories.ELECTION,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Election',
      targetId: election.id,
      targetName: election.name,
      details: updateData,
    });

    return NextResponse.json({ success: true, election });
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

    console.error("Update election error:", error);
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
        { error: "Election ID required" },
        { status: 400 }
      );
    }

    // Get election name before deleting for audit log
    const electionToDelete = await prisma.election.findUnique({ where: { id } });

    await prisma.election.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      action: AuditActions.ELECTION_DELETED,
      category: AuditCategories.ELECTION,
      actorEmail: session.user.email || 'unknown',
      actorRole: session.user.role,
      targetType: 'Election',
      targetId: id,
      targetName: electionToDelete?.name || 'Unknown',
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

    console.error("Delete election error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
