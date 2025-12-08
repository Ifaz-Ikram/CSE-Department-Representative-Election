import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { invalidateCandidateCache } from "@/lib/cache";

const PRESETS_DIR = path.join(process.cwd(), "data", "presets");

// Ensure presets directory exists
async function ensurePresetsDir() {
    try {
        await fs.access(PRESETS_DIR);
    } catch {
        await fs.mkdir(PRESETS_DIR, { recursive: true });
    }
}

interface CandidatePreset {
    name: string;
    indexNumber: string;
    email: string | null;
    symbol: string | null;
    photoUrl: string | null;
    languages: string[];
}

interface PresetFile {
    name: string;
    description: string;
    createdAt: string;
    candidates: CandidatePreset[];
}

// GET - List all available presets
export async function GET() {
    try {
        await requireRole(["super_admin"]);
        await ensurePresetsDir();

        const files = await fs.readdir(PRESETS_DIR);
        const presets = [];

        for (const file of files) {
            if (file.endsWith(".json")) {
                const filePath = path.join(PRESETS_DIR, file);
                const content = await fs.readFile(filePath, "utf-8");
                const data: PresetFile = JSON.parse(content);
                presets.push({
                    id: file.replace(".json", ""),
                    name: data.name,
                    description: data.description,
                    candidateCount: data.candidates.length,
                    createdAt: data.createdAt,
                });
            }
        }

        return NextResponse.json({ presets });
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
        await requireRole(["super_admin"]);
        const body = await request.json();
        const { electionId, presetName, description } = body;

        if (!electionId || !presetName) {
            return NextResponse.json(
                { error: "electionId and presetName are required" },
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

        // Create preset file
        const preset: PresetFile = {
            name: presetName,
            description: description || "",
            createdAt: new Date().toISOString(),
            candidates: candidates.map((c) => ({
                name: c.name,
                indexNumber: c.indexNumber,
                email: c.email,
                symbol: c.symbol,
                photoUrl: c.photoUrl,
                languages: c.languages || [],
            })),
        };

        await ensurePresetsDir();

        // Create safe filename
        const safeFilename = presetName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const filePath = path.join(PRESETS_DIR, `${safeFilename}.json`);

        await fs.writeFile(filePath, JSON.stringify(preset, null, 2));

        return NextResponse.json({
            success: true,
            preset: {
                id: safeFilename,
                name: presetName,
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
        await requireRole(["super_admin"]);
        const body = await request.json();
        const { electionId, presetId } = body;

        if (!electionId || !presetId) {
            return NextResponse.json(
                { error: "electionId and presetId are required" },
                { status: 400 }
            );
        }

        // Read preset file
        const filePath = path.join(PRESETS_DIR, `${presetId}.json`);
        let preset: PresetFile;
        try {
            const content = await fs.readFile(filePath, "utf-8");
            preset = JSON.parse(content);
        } catch {
            return NextResponse.json({ error: "Preset not found" }, { status: 404 });
        }

        // Add candidates from preset to the election
        let addedCount = 0;
        let skippedCount = 0;
        const skippedCandidates: string[] = [];

        for (const candidate of preset.candidates) {
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
