"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import CandidateSelector from "@/components/CandidateSelector";
import GlowDivider from "@/components/GlowDivider";
import Link from "next/link";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

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
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto" />
          <p className="text-cyan text-lg animate-pulse">Loading candidates...</p>
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
              className="text-cyan hover:text-cyan-light mb-4 inline-flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Admin Dashboard</span>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Manage <span className="text-gradient glow-text">Candidates</span>
                </h1>
                {election && (
                  <p className="text-gray-400 text-lg">{election.name}</p>
                )}
              </div>
              <button
                onClick={() => setShowCandidateSelector(true)}
                className="btn-primary animate-pulse-glow"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Candidate</span>
                </span>
              </button>
            </div>
          </div>

          <GlowDivider className="mb-8" />

          {/* Stats Bar */}
          <div className="glass-card p-4 mb-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan">{candidates.length}</div>
                  <div className="text-gray-400 text-sm">Total Candidates</div>
                </div>
              </div>
              {election && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Election Status</div>
                  <div className={`badge ${
                    new Date() >= new Date(election.startTime) && new Date() <= new Date(election.endTime)
                      ? 'badge-active'
                      : new Date() > new Date(election.endTime)
                      ? 'badge-ended'
                      : 'badge-pending'
                  }`}>
                    {new Date() >= new Date(election.startTime) && new Date() <= new Date(election.endTime)
                      ? '🟢 Active'
                      : new Date() > new Date(election.endTime)
                      ? '🔒 Ended'
                      : '⏳ Pending'}
                  </div>
                </div>
              )}
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

          {/* Candidates Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.map((candidate, index) => {
              const photoUrl = normalizePhotoUrl(candidate.photoUrl);
              
              return (
                <div 
                  key={candidate.id} 
                  className="glass-card p-5 animate-slide-up hover:border-cyan/50 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Candidate Photo */}
                  <div className="flex justify-center mb-4">
                    {photoUrl ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-cyan/30 group-hover:border-cyan transition-all shadow-lg">
                        <img
                          src={photoUrl}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full bg-gradient-to-br from-cyan/20 to-navy-light flex items-center justify-center">
                          <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-navy-light to-navy-lighter border-2 border-cyan/30 group-hover:border-cyan transition-all flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Candidate Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan transition-colors">
                      {candidate.name}
                    </h3>
                    <p className="text-gold text-sm font-semibold mb-1">
                      {candidate.indexNumber}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {candidate.email}
                    </p>
                  </div>
                  
                  {candidate.bio && (
                    <div className="bg-navy-dark/50 p-3 rounded-lg mb-4">
                      <p className="text-gray-300 text-sm line-clamp-3">
                        {candidate.bio}
                      </p>
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    className="w-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 border border-red-500/50 hover:border-red-500 flex items-center justify-center space-x-2 glow-border-red"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              );
            })}
          </div>

          {candidates.length === 0 && (
            <div className="glass-card text-center p-12 animate-fade-in">
              <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-400 text-lg">No candidates yet.</p>
              <p className="text-gray-500 text-sm mt-2">Click "Add Candidate" to add candidates from the CSE23 batch.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
