"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

interface Candidate {
  id: string;
  name: string;
  indexNumber: string;
  email: string;
  bio?: string | null;
  photoUrl?: string | null;
}

interface Election {
  id: string;
  name: string;
  description?: string | null;
  startTime: string;
  endTime: string;
}

interface Ballot {
  id: string;
  updatedAt: string;
  choices: {
    candidate: Candidate;
  }[];
  election: Election;
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(
    new Set()
  );
  const [ballot, setBallot] = useState<Ballot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    if (selectedElectionId) {
      fetchCandidates();
      fetchBallot();
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const res = await fetch("/api/elections");
      const data = await res.json();
      setElections(data.elections);
      
      // Auto-select active election
      const now = new Date();
      const activeElection = data.elections.find((e: any) => {
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        return now >= start && now <= end;
      });
      
      if (activeElection) {
        setSelectedElectionId(activeElection.id);
      } else if (data.elections.length > 0) {
        setSelectedElectionId(data.elections[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch elections:", error);
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch(
        `/api/candidates?electionId=${selectedElectionId}`
      );
      const data = await res.json();
      setCandidates(data.candidates);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    }
  };

  const fetchBallot = async () => {
    try {
      const res = await fetch(`/api/vote?electionId=${selectedElectionId}`);
      const data = await res.json();
      
      if (data.ballot) {
        setBallot(data.ballot);
        const chosenIds = new Set<string>(
          data.ballot.choices.map((c: any) => c.candidate.id)
        );
        setSelectedCandidates(chosenIds);
      } else {
        setBallot(null);
        setSelectedCandidates(new Set<string>());
      }
    } catch (error) {
      console.error("Failed to fetch ballot:", error);
    }
  };

  const handleCandidateToggle = (candidateId: string) => {
    const election = elections.find((e) => e.id === selectedElectionId);
    if (!election) return;

    const now = new Date();
    const endTime = new Date(election.endTime);
    if (now > endTime) {
      setMessage({
        type: "error",
        text: "Election has ended. You cannot modify your vote.",
      });
      return;
    }

    const newSelection = new Set(selectedCandidates);
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId);
    } else {
      if (newSelection.size >= 10) {
        setMessage({
          type: "error",
          text: "You can only select up to 10 candidates.",
        });
        return;
      }
      newSelection.add(candidateId);
    }
    setSelectedCandidates(newSelection);
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!selectedElectionId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId: selectedElectionId,
          candidateIds: Array.from(selectedCandidates),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Your vote has been recorded successfully!",
        });
        fetchBallot();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to submit vote",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while submitting your vote",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
      </div>
    );
  }

  const selectedElection = elections.find((e) => e.id === selectedElectionId);
  const isElectionActive =
    selectedElection &&
    new Date() >= new Date(selectedElection.startTime) &&
    new Date() <= new Date(selectedElection.endTime);
  const isElectionEnded =
    selectedElection && new Date() > new Date(selectedElection.endTime);

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Cast Your <span className="text-cyan glow-text">Vote</span>
            </h1>
            <p className="text-gray-400">
              Select up to 10 candidates for the election
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

          {selectedElection && (
            <>
              {/* Election Info */}
              <div className="card mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedElection.name}
                </h2>
                {selectedElection.description && (
                  <p className="text-gray-400 mb-4">
                    {selectedElection.description}
                  </p>
                )}
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-cyan">Start:</span>{" "}
                    <span className="text-gray-300">
                      {new Date(selectedElection.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan">End:</span>{" "}
                    <span className="text-gray-300">
                      {new Date(selectedElection.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>
                {!isElectionActive && !isElectionEnded && (
                  <div className="mt-4 text-yellow-accent font-bold">
                    ⏳ Election has not started yet
                  </div>
                )}
                {isElectionEnded && (
                  <div className="mt-4 text-red-400 font-bold">
                    🔒 Election has ended. Votes are locked.
                  </div>
                )}
                {ballot && (
                  <div className="mt-4 text-cyan">
                    <div className="text-sm">
                      Last updated:{" "}
                      {new Date(ballot.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`card mb-6 ${
                    message.type === "success"
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10"
                  }`}
                >
                  <p
                    className={
                      message.type === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {message.text}
                  </p>
                </div>
              )}

              {/* Selection Summary */}
              <div className="card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">
                      Selected: {selectedCandidates.size} / 10
                    </span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !isElectionActive}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Submitting..."
                      : ballot
                      ? "Update Vote"
                      : "Submit Vote"}
                  </button>
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => {
                  const isSelected = selectedCandidates.has(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      className={`card cursor-pointer transition-all ${
                        isSelected
                          ? "border-cyan glow-border bg-cyan/10"
                          : "hover:border-cyan/60"
                      }`}
                      onClick={() => handleCandidateToggle(candidate.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                            isSelected
                              ? "border-cyan bg-cyan"
                              : "border-gray-500"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-navy"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {candidate.name}
                          </h3>
                          <p className="text-cyan text-sm mb-1">
                            {candidate.indexNumber}
                          </p>
                          <p className="text-gray-400 text-xs mb-2">
                            {candidate.email}
                          </p>
                          {candidate.bio && (
                            <p className="text-gray-300 text-sm">
                              {candidate.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {candidates.length === 0 && (
                <div className="card text-center text-gray-400">
                  <p>No candidates available for this election.</p>
                </div>
              )}
            </>
          )}

          {!selectedElection && elections.length === 0 && (
            <div className="card text-center text-gray-400">
              <p>No elections available at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
