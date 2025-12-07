"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import GlowDivider from "@/components/GlowDivider";
import SearchableDropdown from "@/components/SearchableDropdown";

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

interface DistinctValues {
    actions: string[];
    categories: string[];
    actors: string[];
    targets: string[];
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

    // Distinct values for dropdowns (fetched once from API)
    const [distinctValues, setDistinctValues] = useState<DistinctValues>({
        actions: [],
        categories: [],
        actors: [],
        targets: [],
    });

    // Server-side filters
    const [filterAction, setFilterAction] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterActor, setFilterActor] = useState("");
    const [filterTarget, setFilterTarget] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    // Check authorization
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (session) {
            const role = (session.user as any)?.role;
            if (role !== "super_admin" && role !== "admin") {
                router.push("/admin");
            }
        }
    }, [status, session, router]);

    const userRole = (session?.user as any)?.role;

    // Fetch distinct values for dropdowns (once on mount)
    useEffect(() => {
        if (userRole === "super_admin" || userRole === "admin") {
            fetchDistinctValues();
        }
    }, [userRole]);

    const fetchDistinctValues = async () => {
        try {
            const res = await fetch("/api/admin/audit-logs?distinctValues=true");
            if (res.ok) {
                const data = await res.json();
                setDistinctValues(data.distinctValues);
            }
        } catch (err) {
            console.error("Failed to fetch distinct values:", err);
        }
    };

    // Fetch logs with filters
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterAction) params.append("action", filterAction);
            if (filterCategory) params.append("category", filterCategory);
            if (filterActor) params.append("actor", filterActor);
            if (filterTarget) params.append("targetName", filterTarget);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            params.append("page", page.toString());
            params.append("limit", "50");

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
    }, [filterAction, filterCategory, filterActor, filterTarget, startDate, endDate, page]);

    // Fetch logs when filters change
    useEffect(() => {
        if (userRole === "super_admin" || userRole === "admin") {
            fetchLogs();
        }
    }, [userRole, fetchLogs]);

    // Reset page when filters change
    const handleFilterChange = (setter: (val: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    };

    // Parse details JSON for meaningful display
    const formatDetails = (log: AuditLog): string => {
        if (!log.details) return "-";

        const d = log.details;

        switch (log.action) {
            case "USER_ROLE_CHANGED":
                return `${d.oldRole || "?"} → ${d.newRole || "?"}`;
            case "CANDIDATE_UPDATED":
                const updatedFields: string[] = [];
                if (d.symbol !== undefined) updatedFields.push("Symbol");
                if (d.bio !== undefined) updatedFields.push("Bio");
                if (d.photoUrl !== undefined) updatedFields.push("Photo");
                if (d.languages !== undefined) updatedFields.push("Languages");
                return updatedFields.length > 0 ? `Updated: ${updatedFields.join(", ")}` : "Updated";
            case "CANDIDATE_ADDED":
                return d.indexNumber ? `Index: ${d.indexNumber}` : "Added";
            case "CANDIDATE_REMOVED":
                return "Removed";
            case "VOTE_CAST":
                // New format: shows actual candidates selected
                if (d.candidatesSelected && Array.isArray(d.candidatesSelected)) {
                    return `Voted: ${d.candidatesSelected.join(", ")}`;
                }
                // Old format: anonymous
                return d.anonymized ? "Anonymous Vote (Legacy)" : "Vote Recorded";
            case "ELECTION_CREATED":
                return d.electionName || "Created";
            case "ELECTION_UPDATED":
                const changes: string[] = [];
                if (d.name) changes.push("Name");
                if (d.startTime) changes.push("Start Time");
                if (d.endTime) changes.push("End Time");
                return changes.length > 0 ? `Changed: ${changes.join(", ")}` : "Updated";
            case "ELECTION_VISIBILITY_CHANGED":
                if (d.resultsVisible !== undefined) {
                    return `Results: ${d.resultsVisible ? "Visible" : "Hidden"}`;
                }
                if (d.isPublic !== undefined) {
                    return `Voting: ${d.isPublic ? "Public" : "Private"}`;
                }
                return "Visibility Changed";
            default:
                const keys = Object.keys(d).slice(0, 2);
                if (keys.length === 0) return "-";
                return keys.map(k => `${k}: ${String(d[k]).slice(0, 20)}`).join(", ");
        }
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

                    {/* Date Range Filters */}
                    <div className="glass-card p-6 mb-8 animate-slide-up">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Date Range</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="glass-card overflow-visible animate-slide-up">
                            <div className="overflow-x-auto min-h-[500px]">
                                <table className="w-full border-separate border-spacing-0" style={{ minWidth: "1000px" }}>
                                    <thead>
                                        <tr className="bg-navy-dark/50">
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "140px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Timestamp</div>
                                            </th>
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "180px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Action</div>
                                                <SearchableDropdown
                                                    options={distinctValues.actions}
                                                    value={filterAction}
                                                    onChange={handleFilterChange(setFilterAction)}
                                                    placeholder="Filter..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "120px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Category</div>
                                                <SearchableDropdown
                                                    options={distinctValues.categories}
                                                    value={filterCategory}
                                                    onChange={handleFilterChange(setFilterCategory)}
                                                    placeholder="Filter..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "200px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Actor</div>
                                                <SearchableDropdown
                                                    options={distinctValues.actors}
                                                    value={filterActor}
                                                    onChange={handleFilterChange(setFilterActor)}
                                                    placeholder="Filter..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "150px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Target</div>
                                                <SearchableDropdown
                                                    options={distinctValues.targets}
                                                    value={filterTarget}
                                                    onChange={handleFilterChange(setFilterTarget)}
                                                    placeholder="Filter..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-4 py-4 text-left align-top" style={{ width: "200px" }}>
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide">Details</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 border-t border-cyan/20">
                                                    <svg className="w-12 h-12 mx-auto mb-4 text-cyan/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    No audit logs found matching filters
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="border-b border-cyan/10 hover:bg-cyan/5 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">
                                                        {formatDate(log.timestamp)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg">{actionIcons[log.action] || "📋"}</span>
                                                            <span className="text-white text-sm font-medium">
                                                                {formatAction(log.action)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-semibold border ${categoryColors[log.category] || "bg-gray-500/20 text-gray-400"
                                                                }`}
                                                        >
                                                            {log.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-white text-sm truncate max-w-[180px]" title={log.actorEmail}>
                                                                {log.actorEmail === "ANONYMOUS" ? (
                                                                    <span className="text-gray-500 italic">Anonymous</span>
                                                                ) : (
                                                                    log.actorEmail.split("@")[0]
                                                                )}
                                                            </p>
                                                            <p className="text-gray-500 text-xs">{log.actorRole}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300 text-sm">
                                                        <span className="truncate max-w-[140px] block" title={log.targetName || "-"}>
                                                            {log.targetName || log.targetType || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-cyan text-sm">
                                                        <span className="block whitespace-normal">
                                                            {formatDetails(log)}
                                                        </span>
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
