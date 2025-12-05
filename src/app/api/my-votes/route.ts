import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const ballots = await prisma.ballot.findMany({
            where: { voterId: user.id },
            include: {
                election: true,
                choices: {
                    include: {
                        candidate: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json({ ballots });
    } catch (error) {
        console.error("Failed to fetch votes:", error);
        return NextResponse.json(
            { error: "Failed to fetch votes" },
            { status: 500 }
        );
    }
}
