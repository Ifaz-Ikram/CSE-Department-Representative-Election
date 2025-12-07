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
        const action = searchParams.get('action');
        const targetName = searchParams.get('targetName');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const getDistinctValues = searchParams.get('distinctValues') === 'true';

        // Build base filter for role-based access
        const baseWhere: any = {};
        if (!isSuperAdmin) {
            baseWhere.category = { not: 'VOTE' };
        }

        // If requesting distinct values for dropdowns, return them
        if (getDistinctValues) {
            const [actions, categories, actors, targets] = await Promise.all([
                prisma.auditLog.findMany({
                    where: baseWhere,
                    select: { action: true },
                    distinct: ['action'],
                }),
                prisma.auditLog.findMany({
                    where: baseWhere,
                    select: { category: true },
                    distinct: ['category'],
                }),
                prisma.auditLog.findMany({
                    where: baseWhere,
                    select: { actorEmail: true },
                    distinct: ['actorEmail'],
                }),
                prisma.auditLog.findMany({
                    where: baseWhere,
                    select: { targetName: true },
                    distinct: ['targetName'],
                }),
            ]);

            return NextResponse.json({
                distinctValues: {
                    actions: actions.map(a => a.action).sort(),
                    categories: categories.map(c => c.category).sort(),
                    actors: actors.map(a => a.actorEmail).sort(),
                    targets: targets.map(t => t.targetName).filter(Boolean).sort(),
                },
            });
        }

        // Build filter conditions for logs query
        const where: any = { ...baseWhere };

        // Override category filter if provided (respecting role restrictions)
        if (category) {
            if (!isSuperAdmin && category === 'VOTE') {
                // Non-super_admin cannot filter by VOTE
                where.category = { not: 'VOTE' };
            } else {
                where.category = category;
            }
        }

        if (actor) {
            where.actorEmail = { contains: actor, mode: 'insensitive' };
        }

        if (action) {
            where.action = action;
        }

        if (targetName) {
            where.targetName = { contains: targetName, mode: 'insensitive' };
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
