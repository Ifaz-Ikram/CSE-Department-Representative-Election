"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";

interface Candidate {
  id: string;
  name: string;
  indexNumber: string;
  email: string;
  bio?: string | null;
  photoUrl?: string | null;
}

export default function ManageCandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const electionId = params.id as string;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    indexNumber: "",
    email: "",
    bio: "",
    photoUrl: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session && session.user.role !== "super_admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "super_admin" && electionId) {
      fetchCandidates();
      fetchElection();
    }
  }, [session, electionId]);

  const fetchElection = async () => {
    try {
      const res = await fetch(`/api/candidates?electionId=${electionId}`);
      const data = await res.json();
      setElection(data.election);
    } catch (error) {
      console.error("Failed to fetch election:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`/api/candidates?electionId=${electionId}`);
      const data = await res.json();
      setCandidates(data.candidates);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          electionId,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          indexNumber: "",
          email: "",
          bio: "",
          photoUrl: "",
        });
        fetchCandidates();
      }
    } catch (error) {
      console.error("Failed to create candidate:", error);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
      await fetch(`/api/admin/candidates?id=${candidateId}`, {
        method: "DELETE",
      });
      fetchCandidates();
    } catch (error) {
      console.error("Failed to delete candidate:", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin" className="text-cyan hover:text-cyan-light mb-4 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Manage <span className="text-cyan glow-text">Candidates</span>
                </h1>
                {election && (
                  <p className="text-gray-400">{election.name}</p>
                )}
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
              >
                {showForm ? "Cancel" : "+ Add Candidate"}
              </button>
            </div>
          </div>

          {/* Add Candidate Form */}
          {showForm && (
            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Add New Candidate
              </h2>
              <form onSubmit={handleCreateCandidate} className="space-y-4">
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2">
                    Name
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cyan text-sm font-bold mb-2">
                      Index Number
                    </label>
                    <input
                      type="text"
                      value={formData.indexNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, indexNumber: e.target.value })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-cyan text-sm font-bold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-cyan text-sm font-bold mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    className="input-field w-full"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Add Candidate
                </button>
              </form>
            </div>
          )}

          {/* Candidates List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="card">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {candidate.name}
                  </h3>
                  <p className="text-cyan text-sm mb-1">
                    {candidate.indexNumber}
                  </p>
                  <p className="text-gray-400 text-xs mb-2">
                    {candidate.email}
                  </p>
                  {candidate.bio && (
                    <p className="text-gray-300 text-sm mt-3">
                      {candidate.bio}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCandidate(candidate.id)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="card text-center text-gray-400">
              <p>No candidates yet. Add candidates to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
