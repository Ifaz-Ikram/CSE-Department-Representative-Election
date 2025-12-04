"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function AdminBallotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get("electionId");

  const [ballots, setBallots] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if ((session?.user.role === "super_admin" || session?.user.role === "admin") && electionId) {
      fetchBallots();
    }
  }, [session, electionId]);

  const fetchBallots = async () => {
    try {
      const res = await fetch(`/api/admin/ballots?electionId=${electionId}`);
      const data = await res.json();

      if (res.ok) {
        setBallots(data.ballots);
        setElection(data.election);
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
          <Link href="/admin" className="text-cyan hover:text-cyan-light mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Voter <span className="text-cyan glow-text">Ballots</span>
            </h1>
            {election && (
              <p className="text-gray-400">{election.name}</p>
            )}
          </div>

          {error && (
            <div className="card border-red-500 bg-red-500/10">
              <p className="text-red-400">{error}</p>
              <p className="text-gray-400 text-sm mt-2">
                Access may be restricted based on election status and your role.
              </p>
            </div>
          )}

          {!error && (
            <>
              <div className="card mb-6">
                <div className="text-sm text-gray-400">
                  <p className="mb-2">
                    <strong className="text-cyan">Total Ballots:</strong>{" "}
                    {ballots.length}
                  </p>
                  <p className="text-xs text-yellow-400">
                    ⚠️ This data is sensitive. Handle with care.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {ballots.map((ballot) => (
                  <div key={ballot.id} className="card">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {ballot.voter.name}
                          </h4>
                          <p className="text-cyan text-sm">
                            {ballot.voter.indexNumber}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {ballot.voter.email}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>Updated:</div>
                          <div>{new Date(ballot.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-cyan/20 pt-4">
                      <p className="text-sm font-bold text-cyan mb-2">
                        Selected Candidates ({ballot.choices.length}/10):
                      </p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {ballot.choices.map((choice: any) => (
                          <div
                            key={choice.id}
                            className="bg-navy-dark rounded px-3 py-2 text-sm"
                          >
                            <div className="text-white font-bold">
                              {choice.candidate.name}
                            </div>
                            <div className="text-cyan text-xs">
                              {choice.candidate.indexNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                      {ballot.choices.length === 0 && (
                        <p className="text-gray-400 text-sm">
                          No candidates selected (blank ballot)
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {ballots.length === 0 && (
                  <div className="card text-center text-gray-400">
                    <p>No ballots submitted yet.</p>
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
