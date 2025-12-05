import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// Action types for type safety
export const AuditActions = {
    // Election actions
    ELECTION_CREATED: 'ELECTION_CREATED',
    ELECTION_UPDATED: 'ELECTION_UPDATED',
    ELECTION_DELETED: 'ELECTION_DELETED',
    ELECTION_VISIBILITY_CHANGED: 'ELECTION_VISIBILITY_CHANGED',

    // Candidate actions
    CANDIDATE_ADDED: 'CANDIDATE_ADDED',
    CANDIDATE_UPDATED: 'CANDIDATE_UPDATED',
    CANDIDATE_REMOVED: 'CANDIDATE_REMOVED',

    // Vote actions
    VOTE_CAST: 'VOTE_CAST',

    // User/Auth actions
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
} as const;

export const AuditCategories = {
    ELECTION: 'ELECTION',
    CANDIDATE: 'CANDIDATE',
    VOTE: 'VOTE',
    AUTH: 'AUTH',
    USER: 'USER',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
export type AuditCategory = typeof AuditCategories[keyof typeof AuditCategories];

interface LogAuditEventParams {
    action: AuditAction;
    category: AuditCategory;
    actorEmail: string;
    actorRole: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: Prisma.InputJsonValue;
}

/**
 * Log an audit event to the database.
 * This function is fire-and-forget - it won't throw errors to avoid
 * disrupting the main operation flow.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                category: params.category,
                actorEmail: params.actorEmail,
                actorRole: params.actorRole,
                targetType: params.targetType,
                targetId: params.targetId,
                targetName: params.targetName,
                details: params.details,
            },
        });
    } catch (error) {
        // Log to console but don't throw - audit logging should not break main operations
        console.error('Failed to log audit event:', error);
    }
}

/**
 * Log an anonymous vote event.
 * This specifically does NOT log voter identity to maintain ballot secrecy.
 */
export async function logAnonymousVote(electionId: string, electionName: string): Promise<void> {
    await logAuditEvent({
        action: AuditActions.VOTE_CAST,
        category: AuditCategories.VOTE,
        actorEmail: 'ANONYMOUS',
        actorRole: 'voter',
        targetType: 'Election',
        targetId: electionId,
        targetName: electionName,
        details: { anonymized: true },
    });
}
