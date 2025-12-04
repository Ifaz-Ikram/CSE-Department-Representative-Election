"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import CandidateSelector from "@/components/CandidateSelector";
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
  const [showCandidateSelector, setShowCandidateSelector] = useState(false);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/");
			return;
		}

		const role = (session?.user as any)?.role;

		if (role && role !== "super_admin") {
			router.push("/admin");
		}
	}, [status, session, router]);


  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role === "super_admin" && electionId) {
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

  const handleCandidateAdded = () => {
    setShowCandidateSelector(false);
    fetchCandidates();
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
                onClick={() => setShowCandidateSelector(true)}
                className="btn-primary"
              >
                + Add Candidate from CSE23 Batch
              </button>
            </div>
          </div>

          {/* Candidate Selector Modal */}
          {showCandidateSelector && (
            <CandidateSelector
              electionId={electionId}
              onSuccess={handleCandidateAdded}
              onCancel={() => setShowCandidateSelector(false)}
            />
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
