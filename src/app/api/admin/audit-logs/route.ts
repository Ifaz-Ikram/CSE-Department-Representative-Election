import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit-logs - Fetch audit logs with optional filters
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        // Both admin and super_admin can access audit logs
        if (!session?.user || (userRole !== 'super_admin' && userRole !== 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const isSuperAdmin = userRole === 'super_admin';

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const actor = searchParams.get('actor');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build filter conditions
        const where: any = {};

        // For regular admins: filter out VOTE events (Option A - only super_admin actions)
        if (!isSuperAdmin) {
            where.category = { not: 'VOTE' };
            // If they're also filtering by category, combine the conditions
            if (category && category !== 'VOTE') {
                where.category = category;
            }
        } else if (category) {
            where.category = category;
        }

        if (actor) {
            where.actorEmail = { contains: actor, mode: 'insensitive' };
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }

        // Fetch logs with pagination
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
