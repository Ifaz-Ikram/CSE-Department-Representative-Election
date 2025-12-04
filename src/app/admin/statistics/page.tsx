"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
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
    if ((role === "super_admin" || role === "admin") && electionId) {
      fetchStatistics();
    }
  }, [session, electionId]);

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`/api/admin/statistics?electionId=${electionId}`);
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setTotalBallots(data.totalBallots);
        setElection(data.election);
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

  const maxVotes = Math.max(...stats.map((s) => s.voteCount), 1);

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="text-cyan hover:text-cyan-light mb-4 inline-block"
          >
            ƒ+? Back to Admin Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Election <span className="text-cyan glow-text">Statistics</span>
            </h1>
          </div>

          {error && (
            <div className="card border-red-500 bg-red-500/10">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!error && election && (
            <>
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {election.name}
                </h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-cyan">Total Votes:</span>{" "}
                    <span className="text-white font-bold text-xl">
                      {totalBallots}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan">Total Candidates:</span>{" "}
                    <span className="text-white font-bold text-xl">
                      {stats.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {stats.map((candidate, index) => (
                  <div key={candidate.candidateId} className="card">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="text-3xl font-bold text-cyan">
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
                    <div className="w-full bg-navy-dark rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan to-cyan-light h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(candidate.voteCount / maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-cyan text-xl">Loading...</div>
    </div>
  );
}
