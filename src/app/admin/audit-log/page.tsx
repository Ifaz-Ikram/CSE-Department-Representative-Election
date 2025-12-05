"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import GlowDivider from "@/components/GlowDivider";

interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    category: string;
    actorEmail: string;
    actorRole: string;
    targetType: string | null;
    targetId: string | null;
    targetName: string | null;
    details: any;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const categoryColors: Record<string, string> = {
    ELECTION: "bg-cyan/20 text-cyan border-cyan/50",
    CANDIDATE: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    VOTE: "bg-green-500/20 text-green-400 border-green-500/50",
    AUTH: "bg-gold/20 text-gold border-gold/50",
    USER: "bg-orange-500/20 text-orange-400 border-orange-500/50",
};

const actionIcons: Record<string, string> = {
    ELECTION_CREATED: "🗳️",
    ELECTION_UPDATED: "✏️",
    ELECTION_DELETED: "🗑️",
    ELECTION_VISIBILITY_CHANGED: "👁️",
    CANDIDATE_ADDED: "➕",
    CANDIDATE_UPDATED: "✏️",
    CANDIDATE_REMOVED: "➖",
    VOTE_CAST: "✅",
    ADMIN_LOGIN: "🔐",
    USER_ROLE_CHANGED: "👤",
};

export default function AuditLogPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [category, setCategory] = useState("");
    const [actor, setActor] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    // Check authorization
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (session) {
            const role = (session.user as any)?.role;
            // Both admin and super_admin can access
            if (role !== "super_admin" && role !== "admin") {
                router.push("/admin");
            }
        }
    }, [status, session, router]);

    const userRole = (session?.user as any)?.role;
    const isSuperAdmin = userRole === "super_admin";

    // Fetch logs
    useEffect(() => {
        if (userRole === "super_admin" || userRole === "admin") {
            fetchLogs();
        }
    }, [session, category, actor, startDate, endDate, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (category) params.append("category", category);
            if (actor) params.append("actor", actor);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            params.append("page", page.toString());

            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (!res.ok) {
                throw new Error("Failed to fetch audit logs");
            }
            const data = await res.json();
            setLogs(data.logs);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError("Failed to load audit logs");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    };

    if (status === "loading" || (session && userRole !== "super_admin" && userRole !== "admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center circuit-bg">
                <div className="text-center space-y-4">
                    <div className="loading-spinner mx-auto" />
                    <p className="text-cyan text-lg animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen circuit-bg">
            <Navigation />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in">
                        <Link
                            href="/admin"
                            className="text-cyan hover:text-cyan-light mb-4 inline-flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Admin Dashboard</span>
                        </Link>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-2">
                            Audit <span className="text-gradient glow-text">Log</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Track all administrative actions and system events
                        </p>
                    </div>

                    <GlowDivider className="mb-8" />

                    {/* Filters */}
                    <div className="glass-card p-6 mb-8 animate-slide-up">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Filters</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-cyan text-sm font-bold mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                                    className="input-field w-full"
                                >
                                    <option value="">All Categories</option>
                                    <option value="ELECTION">Election</option>
                                    <option value="CANDIDATE">Candidate</option>
                                    <option value="USER">User</option>
                                    {/* Only super_admin can filter by Vote category */}
                                    {isSuperAdmin && <option value="VOTE">Vote</option>}
                                    <option value="AUTH">Auth</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-cyan text-sm font-bold mb-2">Actor Email</label>
                                <input
                                    type="text"
                                    value={actor}
                                    onChange={(e) => { setActor(e.target.value); setPage(1); }}
                                    placeholder="Search by email..."
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-cyan text-sm font-bold mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-cyan text-sm font-bold mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    className="input-field w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    {pagination && (
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-400">
                                Showing <span className="text-cyan font-semibold">{logs.length}</span> of{" "}
                                <span className="text-cyan font-semibold">{pagination.total}</span> entries
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="glass-card p-6 text-center text-red-400 mb-8">
                            <p>{error}</p>
                            <button onClick={fetchLogs} className="btn-secondary mt-4">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="loading-spinner" />
                        </div>
                    )}

                    {/* Logs Table */}
                    {!loading && !error && (
                        <div className="glass-card overflow-hidden animate-slide-up">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-cyan/20 bg-navy-dark/50">
                                            <th className="px-6 py-4 text-left text-cyan text-sm font-bold uppercase tracking-wide">
                                                Timestamp
                                            </th>
                                            <th className="px-6 py-4 text-left text-cyan text-sm font-bold uppercase tracking-wide">
                                                Action
                                            </th>
                                            <th className="px-6 py-4 text-left text-cyan text-sm font-bold uppercase tracking-wide">
                                                Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-cyan text-sm font-bold uppercase tracking-wide">
                                                Actor
                                            </th>
                                            <th className="px-6 py-4 text-left text-cyan text-sm font-bold uppercase tracking-wide">
                                                Target
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                                    <svg className="w-12 h-12 mx-auto mb-4 text-cyan/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    No audit logs found
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="border-b border-cyan/10 hover:bg-cyan/5 transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-gray-300 text-sm whitespace-nowrap">
                                                        {formatDate(log.timestamp)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg">{actionIcons[log.action] || "📋"}</span>
                                                            <span className="text-white font-medium">
                                                                {formatAction(log.action)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[log.category] || "bg-gray-500/20 text-gray-400"
                                                                }`}
                                                        >
                                                            {log.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-white text-sm">{log.actorEmail}</p>
                                                            <p className="text-gray-500 text-xs">{log.actorRole}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                                        {log.targetName || log.targetType || "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center space-x-4 p-6 border-t border-cyan/20">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-400">
                                        Page <span className="text-cyan font-semibold">{page}</span> of{" "}
                                        <span className="text-cyan font-semibold">{pagination.totalPages}</span>
                                    </span>
                                    <button
                                        onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                        disabled={page === pagination.totalPages}
                                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
