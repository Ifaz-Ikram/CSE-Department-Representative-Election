"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

interface CandidateStats {
  candidateId: string;
  name: string;
  indexNumber: string;
  email: string;
  photoUrl?: string | null;
  voteCount: number;
}

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [elections, setElections] = useState<any[]>([]);
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

      if (!selectedElectionId && data.elections.length > 0) {
        setSelectedElectionId(data.elections[0].id);
      }

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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Election <span className="text-cyan glow-text">Results</span>
            </h1>
            <p className="text-gray-400">
              View election statistics and results
            </p>
          </div>

          {/* Election Selector */}
          {elections.length > 1 && (
            <div className="card mb-6">
              <label className="block text-sm font-bold text-cyan mb-2">
                Select Election
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="input-field w-full"
              >
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="card border-yellow-500 bg-yellow-500/10 mb-6">
              <p className="text-yellow-400">{error}</p>
              <p className="text-gray-400 text-sm mt-2">
                Results may not be visible yet. Check with the election administrators.
              </p>
            </div>
          )}

          {!error && election && (
            <>
              {/* Election Info */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {election.name}
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-cyan">Total Votes:</span>{" "}
                    <span className="text-white font-bold text-xl">
                      {totalBallots}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan">Ended:</span>{" "}
                    <span className="text-gray-300">
                      {new Date(election.endTime).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan">Status:</span>{" "}
                    <span className="text-green-400">
                      {election.publicResultsVisible
                        ? "Public"
                        : election.resultsVisible
                        ? "Visible to Admins"
                        : "Restricted"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Candidate Rankings
                </h3>
                {stats.map((candidate, index) => (
                  <div key={candidate.candidateId} className="card">
                    <div className="flex items-center space-x-4 mb-3">
                      <div
                        className={`text-3xl font-bold ${
                          index === 0
                            ? "text-yellow-accent"
                            : index === 1
                            ? "text-gray-300"
                            : index === 2
                            ? "text-yellow-700"
                            : "text-cyan"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white">
                          {candidate.name}
                        </h4>
                        <p className="text-cyan text-sm">
                          {candidate.indexNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-cyan">
                          {candidate.voteCount}
                        </div>
                        <div className="text-sm text-gray-400">votes</div>
                      </div>
                    </div>
                    {/* Vote Bar */}
                    <div className="w-full bg-navy-dark rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan to-cyan-light h-full rounded-full transition-all duration-500 glow-border"
                        style={{
                          width: `${(candidate.voteCount / maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                    {totalBallots > 0 && (
                      <div className="text-sm text-gray-400 mt-2">
                        {((candidate.voteCount / totalBallots) * 100).toFixed(
                          1
                        )}
                        % of voters selected this candidate
                      </div>
                    )}
                  </div>
                ))}

                {stats.length === 0 && (
                  <div className="card text-center text-gray-400">
                    <p>No results available yet.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedElectionId && elections.length === 0 && (
            <div className="card text-center text-gray-400">
              <p>No elections available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
