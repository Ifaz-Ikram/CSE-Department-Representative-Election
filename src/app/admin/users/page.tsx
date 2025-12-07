"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import GlowDivider from "@/components/GlowDivider";
import SearchableDropdown from "@/components/SearchableDropdown";

interface User {
    id: string;
    name: string | null;
    email: string;
    indexNumber: string | null;
    role: string;
    createdAt: string;
}

const roleColors: Record<string, string> = {
    super_admin: "bg-gold/20 text-gold border-gold/50",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    voter: "bg-cyan/20 text-cyan border-cyan/50",
};

const roleIcons: Record<string, string> = {
    super_admin: "👑",
    admin: "🛡️",
    voter: "🗳️",
};

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filter states
    const [filterName, setFilterName] = useState("");
    const [filterIndex, setFilterIndex] = useState("");
    const [filterRole, setFilterRole] = useState("");

    const userRole = (session?.user as any)?.role;
    const currentUserEmail = session?.user?.email;
    const isSuperAdmin = userRole === "super_admin";

    // Check authorization - allow both admin and super_admin
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (session && userRole !== "super_admin" && userRole !== "admin") {
            router.push("/admin");
        }
    }, [status, session, router, userRole]);

    // Fetch users
    useEffect(() => {
        if (userRole === "super_admin" || userRole === "admin") {
            fetchUsers();
        }
    }, [userRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users");
            if (!res.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await res.json();
            setUsers(data.users);
            setError(null);
        } catch (err) {
            setError("Failed to load users");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            setUpdating(userId);
            setSuccessMessage(null);

            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, newRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update role");
            }

            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
            setSuccessMessage(data.message);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setUpdating(null);
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

    const superAdmins = users.filter(u => u.role === "super_admin");
    const admins = users.filter(u => u.role === "admin");
    const voters = users.filter(u => u.role === "voter");

    // Compute unique options for dropdowns
    const uniqueNames = Array.from(new Set(users.map(u => u.name || "").filter(Boolean))).sort();
    const uniqueIndices = Array.from(new Set(users.map(u => u.indexNumber || "").filter(Boolean))).sort();
    const uniqueRoles = Array.from(new Set(users.map(u => u.role))).sort();

    // Filtered users
    const filteredUsers = users.filter(user => {
        const matchName = filterName ? (user.name || "") === filterName : true;
        const matchIndex = filterIndex ? (user.indexNumber || "") === filterIndex : true;
        const matchRole = filterRole ? user.role === filterRole : true;
        return matchName && matchIndex && matchRole;
    });

    return (
        <div className="min-h-screen circuit-bg">
            <Navigation />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
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
                            User <span className="text-gradient glow-text">Management</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            {isSuperAdmin ? "Manage user roles and permissions" : "View user roles (read-only)"}
                        </p>
                    </div>

                    <GlowDivider className="mb-8" />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
                        <div className="glass-card p-4 text-center">
                            <div className="text-3xl font-bold text-gold mb-1">{superAdmins.length}</div>
                            <div className="text-gray-400 text-sm uppercase tracking-wide">Super Admins</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-3xl font-bold text-purple-400 mb-1">{admins.length}</div>
                            <div className="text-gray-400 text-sm uppercase tracking-wide">Admins</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-3xl font-bold text-cyan mb-1">{voters.length}</div>
                            <div className="text-gray-400 text-sm uppercase tracking-wide">Voters</div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="glass-card p-4 mb-6 border-green-500/50 bg-green-500/10 animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-400">{successMessage}</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="glass-card p-4 mb-6 border-red-500/50 bg-red-500/10 animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-red-400">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="loading-spinner" />
                        </div>
                    )}

                    {/* Users Table */}
                    {!loading && (
                        <div className="glass-card overflow-visible animate-slide-up">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-navy-dark/50">
                                            <th className="px-6 py-4 text-left align-top w-1/3">
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">User</div>
                                                <SearchableDropdown
                                                    options={uniqueNames}
                                                    value={filterName}
                                                    onChange={setFilterName}
                                                    placeholder="Filter User..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-left align-top w-1/4">
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Index Number</div>
                                                <SearchableDropdown
                                                    options={uniqueIndices}
                                                    value={filterIndex}
                                                    onChange={setFilterIndex}
                                                    placeholder="Filter Index..."
                                                    className="w-full"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-left align-top w-1/4">
                                                <div className="text-cyan text-sm font-bold uppercase tracking-wide mb-2">Current Role</div>
                                                <SearchableDropdown
                                                    options={uniqueRoles}
                                                    value={filterRole}
                                                    onChange={setFilterRole}
                                                    placeholder="Filter Role..."
                                                    className="w-full"
                                                />
                                            </th>
                                            {isSuperAdmin && (
                                                <th className="px-6 py-4 text-left align-top text-cyan text-sm font-bold uppercase tracking-wide">
                                                    Change Role
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={isSuperAdmin ? 4 : 3} className="px-6 py-12 text-center text-gray-400 border-t border-cyan/20">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className={`border-b border-cyan/10 hover:bg-cyan/5 transition-colors ${user.email === currentUserEmail ? "bg-cyan/10" : ""
                                                        }`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-white font-medium flex items-center space-x-2">
                                                                <span>{roleIcons[user.role]}</span>
                                                                <span>{user.name || "No name"}</span>
                                                                {user.email === currentUserEmail && (
                                                                    <span className="text-xs bg-cyan/20 text-cyan px-2 py-0.5 rounded">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-gray-400 text-sm">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                                        {user.indexNumber || "-"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${roleColors[user.role]
                                                                }`}
                                                        >
                                                            {user.role.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-6 py-4">
                                                            {user.email === currentUserEmail ? (
                                                                <span className="text-gray-500 text-sm italic">
                                                                    Cannot change own role
                                                                </span>
                                                            ) : (
                                                                <select
                                                                    value={user.role}
                                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                    disabled={updating === user.id}
                                                                    className="input-field text-sm py-2 px-3 pr-10 bg-navy-dark disabled:opacity-50 appearance-none cursor-pointer"
                                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2300E5FF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
                                                                >
                                                                    <option value="voter">Voter</option>
                                                                    <option value="admin">Admin</option>
                                                                    <option value="super_admin">Super Admin</option>
                                                                </select>
                                                            )}
                                                            {updating === user.id && (
                                                                <span className="ml-2 text-cyan text-sm animate-pulse">
                                                                    Updating...
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="glass-card p-6 mt-8 border-yellow-500/30 bg-yellow-500/5">
                        <h3 className="text-yellow-400 font-semibold mb-2 flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Role Information</span>
                        </h3>
                        <ul className="text-gray-400 text-sm space-y-1">
                            <li><span className="text-gold">👑 Super Admin:</span> Full access - can manage elections, candidates, users, and view all audit logs</li>
                            <li><span className="text-purple-400">🛡️ Admin:</span> Can view audit logs (super_admin actions only), restricted during active elections</li>
                            <li><span className="text-cyan">🗳️ Voter:</span> Can vote in elections, view results when published</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
