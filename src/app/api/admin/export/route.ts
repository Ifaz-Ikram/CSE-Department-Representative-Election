import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// CSV Export Types
type ExportType = "results" | "ballots" | "statistics" | "voters";

/**
 * Generate CSV content from data
 */
function generateCSV(headers: string[], rows: string[][]): string {
    const escapeCSV = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerRow = headers.map(escapeCSV).join(",");
    const dataRows = rows.map((row) => row.map(escapeCSV).join(","));

    return [headerRow, ...dataRows].join("\n");
}

export async function GET(request: NextRequest) {
    try {
        // Rate limit check
        const rateLimitResponse = await rateLimit(request, "admin");
        if (rateLimitResponse) return rateLimitResponse;

        const session = await requireRole(["admin", "super_admin"]);
        const { searchParams } = new URL(request.url);
        const electionId = searchParams.get("electionId");
        const exportType = searchParams.get("type") as ExportType;

        if (!electionId) {
            return NextResponse.json(
                { error: "Election ID required" },
                { status: 400 }
            );
        }

        if (!exportType || !["results", "ballots", "statistics", "voters"].includes(exportType)) {
            return NextResponse.json(
                { error: "Valid export type required (results, ballots, statistics, voters)" },
                { status: 400 }
            );
        }

        // Get election
        const election = await prisma.election.findUnique({
            where: { id: electionId },
        });

        if (!election) {
            return NextResponse.json(
                { error: "Election not found" },
                { status: 404 }
            );
        }

        // Check permissions for ballots export (super_admin only)
        if (exportType === "ballots" && session.user.role !== "super_admin") {
            return NextResponse.json(
                { error: "Only super admins can export ballot data" },
                { status: 403 }
            );
        }

        let csv: string;
        let filename: string;

        switch (exportType) {
            case "results": {
                // Get candidates with vote counts
                const candidates = await prisma.candidate.findMany({
                    where: { electionId },
                    include: {
                        _count: {
                            select: { ballotChoices: true },
                        },
                    },
                    orderBy: {
                        ballotChoices: {
                            _count: "desc",
                        },
                    },
                });

                const totalVotes = await prisma.ballot.count({
                    where: { electionId },
                });

                const headers = ["Rank", "Name", "Index Number", "Votes", "Percentage"];
                const rows = candidates.map((c, index) => [
                    String(index + 1),
                    c.name,
                    c.indexNumber,
                    String(c._count.ballotChoices),
                    totalVotes > 0
                        ? ((c._count.ballotChoices / totalVotes) * 100).toFixed(2) + "%"
                        : "0%",
                ]);

                csv = generateCSV(headers, rows);
                filename = `${election.name.replace(/\s+/g, "_")}_Results.csv`;
                break;
            }

            case "ballots": {
                // Get all ballots with voter and candidate info (super_admin only)
                const ballots = await prisma.ballot.findMany({
                    where: { electionId },
                    include: {
                        voter: {
                            select: { name: true, email: true, indexNumber: true },
                        },
                        choices: {
                            include: {
                                candidate: {
                                    select: { name: true, indexNumber: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });

                const headers = [
                    "Voter Name",
                    "Voter Email",
                    "Voter Index",
                    "Voted At",
                    "Last Updated",
                    "Candidates Selected",
                    "Candidate Names",
                ];
                const rows = ballots.map((b) => [
                    b.voter.name,
                    b.voter.email,
                    b.voter.indexNumber || "",
                    b.createdAt.toISOString(),
                    b.updatedAt.toISOString(),
                    String(b.choices.length),
                    b.choices.map((c) => c.candidate.name).join("; "),
                ]);

                csv = generateCSV(headers, rows);
                filename = `${election.name.replace(/\s+/g, "_")}_Ballots.csv`;
                break;
            }

            case "statistics": {
                // Get participation stats
                const totalVoters = await prisma.voterRegistry.count({
                    where: { isActive: true },
                });
                const totalBallots = await prisma.ballot.count({
                    where: { electionId },
                });
                const totalCandidates = await prisma.candidate.count({
                    where: { electionId },
                });

                // Get vote distribution
                const candidates = await prisma.candidate.findMany({
                    where: { electionId },
                    include: {
                        _count: {
                            select: { ballotChoices: true },
                        },
                    },
                });

                const headers = ["Metric", "Value"];
                const rows = [
                    ["Election Name", election.name],
                    ["Election Start", election.startTime.toISOString()],
                    ["Election End", election.endTime.toISOString()],
                    ["Total Registered Voters", String(totalVoters)],
                    ["Total Votes Cast", String(totalBallots)],
                    ["Participation Rate", ((totalBallots / totalVoters) * 100).toFixed(2) + "%"],
                    ["Total Candidates", String(totalCandidates)],
                    ["Results Visible (Admin)", election.resultsVisible ? "Yes" : "No"],
                    ["Results Visible (Public)", election.publicResultsVisible ? "Yes" : "No"],
                    ["---", "---"],
                    ["Candidate Vote Distribution", ""],
                    ...candidates.map((c) => [
                        `  ${c.name} (${c.indexNumber})`,
                        String(c._count.ballotChoices),
                    ]),
                ];

                csv = generateCSV(headers, rows);
                filename = `${election.name.replace(/\s+/g, "_")}_Statistics.csv`;
                break;
            }

            case "voters": {
                // Get list of who voted (just names, not their choices)
                const ballots = await prisma.ballot.findMany({
                    where: { electionId },
                    include: {
                        voter: {
                            select: { name: true, email: true, indexNumber: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                });

                const headers = ["#", "Voter Name", "Index Number", "Voted At"];
                const rows = ballots.map((b, index) => [
                    String(index + 1),
                    b.voter.name,
                    b.voter.indexNumber || "",
                    b.createdAt.toLocaleString(),
                ]);

                csv = generateCSV(headers, rows);
                filename = `${election.name.replace(/\s+/g, "_")}_Voters.csv`;
                break;
            }

            default:
                return NextResponse.json(
                    { error: "Invalid export type" },
                    { status: 400 }
                );
        }

        // Return CSV file
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
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

        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
