"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import ElectionCard from "@/components/ElectionCard"; // New import
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

interface CandidateStats {
  candidateId: string;
  name: string;
  indexNumber: string;
  email: string;
  photoUrl?: string | null;
  voteCount: number;
}

interface Election {
  id: string;
  name: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  _count?: {
    candidates: number;
    ballots: number;
  };
}

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <ResultsPageContent />
    </Suspense>
  );
}

function ResultsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [stats, setStats] = useState<CandidateStats[]>([]);
  const [totalBallots, setTotalBallots] = useState(0);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchElections();
    }
  }, [session]);

  useEffect(() => {
    const electionId = searchParams.get("electionId");
    if (electionId) {
      setSelectedElectionId(electionId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedElectionId) {
      fetchStatistics();
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const res = await fetch("/api/elections");
      const data = await res.json();
      setElections(data.elections);

      // Removed auto-select logic to start with selection view
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch elections:", error);
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(
        `/api/admin/statistics?electionId=${selectedElectionId}`
      );
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setTotalBallots(data.totalBallots);
        setElection(data.election);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch statistics");
        setStats([]);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      setError("An error occurred while fetching statistics");
    }
  };

  const handleElectionSelect = (id: string) => {
    setSelectedElectionId(id);
  };

  const handleBackToElections = () => {
    setSelectedElectionId("");
    setError(null);
    setElection(null);
    // Optionally clear URL param if we want to be clean, but local state is enough for UI
    router.replace("/results");
  };

  if (loading || status === "loading") {
    return <FullPageLoader />;
  }

  const maxVotes = Math.max(...stats.map((s) => s.voteCount), 1);
  const winner = stats.length > 0 ? stats[0] : null;

  // If no election selected, show election selection view
  if (!selectedElectionId) {
    return (
      <div className="min-h-screen circuit-bg">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Election <span className="text-gradient glow-text">Results</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Select an election to view detailed statistics and winners.
              </p>
            </div>

            <GlowDivider className="mb-12" />

            {/* Elections Grid */}
            {elections.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {elections.map((election, index) => (
                  <div key={election.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <ElectionCard
                      election={election}
                      type="result"
                      onClick={handleElectionSelect}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center p-12 animate-fade-in max-w-2xl mx-auto">
                <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">No Election Results</h3>
                <p className="text-gray-400">There are currently no election results available to view.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToElections}
            className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-cyan transition-colors group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Elections</span>
          </button>

          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Election <span className="text-gradient glow-text">Results</span>
            </h1>
            <p className="text-gray-400 text-lg">
              View election statistics and candidate rankings
            </p>
          </div>

          <GlowDivider className="mb-8" />

          {error && (
            <div className="glass-card border-yellow-500 bg-yellow-500/10 p-6 mb-6 animate-fade-in">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-semibold">{error}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Results may not be visible yet. Check with the election administrators.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!error && election && (
            <>
              {/* Election Stats Summary */}
              <div className="card-premium mb-8 animate-slide-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {election.name}
                    </h2>
                    <p className="text-gray-400">Final Results</p>
                  </div>
                  <div className={`badge ${election.publicResultsVisible ? 'badge-active' :
                    election.resultsVisible ? 'bg-cyan/20 text-cyan border border-cyan/50' :
                      'badge-pending'
                    }`}>
                    {election.publicResultsVisible
                      ? "🌐 Public"
                      : election.resultsVisible
                        ? "👁 Visible to Admins"
                        : "🔒 Restricted"}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-navy-dark/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-cyan mb-1">{totalBallots}</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Total Votes</div>
                  </div>
                  <div className="bg-navy-dark/50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-gold mb-1">{stats.length}</div>
                    <div className="text-gray-400 text-sm uppercase tracking-wide">Candidates</div>
                  </div>
                  <div className="bg-navy-dark/50 rounded-xl p-4 text-center col-span-2 md:col-span-2">
                    <div className="text-sm text-gray-400 mb-1">Election Ended</div>
                    <div className="text-lg font-semibold text-white">
                      {new Date(election.endTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Card */}
              {winner && winner.voteCount > 0 && (
                <div className="mb-8 animate-slide-up">
                  <div className="relative overflow-hidden card-premium border-2 border-gold glow-border-gold">
                    {/* Crown Icon */}
                    <div className="absolute top-4 right-4 text-gold text-4xl animate-float">
                      👑
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Winner Photo */}
                      <div className="flex-shrink-0">
                        {normalizePhotoUrl(winner.photoUrl) ? (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 border-gold shadow-lg shadow-gold/30">
                            <img
                              src={normalizePhotoUrl(winner.photoUrl)!}
                              alt={winner.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                setTimeout(() => {
                                  const img = e.target as HTMLImageElement;
                                  if (img.naturalWidth === 0) {
                                    img.style.display = 'none';
                                  }
                                }, 100);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-gold/20 to-navy-lighter border-4 border-gold flex items-center justify-center shadow-lg shadow-gold/30">
                            <span className="text-4xl font-bold text-gold">{getInitials(winner.name)}</span>
                          </div>
                        )}
                      </div>

                      {/* Winner Info */}
                      <div className="flex-1">
                        <div className="text-gold text-sm font-bold uppercase tracking-wide mb-1">
                          🏆 Leading Candidate
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          {winner.name}
                        </h3>
                        <p className="text-gold font-semibold">{winner.indexNumber}</p>
                        <div className="mt-3 flex items-baseline space-x-2">
                          <span className="text-4xl font-bold text-gradient-gold glow-text-gold">
                            {winner.voteCount}
                          </span>
                          <span className="text-gray-400">votes</span>
                          {totalBallots > 0 && (
                            <span className="text-gold text-sm">
                              ({((winner.voteCount / totalBallots) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Rankings */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Full Rankings</span>
                </h3>

                {stats.map((candidate, index) => {
                  const photoUrl = normalizePhotoUrl(candidate.photoUrl);
                  const percentage = totalBallots > 0 ? (candidate.voteCount / totalBallots) * 100 : 0;

                  return (
                    <div
                      key={candidate.candidateId}
                      className={`glass-card p-5 transition-all duration-300 animate-slide-up ${index === 0 ? 'border-gold/50 hover:border-gold' :
                        index === 1 ? 'border-gray-400/30 hover:border-gray-400/50' :
                          index === 2 ? 'border-orange-700/30 hover:border-orange-700/50' :
                            ''
                        }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        {/* Rank Badge */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${index === 0
                            ? "bg-gradient-to-br from-gold to-gold-dark text-navy shadow-lg shadow-gold/30"
                            : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-navy shadow-lg shadow-gray-400/30"
                              : index === 2
                                ? "bg-gradient-to-br from-orange-600 to-orange-800 text-white shadow-lg shadow-orange-700/30"
                                : "bg-navy-dark text-cyan border border-cyan/30"
                            }`}
                        >
                          {index + 1}
                        </div>

                        {/* Candidate Photo */}
                        {photoUrl ? (
                          <div className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${index === 0 ? 'border-gold' :
                            index === 1 ? 'border-gray-400' :
                              index === 2 ? 'border-orange-700' :
                                'border-cyan/30'
                            }`}>
                            <img
                              src={photoUrl}
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                setTimeout(() => {
                                  const img = e.target as HTMLImageElement;
                                  if (img.naturalWidth === 0) {
                                    img.style.display = 'none';
                                  }
                                }, 100);
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-lg bg-navy-dark flex items-center justify-center border-2 ${index === 0 ? 'border-gold' :
                            index === 1 ? 'border-gray-400' :
                              index === 2 ? 'border-orange-700' :
                                'border-cyan/30'
                            }`}>
                            <span className="text-lg font-bold text-cyan">{getInitials(candidate.name)}</span>
                          </div>
                        )}

                        {/* Candidate Info */}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white">
                            {candidate.name}
                          </h4>
                          <p className={`text-sm ${index === 0 ? 'text-gold' :
                            index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-500' :
                                'text-cyan'
                            }`}>
                            {candidate.indexNumber}
                          </p>
                        </div>

                        {/* Vote Count */}
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${index === 0 ? 'text-gold' :
                            index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-orange-500' :
                                'text-cyan'
                            }`}>
                            {candidate.voteCount}
                          </div>
                          <div className="text-sm text-gray-400">votes</div>
                        </div>
                      </div>

                      {/* Vote Bar */}
                      <div className="progress-bar">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${index === 0
                            ? 'bg-gradient-to-r from-gold to-gold-light'
                            : index === 1
                              ? 'bg-gradient-to-r from-gray-400 to-gray-300'
                              : index === 2
                                ? 'bg-gradient-to-r from-orange-700 to-orange-500'
                                : 'bg-gradient-to-r from-cyan to-cyan-light'
                            }`}
                          style={{
                            width: `${(candidate.voteCount / maxVotes) * 100}%`,
                            boxShadow: index === 0 ? '0 0 10px rgba(247, 201, 72, 0.4)' :
                              index < 3 ? undefined : '0 0 10px rgba(0, 229, 255, 0.3)'
                          }}
                        />
                      </div>

                      {totalBallots > 0 && (
                        <div className="text-sm text-gray-400 mt-2">
                          {percentage.toFixed(1)}% of voters selected this candidate
                        </div>
                      )}
                    </div>
                  );
                })}

                {stats.length === 0 && (
                  <div className="glass-card text-center p-12 animate-fade-in">
                    <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-400 text-lg">No results available yet.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center circuit-bg">
      <div className="text-center space-y-4">
        <div className="loading-spinner mx-auto" />
        <p className="text-cyan text-lg animate-pulse">Loading results...</p>
      </div>
    </div>
  );
}
