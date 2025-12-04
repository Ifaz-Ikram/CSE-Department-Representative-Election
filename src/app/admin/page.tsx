"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";

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
    } else if (
      session &&
      session.user.role !== "super_admin" &&
      session.user.role !== "admin"
    ) {
      router.push("/vote");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "super_admin" || session?.user.role === "admin") {
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
      const res = await fetch("/api/admin/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ name: "", description: "", startTime: "", endTime: "" });
        fetchElections();
      }
    } catch (error) {
      console.error("Failed to create election:", error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
      </div>
    );
  }

  const isSuperAdmin = session?.user.role === "super_admin";

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin <span className="text-cyan glow-text">Dashboard</span>
              </h1>
              <p className="text-gray-400">
                Manage elections and view statistics
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary"
              >
                {showCreateForm ? "Cancel" : "+ Create Election"}
              </button>
            )}
          </div>

          {/* Create Election Form */}
          {showCreateForm && isSuperAdmin && (
            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Create New Election
              </h2>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2">
                    Election Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cyan text-sm font-bold mb-2">
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
                    <label className="block text-cyan text-sm font-bold mb-2">
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
                <button type="submit" className="btn-primary">
                  Create Election
                </button>
              </form>
            </div>
          )}

          {/* Elections List */}
          <div className="space-y-6">
            {elections.map((election) => {
              const now = new Date();
              const start = new Date(election.startTime);
              const end = new Date(election.endTime);
              const isActive = now >= start && now <= end;
              const isEnded = now > end;
              const isPending = now < start;

              return (
                <div key={election.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {election.name}
                      </h3>
                      {election.description && (
                        <p className="text-gray-400 mb-3">
                          {election.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${
                            isActive
                              ? "bg-green-500/20 text-green-400"
                              : isEnded
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {isActive ? "Active" : isEnded ? "Ended" : "Pending"}
                        </span>
                        <span className="text-gray-400">
                          {election._count.candidates} candidates
                        </span>
                        <span className="text-gray-400">
                          {election._count.ballots} votes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-cyan">Start:</span>{" "}
                      <span className="text-gray-300">
                        {start.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-cyan">End:</span>{" "}
                      <span className="text-gray-300">
                        {end.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Visibility Toggles */}
                  {isSuperAdmin && (
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            handleToggleVisibility(
                              election.id,
                              "resultsVisible",
                              election.resultsVisible
                            )
                          }
                          className={`px-3 py-1 rounded ${
                            election.resultsVisible
                              ? "bg-cyan text-navy"
                              : "bg-navy-light text-cyan border border-cyan"
                          }`}
                        >
                          {election.resultsVisible
                            ? "✓ Results Visible to Admins"
                            : "Results Hidden from Admins"}
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            handleToggleVisibility(
                              election.id,
                              "publicResultsVisible",
                              election.publicResultsVisible
                            )
                          }
                          className={`px-3 py-1 rounded ${
                            election.publicResultsVisible
                              ? "bg-cyan text-navy"
                              : "bg-navy-light text-cyan border border-cyan"
                          }`}
                        >
                          {election.publicResultsVisible
                            ? "✓ Results Public"
                            : "Results Not Public"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/admin/elections/${election.id}`}
                      className="btn-secondary text-sm"
                    >
                      Manage Candidates
                    </Link>
                    <Link
                      href={`/admin/statistics?electionId=${election.id}`}
                      className="btn-secondary text-sm"
                    >
                      View Statistics
                    </Link>
                    <Link
                      href={`/admin/ballots?electionId=${election.id}`}
                      className="btn-secondary text-sm"
                    >
                      View Ballots
                    </Link>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteElection(election.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {elections.length === 0 && (
              <div className="card text-center text-gray-400">
                <p>No elections found. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
