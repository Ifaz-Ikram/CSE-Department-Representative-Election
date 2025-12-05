"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

interface Candidate {
  id: string;
  name: string;
  indexNumber: string;
  email: string;
  bio?: string | null;
  photoUrl?: string | null;
  languages?: string[];
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
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
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

  // Countdown timer effect
  useEffect(() => {
    const election = elections.find((e) => e.id === selectedElectionId);
    if (!election) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(election.endTime);
      const start = new Date(election.startTime);

      // If election hasn't started yet, show time until start
      // If election is active, show time until end
      // If election ended, show null
      if (now > end) {
        setTimeRemaining(null);
        return;
      }

      const targetTime = now < start ? start : end;
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [elections, selectedElectionId]);

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
  }


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
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto" />
          <p className="text-cyan text-lg animate-pulse">Loading elections...</p>
        </div>
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
  const progressPercent = (selectedCandidates.size / 10) * 100;

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Cast Your <span className="text-gradient glow-text">Vote</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Select up to 10 candidates for the election
            </p>
          </div>

          <GlowDivider className="mb-8" />

          {/* Election Selector */}
          {elections.length > 1 && (
            <div className="glass-card p-6 mb-6 animate-slide-up">
              <label className="block text-sm font-bold text-cyan mb-3 uppercase tracking-wide">
                Select Election
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="input-field w-full md:w-96"
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
              {/* Election Info Card */}
              <div className="card-premium mb-6 animate-slide-up">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {selectedElection.name}
                    </h2>
                    {selectedElection.description && (
                      <p className="text-gray-400 mb-4">
                        {selectedElection.description}
                      </p>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-cyan font-semibold">Start:</span>
                        <span className="text-gray-300">
                          {new Date(selectedElection.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span className="text-cyan font-semibold">End:</span>
                        <span className="text-gray-300">
                          {new Date(selectedElection.endTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Countdown */}
                  <div className="text-right">
                    {isElectionActive && (
                      <span className="badge badge-active animate-pulse">
                        🟢 Active
                      </span>
                    )}
                    {isElectionEnded && (
                      <span className="badge badge-ended">
                        🔒 Ended
                      </span>
                    )}
                    {!isElectionActive && !isElectionEnded && (
                      <span className="badge badge-pending">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Countdown Timer */}
                {timeRemaining && isElectionActive && (
                  <div className="mt-6 pt-6 border-t border-cyan/10">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-dark/80 via-navy-lighter/50 to-navy-dark/80 backdrop-blur-sm border border-cyan/10 p-6">
                      {/* Subtle animated background glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan/5 to-transparent animate-pulse"></div>

                      <div className="relative">
                        <div className="flex items-center justify-center gap-1 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></div>
                          <span className="text-cyan/80 text-xs uppercase tracking-[0.2em] font-medium">
                            Voting Ends In
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></div>
                        </div>

                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          {/* Hours */}
                          <div className="group">
                            <div className="relative bg-navy-dark/60 backdrop-blur rounded-lg px-3 md:px-5 py-2 md:py-3 border border-cyan/20 group-hover:border-cyan/40 transition-colors">
                              <span className="text-2xl md:text-4xl font-mono font-bold text-white tracking-wider">
                                {String(timeRemaining.hours).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">hrs</p>
                          </div>

                          <span className="text-xl md:text-2xl font-light text-cyan/40 -mt-4">:</span>

                          {/* Minutes */}
                          <div className="group">
                            <div className="relative bg-navy-dark/60 backdrop-blur rounded-lg px-3 md:px-5 py-2 md:py-3 border border-cyan/20 group-hover:border-cyan/40 transition-colors">
                              <span className="text-2xl md:text-4xl font-mono font-bold text-white tracking-wider">
                                {String(timeRemaining.minutes).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">min</p>
                          </div>

                          <span className="text-xl md:text-2xl font-light text-cyan/40 -mt-4">:</span>

                          {/* Seconds */}
                          <div className="group">
                            <div className="relative bg-navy-dark/60 backdrop-blur rounded-lg px-3 md:px-5 py-2 md:py-3 border border-cyan/20 group-hover:border-cyan/40 transition-colors overflow-hidden">
                              <span className="text-2xl md:text-4xl font-mono font-bold text-cyan tracking-wider">
                                {String(timeRemaining.seconds).padStart(2, '0')}
                              </span>
                              {/* Subtle tick animation indicator */}
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50"></div>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">sec</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {ballot && (
                  <div className="mt-4 pt-4 border-t border-cyan/20">
                    <p className="text-cyan text-sm flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Last updated: {new Date(ballot.updatedAt).toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Message Alert */}
              {message && (
                <div
                  className={`glass-card mb-6 p-4 animate-fade-in ${message.type === "success"
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    {message.type === "success" ? (
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className={message.type === "success" ? "text-green-400" : "text-red-400"}>
                      {message.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Selection Summary & Submit */}
              <div className="glass-card mb-8 p-6 sticky top-20 z-30 animate-slide-up">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-auto">
                    <div className="flex items-center justify-between md:justify-start space-x-4 mb-3">
                      <span className="text-white font-bold text-lg">
                        Selected: <span className="text-cyan">{selectedCandidates.size}</span> / 10
                      </span>
                      {selectedCandidates.size === 10 && (
                        <span className="text-gold text-sm animate-pulse">✨ Maximum reached</span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="progress-bar w-full md:w-64">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !isElectionActive || selectedCandidates.size === 0}
                    className={`btn-primary w-full md:w-auto ${isElectionActive && selectedCandidates.size > 0 ? 'animate-pulse-glow' : ''
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none`}
                  >
                    {submitting ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </span>
                    ) : ballot ? (
                      "Update Vote"
                    ) : (
                      "Submit Vote"
                    )}
                  </button>
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {candidates.map((candidate, index) => {
                  const isSelected = selectedCandidates.has(candidate.id);
                  const photoUrl = normalizePhotoUrl(candidate.photoUrl);

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleCandidateToggle(candidate.id)}
                      className={`glass-card cursor-pointer transition-all duration-300 p-5 animate-slide-up ${isSelected
                        ? "border-cyan glow-border bg-cyan/10 scale-[1.02]"
                        : "hover:border-cyan/60 hover:scale-[1.01]"
                        }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-3 right-3">
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? "border-cyan bg-cyan shadow-lg shadow-cyan/50"
                            : "border-gray-500 bg-navy-dark/50"
                            }`}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Candidate Photo */}
                      <div className="flex justify-center mb-4">
                        {photoUrl ? (
                          <div className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-cyan shadow-lg shadow-cyan/30' : 'border-cyan/30'
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
                                    img.nextElementSibling?.classList.remove('hidden');
                                  }
                                }, 100);
                              }}
                            />
                            <div className="hidden w-full h-full bg-gradient-to-br from-cyan/20 to-navy-light flex items-center justify-center">
                              <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`w-24 h-24 rounded-xl bg-gradient-to-br from-navy-light to-navy-lighter border-2 flex items-center justify-center transition-all ${isSelected ? 'border-cyan shadow-lg shadow-cyan/30' : 'border-cyan/30'
                            }`}>
                            <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                          </div>
                        )}
                      </div>

                      {/* Candidate Info */}
                      <div className="text-center">
                        <h3 className={`text-lg font-bold mb-1 transition-colors ${isSelected ? 'text-cyan' : 'text-white'
                          }`}>
                          {candidate.name}
                        </h3>
                        <p className="text-gold text-sm font-semibold mb-2">
                          {candidate.indexNumber}
                        </p>
                        {/* Language Badges */}
                        {candidate.languages && candidate.languages.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center mb-3">
                            {["English", "Sinhala", "Tamil"].filter(lang => candidate.languages?.includes(lang)).map((lang) => (
                              <span
                                key={lang}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${lang === "English" ? "bg-cyan/10 text-cyan border-cyan/30"
                                  : lang === "Sinhala" ? "bg-gold/10 text-gold border-gold/30"
                                    : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  }`}
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}
                        {candidate.bio && (
                          <p className="text-gray-300 text-sm line-clamp-3 text-left bg-navy-dark/50 p-3 rounded-lg">
                            {candidate.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {candidates.length === 0 && (
                <div className="glass-card text-center p-12">
                  <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-400 text-lg">No candidates available for this election.</p>
                </div>
              )}
            </>
          )}

          {!selectedElection && elections.length === 0 && (
            <div className="glass-card text-center p-12 animate-fade-in">
              <svg className="w-20 h-20 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-400 text-lg">No elections available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
