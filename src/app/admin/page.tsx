"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import GlowDivider from "@/components/GlowDivider";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session) {
      const role = (session.user as any)?.role;
      if (role !== "super_admin" && role !== "admin") {
        router.push("/vote");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role === "super_admin" || role === "admin") {
      fetchElections();
    }
  }, [session]);

  const fetchElections = async () => {
    try {
      const res = await fetch("/api/elections");
      const data = await res.json();
      setElections(data.elections);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch elections:", error);
      setLoading(false);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert datetime-local format to ISO 8601
      const payload = {
        name: formData.name,
        description: formData.description,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      const res = await fetch("/api/admin/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ name: "", description: "", startTime: "", endTime: "" });
        fetchElections();
      } else {
        const error = await res.json();
        console.error("Failed to create election:", error);
        alert(`Failed to create election: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to create election:", error);
      alert("Failed to create election. Please try again.");
    }
  };

  const handleToggleVisibility = async (
    electionId: string,
    field: "resultsVisible" | "publicResultsVisible",
    currentValue: boolean
  ) => {
    try {
      await fetch("/api/admin/elections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: electionId,
          [field]: !currentValue,
        }),
      });
      fetchElections();
    } catch (error) {
      console.error("Failed to update election:", error);
    }
  };

  const handleDeleteElection = async (electionId: string) => {
    if (!confirm("Are you sure you want to delete this election?")) return;

    try {
      await fetch(`/api/admin/elections?id=${electionId}`, {
        method: "DELETE",
      });
      fetchElections();
    } catch (error) {
      console.error("Failed to delete election:", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto" />
          <p className="text-cyan text-lg animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = session?.user && 'role' in session.user && session.user.role === "super_admin";

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Admin <span className="text-gradient glow-text">Dashboard</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Manage elections, candidates, and view statistics
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className={`btn-primary ${showCreateForm ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {showCreateForm ? "✕ Cancel" : "+ Create Election"}
              </button>
            )}
          </div>

          <GlowDivider className="mb-8" />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-cyan mb-1">{elections.length}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Elections</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {elections.filter(e => {
                  const now = new Date();
                  return now >= new Date(e.startTime) && now <= new Date(e.endTime);
                }).length}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Active</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-gold mb-1">
                {elections.reduce((acc, e) => acc + e._count.candidates, 0)}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Candidates</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {elections.reduce((acc, e) => acc + e._count.ballots, 0)}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Total Votes</div>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-8 animate-slide-up">
            {/* Audit Log - visible to all admins */}
            <Link
              href="/admin/audit-log"
              className="inline-flex items-center space-x-3 glass-card p-4 hover:bg-cyan/10 transition-all duration-300 group flex-1 min-w-[280px]"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-semibold group-hover:text-cyan transition-colors">Audit Log</div>
                <div className="text-gray-400 text-sm">
                  {isSuperAdmin ? "View all administrative actions" : "Monitor super admin actions"}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* User Management - visible to all admins */}
            <Link
              href="/admin/users"
              className="inline-flex items-center space-x-3 glass-card p-4 hover:bg-cyan/10 transition-all duration-300 group flex-1 min-w-[280px]"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-semibold group-hover:text-cyan transition-colors">User Management</div>
                <div className="text-gray-400 text-sm">
                  {isSuperAdmin ? "Manage user roles and permissions" : "View user roles (read-only)"}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Create Election Form */}
          {showCreateForm && isSuperAdmin && (
            <div className="card-premium mb-8 animate-slide-up">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-cyan/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Create New Election
                </h2>
              </div>
              <form onSubmit={handleCreateElection} className="space-y-6">
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2 uppercase tracking-wide">
                    Election Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field w-full"
                    placeholder="e.g., Department Representative Election 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field w-full"
                    rows={3}
                    placeholder="Brief description of the election..."
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-cyan text-sm font-bold mb-2 uppercase tracking-wide">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-cyan text-sm font-bold mb-2 uppercase tracking-wide">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary animate-pulse-glow">
                  Create Election
                </button>
              </form>
            </div>
          )}

          {/* Elections List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Elections</span>
            </h2>

            {elections.map((election, index) => {
              const now = new Date();
              const start = new Date(election.startTime);
              const end = new Date(election.endTime);
              const isActive = now >= start && now <= end;
              const isEnded = now > end;
              const isPending = now < start;

              return (
                <div
                  key={election.id}
                  className="card-premium animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">
                          {election.name}
                        </h3>
                        <span className={`badge ${isActive ? 'badge-active animate-pulse' :
                          isEnded ? 'badge-ended' :
                            'badge-pending'
                          }`}>
                          {isActive ? '🟢 Active' : isEnded ? '🔒 Ended' : '⏳ Pending'}
                        </span>
                      </div>
                      {election.description && (
                        <p className="text-gray-400 mb-4">
                          {election.description}
                        </p>
                      )}

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center space-x-2 bg-navy-dark/50 px-3 py-1.5 rounded-lg">
                          <svg className="w-4 h-4 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="text-gray-300">{election._count.candidates} candidates</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-navy-dark/50 px-3 py-1.5 rounded-lg">
                          <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-300">{election._count.ballots} votes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-6 p-4 bg-navy-dark/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-cyan font-semibold">Start:</span>
                      <span className="text-gray-300">{start.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span className="text-cyan font-semibold">End:</span>
                      <span className="text-gray-300">{end.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Visibility Toggles */}
                  {isSuperAdmin && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      <button
                        onClick={() =>
                          handleToggleVisibility(
                            election.id,
                            "resultsVisible",
                            election.resultsVisible
                          )
                        }
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${election.resultsVisible
                          ? "bg-cyan text-navy shadow-lg shadow-cyan/30"
                          : "bg-navy-dark text-cyan border border-cyan/50 hover:border-cyan"
                          }`}
                      >
                        {election.resultsVisible ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                        <span>{election.resultsVisible ? "Results Visible (Admins)" : "Results Hidden (Super Admin Only)"}</span>
                      </button>
                      <button
                        onClick={() =>
                          handleToggleVisibility(
                            election.id,
                            "publicResultsVisible",
                            election.publicResultsVisible
                          )
                        }
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${election.publicResultsVisible
                          ? "bg-gold text-navy shadow-lg shadow-gold/30"
                          : "bg-navy-dark text-gold border border-gold/50 hover:border-gold"
                          }`}
                      >
                        {election.publicResultsVisible ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{election.publicResultsVisible ? "Public Results Visible (Voters)" : "Private Results (Admins Only when Results Visible(Admins) is ON else Super Admin Only)"}</span>
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Manage Candidates - accessible before/during election, read-only after */}
                    <Link
                      href={`/admin/elections/${election.id}`}
                      className="btn-secondary text-sm"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{isEnded ? 'View Candidates' : 'Manage Candidates'}</span>
                      </span>
                    </Link>

                    {/* Statistics - greyed for admin during/before election */}
                    {(!isEnded && !isSuperAdmin) ? (
                      <div className="relative group">
                        <div className="btn-secondary text-sm opacity-50 cursor-not-allowed flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Statistics</span>
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-dark border border-cyan/30 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                          Available after election ends
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-navy-dark"></div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/statistics?electionId=${election.id}`}
                        className="btn-secondary text-sm"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Statistics</span>
                        </span>
                      </Link>
                    )}

                    {/* Ballots - greyed for admin during/before election */}
                    {(!isEnded && !isSuperAdmin) ? (
                      <div className="relative group">
                        <div className="btn-secondary text-sm opacity-50 cursor-not-allowed flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Ballots</span>
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-dark border border-cyan/30 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                          Available after election ends
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-navy-dark"></div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/ballots?electionId=${election.id}`}
                        className="btn-secondary text-sm"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Ballots</span>
                        </span>
                      </Link>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteElection(election.id)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300 border border-red-500/50 hover:border-red-500"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {elections.length === 0 && (
              <div className="glass-card text-center p-12 animate-fade-in">
                <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400 text-lg">No elections found.</p>
                <p className="text-gray-500 text-sm mt-2">Create one to get started.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
