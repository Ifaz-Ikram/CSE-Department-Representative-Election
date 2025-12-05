"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminBallotsPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AdminBallotsContent />
    </Suspense>
  );
}

function AdminBallotsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get("electionId");

  const [ballots, setBallots] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isElectionActive, setIsElectionActive] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (session && userRole !== "super_admin" && userRole !== "admin") {
      router.push("/vote");
    }
  }, [status, session, router, userRole]);

  useEffect(() => {
    if ((userRole === "super_admin" || userRole === "admin") && electionId) {
      fetchBallots();
    }
  }, [session, electionId, userRole]);

  const fetchBallots = async () => {
    try {
      const res = await fetch(`/api/admin/ballots?electionId=${electionId}`);
      const data = await res.json();

      if (res.ok) {
        setBallots(data.ballots);
        setElection(data.election);

        if (data.election) {
          const now = new Date();
          const start = new Date(data.election.startTime);
          const end = new Date(data.election.endTime);
          setIsElectionActive(now >= start && now <= end);
        }

        setError(null);
      } else {
        setError(data.error || "Failed to fetch ballots");
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch ballots:", error);
      setError("An error occurred");
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return <FullPageLoader />;
  }

  // During active election, only super_admin can view ballots
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
                Ballot details are restricted during active elections to protect voter privacy.
              </p>
              <p className="text-cyan text-sm">
                Access will be available after the election ends.
              </p>
            </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Voter <span className="text-gradient glow-text">Ballots</span>
                </h1>
                {election && <p className="text-gray-400 text-lg">{election.name}</p>}
              </div>
            </div>
          </div>

          <GlowDivider className="mb-8" />

          {error && (
            <div className="glass-card border-red-500 bg-red-500/10 p-6 mb-6 animate-fade-in">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-red-400">{error}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Access may be restricted based on election status and your role.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <>
              {/* Stats Card */}
              <div className="glass-card p-6 mb-8 animate-slide-up">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-cyan/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm uppercase tracking-wide">Total Ballots</div>
                      <div className="text-3xl font-bold text-cyan">{ballots.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 glass-card bg-yellow-500/10 border-yellow-500/30 px-4 py-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-400 text-sm font-medium">Sensitive data - Handle with care</span>
                  </div>
                </div>
              </div>

              {/* Ballots List */}
              <div className="space-y-4">
                {ballots.map((ballot, index) => (
                  <div
                    key={ballot.id}
                    className="glass-card p-6 animate-slide-up hover:border-cyan/50 transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Voter Info */}
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-cyan/30 flex-shrink-0">
                          {ballot.voter.image ? (
                            <img
                              src={ballot.voter.image}
                              alt={ballot.voter.name || 'Voter'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan/20 to-navy-lighter flex items-center justify-center">
                              <span className="text-lg font-bold text-cyan">
                                {ballot.voter.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {ballot.voter.name}
                          </h4>
                          <p className="text-gold text-sm font-semibold">
                            {ballot.voter.indexNumber}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {ballot.voter.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500 text-xs uppercase tracking-wide">Last Updated</div>
                        <div className="text-cyan text-sm font-medium">
                          {new Date(ballot.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Selected Candidates */}
                    <div className="border-t border-cyan/20 pt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg className="w-5 h-5 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-bold text-cyan">
                          Selected Candidates ({ballot.choices.length}/10)
                        </p>
                      </div>

                      {ballot.choices.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {ballot.choices.map((choice: any) => (
                            <div
                              key={choice.id}
                              className="bg-navy-dark/50 rounded-lg px-3 py-2 border border-cyan/10 hover:border-cyan/30 transition-colors"
                            >
                              <div className="text-white font-semibold text-sm">
                                {choice.candidate.name}
                              </div>
                              <div className="text-gold text-xs">
                                {choice.candidate.indexNumber}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-navy-dark/30 rounded-lg px-4 py-3 text-center">
                          <p className="text-gray-500 text-sm italic">No candidates selected (blank ballot)</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {ballots.length === 0 && (
                <div className="glass-card text-center p-12 animate-fade-in">
                  <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-400 text-lg">No ballots submitted yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Ballots will appear here once voters submit their choices.</p>
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
        <p className="text-cyan text-lg animate-pulse">Loading ballots...</p>
      </div>
    </div>
  );
}
