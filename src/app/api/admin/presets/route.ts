import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { invalidateCandidateCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeInput, sanitizeHtml } from "@/lib/sanitize";

interface CandidatePresetData {
    name: string;
    indexNumber: string;
    email: string | null;
    symbol: string | null;
    photoUrl: string | null;
    languages: string[];
}

// GET - List all available presets
export async function GET(request: NextRequest) {
    try {
        // Rate limit check
        const rateLimitResponse = await rateLimit(request, "admin");
        if (rateLimitResponse) return rateLimitResponse;

        await requireRole(["super_admin"]);

        const presets = await prisma.candidatePreset.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                description: true,
                candidates: true,
                createdAt: true,
            },
        });

        // Format response to match expected structure
        const formattedPresets = presets.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            candidateCount: Array.isArray(p.candidates) ? p.candidates.length : 0,
            createdAt: p.createdAt.toISOString(),
        }));

        return NextResponse.json({ presets: formattedPresets });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("List presets error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Save current election's candidates as a preset
export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const rateLimitResponse = await rateLimit(request, "admin");
        if (rateLimitResponse) return rateLimitResponse;

        await requireRole(["super_admin"]);
        const body = await request.json();
        const { electionId, presetName, description } = body;

        if (!electionId || !presetName) {
            return NextResponse.json(
                { error: "electionId and presetName are required" },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(presetName, 100);
        const sanitizedDescription = sanitizeHtml(description || "");

        if (!sanitizedName) {
            return NextResponse.json(
                { error: "Invalid preset name" },
                { status: 400 }
            );
        }

        // Check if preset with same name already exists
        const existingPreset = await prisma.candidatePreset.findUnique({
            where: { name: sanitizedName },
        });

        if (existingPreset) {
            return NextResponse.json(
                { error: "A preset with this name already exists" },
                { status: 400 }
            );
        }

        // Get candidates from the election
        const candidates = await prisma.candidate.findMany({
            where: { electionId },
            select: {
                name: true,
                indexNumber: true,
                email: true,
                symbol: true,
                photoUrl: true,
                languages: true,
            },
        });

        if (candidates.length === 0) {
            return NextResponse.json(
                { error: "No candidates found in this election" },
                { status: 400 }
            );
        }

        // Create preset in database
        const candidateData: CandidatePresetData[] = candidates.map((c) => ({
            name: c.name,
            indexNumber: c.indexNumber,
            email: c.email,
            symbol: c.symbol,
            photoUrl: c.photoUrl,
            languages: c.languages || [],
        }));

        const preset = await prisma.candidatePreset.create({
            data: {
                name: sanitizedName,
                description: sanitizedDescription,
                candidates: candidateData,
            },
        });

        return NextResponse.json({
            success: true,
            preset: {
                id: preset.id,
                name: preset.name,
                candidateCount: candidates.length,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("Save preset error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Load a preset into an election
export async function PUT(request: NextRequest) {
    try {
        // Rate limit check
        const rateLimitResponse = await rateLimit(request, "admin");
        if (rateLimitResponse) return rateLimitResponse;

        await requireRole(["super_admin"]);
        const body = await request.json();
        const { electionId, presetId } = body;

        if (!electionId || !presetId) {
            return NextResponse.json(
                { error: "electionId and presetId are required" },
                { status: 400 }
            );
        }

        // Get preset from database
        const preset = await prisma.candidatePreset.findUnique({
            where: { id: presetId },
        });

        if (!preset) {
            return NextResponse.json({ error: "Preset not found" }, { status: 404 });
        }

        // Parse candidates from JSON
        const presetCandidates = preset.candidates as CandidatePresetData[];

        if (!Array.isArray(presetCandidates)) {
            return NextResponse.json({ error: "Invalid preset data" }, { status: 500 });
        }

        // Add candidates from preset to the election
        let addedCount = 0;
        let skippedCount = 0;
        const skippedCandidates: string[] = [];

        for (const candidate of presetCandidates) {
            // Normalize index number for comparison (trim whitespace)
            const normalizedIndexNumber = candidate.indexNumber.trim();

            // Check if candidate already exists in this election by index number
            const existing = await prisma.candidate.findFirst({
                where: {
                    electionId,
                    indexNumber: normalizedIndexNumber,
                },
            });

            if (existing) {
                skippedCount++;
                skippedCandidates.push(`${candidate.name} (${normalizedIndexNumber})`);
                continue;
            }

            // Find or create user if email exists
            let userId: string | null = null;
            if (candidate.email) {
                let user = await prisma.user.findUnique({
                    where: { email: candidate.email },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email: candidate.email,
                            name: candidate.name,
                            indexNumber: candidate.indexNumber,
                            role: "voter",
                        },
                    });
                }
                userId = user.id;
            }

            await prisma.candidate.create({
                data: {
                    electionId,
                    userId,
                    name: candidate.name.trim(),
                    indexNumber: candidate.indexNumber.trim(),
                    email: candidate.email,
                    symbol: candidate.symbol,
                    photoUrl: candidate.photoUrl,
                    languages: candidate.languages || [],
                },
            });

            addedCount++;
        }

        // Invalidate candidate cache to ensure frontend gets fresh data
        await invalidateCandidateCache(electionId);

        return NextResponse.json({
            success: true,
            added: addedCount,
            skipped: skippedCount,
            skippedCandidates,
            message: skippedCount > 0
                ? `Added ${addedCount} new candidates. Skipped ${skippedCount} that already exist: ${skippedCandidates.join(', ')}`
                : `Successfully added ${addedCount} candidates`,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("Load preset error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a preset
export async function DELETE(request: NextRequest) {
    try {
        // Rate limit check
        const rateLimitResponse = await rateLimit(request, "admin");
        if (rateLimitResponse) return rateLimitResponse;

        await requireRole(["super_admin"]);
        const { searchParams } = new URL(request.url);
        const presetId = searchParams.get("id");

        if (!presetId) {
            return NextResponse.json(
                { error: "Preset ID is required" },
                { status: 400 }
            );
        }

        await prisma.candidatePreset.delete({
            where: { id: presetId },
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
        console.error("Delete preset error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
