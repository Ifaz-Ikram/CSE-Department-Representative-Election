import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, AuditActions, AuditCategories } from '@/lib/auditLog';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateRoleSchema = z.object({
    userId: z.string(),
    newRole: z.enum(['voter', 'admin', 'super_admin']),
});

// GET /api/admin/users - Fetch all users (view for admin + super_admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        // Both admin and super_admin can view users
        if (!session?.user || (userRole !== 'super_admin' && userRole !== 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({
            orderBy: [
                { role: 'asc' },
                { name: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                email: true,
                indexNumber: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        const currentUserEmail = session?.user?.email;

        // Only super_admin can change roles
        if (!session?.user || userRole !== 'super_admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Super Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, newRole } = UpdateRoleSchema.parse(body);

        // Get the target user
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent changing your own role (safety measure)
        if (targetUser.email === currentUserEmail) {
            return NextResponse.json(
                { error: 'You cannot change your own role' },
                { status: 400 }
            );
        }

        const oldRole = targetUser.role;

        // Update the user's role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        // Log the role change
        await logAuditEvent({
            action: AuditActions.USER_ROLE_CHANGED,
            category: AuditCategories.USER,
            actorEmail: currentUserEmail || 'unknown',
            actorRole: userRole,
            targetType: 'User',
            targetId: userId,
            targetName: targetUser.name || targetUser.email || 'Unknown',
            details: {
                oldRole,
                newRole,
                userEmail: targetUser.email,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: `Role changed from ${oldRole} to ${newRole}`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Failed to update user role:', error);
        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
