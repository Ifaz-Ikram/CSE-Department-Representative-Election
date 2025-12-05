"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminStatisticsPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AdminStatisticsContent />
    </Suspense>
  );
}

function AdminStatisticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get("electionId");

  const [stats, setStats] = useState<any[]>([]);
  const [totalBallots, setTotalBallots] = useState(0);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isElectionActive, setIsElectionActive] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session) {
      if (userRole !== "super_admin" && userRole !== "admin") {
        router.push("/vote");
      }
    }
  }, [status, session, router, userRole]);

  useEffect(() => {
    if ((userRole === "super_admin" || userRole === "admin") && electionId) {
      fetchStatistics();
    }
  }, [session, electionId, userRole]);

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`/api/admin/statistics?electionId=${electionId}`);
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setTotalBallots(data.totalBallots);
        setElection(data.election);

        if (data.election) {
          const now = new Date();
          const start = new Date(data.election.startTime);
          const end = new Date(data.election.endTime);
          setIsElectionActive(now >= start && now <= end);
        }

        setError(null);
      } else {
        setError(data.error || "Failed to fetch statistics");
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      setError("An error occurred");
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return <FullPageLoader />;
  }

  // During active election, only super_admin can view statistics
  if (isElectionActive && !isSuperAdmin) {
    return (
      <div className="min-h-screen circuit-bg">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/admin"
              className="text-cyan hover:text-cyan-light mb-4 inline-flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Admin Dashboard</span>
            </Link>

            <div className="glass-card p-8 text-center mt-8 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Election In Progress</h2>
              <p className="text-gray-400 mb-4">
                Statistics are restricted during active elections to prevent result manipulation.
              </p>
              <p className="text-cyan text-sm">
                Results will be available after the election ends.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const maxVotes = Math.max(...stats.map((s) => s.voteCount), 1);

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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

            <div className="flex items-center space-x-4 mt-4">
              <div className="w-14 h-14 rounded-xl bg-cyan/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Election <span className="text-gradient glow-text">Statistics</span>
                </h1>
                {election && <p className="text-gray-400 text-lg">{election.name}</p>}
              </div>
            </div>

            {/* Export Buttons */}
            {election && (
              <div className="flex flex-wrap gap-3 mt-6 animate-fade-in">
                <button
                  onClick={() => window.open(`/api/admin/export?electionId=${electionId}&type=results`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan/20 hover:bg-cyan/30 text-cyan border border-cyan/30 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Results</span>
                </button>
                <button
                  onClick={() => window.open(`/api/admin/export?electionId=${electionId}&type=statistics`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Statistics</span>
                </button>
                <button
                  onClick={() => window.open(`/api/admin/export?electionId=${electionId}&type=voters`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Export Voters List</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => window.open(`/api/admin/export?electionId=${electionId}&type=ballots`, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export Ballots (Full)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <GlowDivider className="mb-8" />

          {error && (
            <div className="glass-card border-red-500 bg-red-500/10 p-6 mb-6 animate-fade-in">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {!error && election && (
            <>
              {/* Stats Overview */}
              <div className="grid md:grid-cols-2 gap-6 mb-8 animate-slide-up">
                <div className="glass-card p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-cyan/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm uppercase tracking-wide">Total Votes</div>
                      <div className="text-4xl font-bold text-cyan">{totalBallots}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm uppercase tracking-wide">Candidates</div>
                      <div className="text-4xl font-bold text-gold">{stats.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rankings */}
              <div className="space-y-4">
                {stats.map((candidate, index) => {
                  const percentage = maxVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0;
                  const isTop3 = index < 3;
                  const rankColors = ["text-gold", "text-gray-300", "text-amber-600"];
                  const rankBgColors = ["bg-gold/20", "bg-gray-500/20", "bg-amber-600/20"];
                  const barColors = [
                    "from-gold via-yellow-400 to-gold",
                    "from-gray-400 via-gray-300 to-gray-400",
                    "from-amber-600 via-amber-500 to-amber-600"
                  ];

                  return (
                    <div
                      key={candidate.candidateId}
                      className="glass-card p-5 animate-slide-up hover:border-cyan/50 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        {/* Rank Badge */}
                        <div className={`w-12 h-12 rounded-xl ${isTop3 ? rankBgColors[index] : 'bg-navy-lighter'} flex items-center justify-center`}>
                          <span className={`text-2xl font-bold ${isTop3 ? rankColors[index] : 'text-gray-400'}`}>
                            #{index + 1}
                          </span>
                        </div>

                        {/* Candidate Info */}
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white">
                            {candidate.name}
                          </h4>
                          <p className="text-cyan text-sm">
                            {candidate.indexNumber}
                          </p>
                        </div>

                        {/* Vote Count */}
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${isTop3 ? rankColors[index] : 'text-cyan'}`}>
                            {candidate.voteCount}
                          </div>
                          <div className="text-sm text-gray-400">votes</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-navy-dark rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isTop3 ? `bg-gradient-to-r ${barColors[index]}` : 'bg-gradient-to-r from-cyan to-cyan-light'
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.length === 0 && (
                <div className="glass-card text-center p-12 animate-fade-in">
                  <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-400 text-lg">No statistics available yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Votes will appear here once submitted.</p>
                </div>
              )}
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
        <p className="text-cyan text-lg animate-pulse">Loading statistics...</p>
      </div>
    </div>
  );
}
