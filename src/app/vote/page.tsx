"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import ElectionCard from "@/components/ElectionCard";
import CandidatePhoto from "@/components/CandidatePhoto";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

interface Candidate {
  id: string;
  name: string;
  indexNumber: string;
  email: string;
  symbol?: string | null;
  photoUrl?: string | null;
  languages?: string[];
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
  const [elections, setElections] = useState<Election[]>([]);
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
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

      // Removed auto-select logic to start with selection view as requested
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

  // Show confirmation modal before submitting
  const handleShowConfirmation = () => {
    if (!selectedElectionId) return;
    setShowConfirmModal(true);
  };

  // Actual submission after confirmation
  const handleConfirmSubmit = async () => {
    if (!selectedElectionId) return;

    setShowConfirmModal(false);
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

  // Get selected candidates data for confirmation modal
  const getSelectedCandidatesData = () => {
    return candidates.filter(c => selectedCandidates.has(c.id));
  };

  const handleElectionSelect = (id: string) => {
    setSelectedElectionId(id);
    setShowGuidelinesModal(true); // Reset guidelines for new election
  };

  const handleBackToElections = () => {
    setSelectedElectionId("");
    setMessage(null);
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
                Cast Your <span className="text-gradient glow-text">Vote</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Select an election below to verify your eligibility and cast your ballot.
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
                      type="vote"
                      onClick={handleElectionSelect}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center p-12 animate-fade-in max-w-2xl mx-auto">
                <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">No Active Elections</h3>
                <p className="text-gray-400">There are currently no elections available for voting.</p>
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

      {/* Voting Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-dark/95 backdrop-blur-md"
            onClick={() => setShowGuidelinesModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] animate-slide-up rounded-2xl overflow-hidden bg-gradient-to-br from-navy-light to-navy-darker border-2 border-cyan/50 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(0, 229, 255, 0.3), 0 0 80px rgba(0, 229, 255, 0.1)' }}>
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Header with Gradient */}
              <div className="relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-cyan/10 to-gold/10 animate-shimmer" />

                <div className="relative p-6 border-b-2 border-cyan/30">
                  <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
                    <span className="inline-flex items-center space-x-2">
                      <span>📢</span>
                      <span>READ BEFORE</span>
                      <span className="text-gradient glow-text">VOTING</span>
                    </span>
                  </h2>
                  <p className="text-center text-gray-400">Please read these important guidelines carefully</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Category Breakdown */}
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center">
                    <span className="text-cyan mr-2"></span>
                    <span>Category Breakdown</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Sinhala Speaking Boys', value: '6', color: 'from-cyan/20 to-blue-500/20', border: 'border-cyan/40', textColor: 'text-cyan' },
                      { label: 'Sinhala Speaking Girls', value: '1', color: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-400/40', textColor: 'text-pink-400' },
                      { label: 'Tamil Speaking Boys', value: '2', color: 'from-blue-500/20 to-cyan/20', border: 'border-gold/40', textColor: 'text-gold' },
                      { label: 'Tamil Speaking Girls', value: '1', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-400/40', textColor: 'text-purple-400' }
                    ].map((cat, i) => (
                      <div key={i} className={`bg-gradient-to-br ${cat.color} rounded-xl p-4 border-2 ${cat.border} text-center transition-transform duration-300 hover:scale-105`} style={{ boxShadow: `0 0 20px ${cat.border.includes('cyan') ? 'rgba(0,229,255,0.2)' : cat.border.includes('pink') ? 'rgba(236,72,153,0.2)' : cat.border.includes('gold') ? 'rgba(247,201,72,0.2)' : 'rgba(168,85,247,0.2)'}`, willChange: 'transform' }}>
                        <div className={`text-3xl font-bold ${cat.textColor} mb-1`}>{cat.value}</div>
                        <div className="text-xs text-gray-300 font-medium uppercase tracking-wide">{cat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-4 md:p-5 border-2 border-gold/30 shadow-lg" style={{ boxShadow: '0 0 30px rgba(247, 201, 72, 0.15)' }}>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center">
                    <span className="text-gold mr-2">⚠️</span>
                    <span>Important Voting Notes</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-navy-darker/50 border border-gold/20 transition-all duration-300 hover:border-gold/40 hover:bg-navy-darker/70">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan/30">
                        <span className="text-navy-dark font-bold">1</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        <span className="text-white font-semibold">Selection is NOT purely based on vote count.</span> Final representatives will be chosen <span className="text-cyan font-medium">within each category</span>, not by highest votes overall.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-navy-darker/50 border border-gold/20 transition-all duration-300 hover:border-gold/40 hover:bg-navy-darker/70">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan/30">
                        <span className="text-navy-dark font-bold">2</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        <span className="text-white font-semibold">Keep category numbers in mind</span> while voting to ensure balanced representation across all groups.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-navy-darker/50 border border-gold/20 transition-all duration-300 hover:border-gold/40 hover:bg-navy-darker/70">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan/30">
                        <span className="text-navy-dark font-bold">3</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        <span className="text-white font-semibold">Every stream needs representation.</span> A candidate with high votes <span className="text-red-400 font-medium">might NOT be selected</span> if their stream is filled. A candidate with fewer votes <span className="text-green-400 font-medium">might be selected</span> to ensure fair representation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t-2 border-cyan/30 bg-navy-darker/50 rounded-b-2xl">
                <button
                  onClick={() => setShowGuidelinesModal(false)}
                  className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>I Understand, Let Me Vote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vote Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-dark/95 backdrop-blur-md"
            onClick={() => setShowConfirmModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg max-h-[90vh] animate-slide-up rounded-2xl overflow-hidden bg-gradient-to-br from-navy-light to-navy-darker border-2 border-cyan/50 shadow-2xl" style={{ boxShadow: '0 0 40px rgba(0, 229, 255, 0.3), 0 0 80px rgba(0, 229, 255, 0.1)' }}>
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b-2 border-cyan/30 bg-gradient-to-r from-cyan/10 to-transparent">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/30 to-cyan/10 flex items-center justify-center border-2 border-cyan/50 shadow-lg shadow-cyan/20">
                    <svg className="w-6 h-6 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-center text-white mb-1">
                  Confirm Your <span className="text-gradient glow-text">Selection</span>
                </h2>
                <p className="text-center text-gray-400 text-sm">
                  You have selected <span className="text-cyan font-bold">{selectedCandidates.size}</span> candidate{selectedCandidates.size !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Selected Candidates List */}
              <div className="p-4 md:p-6">
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {getSelectedCandidatesData().map((candidate, index) => {
                    const photoUrl = normalizePhotoUrl(candidate.photoUrl);
                    return (
                      <div
                        key={candidate.id}
                        className="glass-card p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-cyan/10 border border-cyan/50 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Candidate Photo */}
                        <div className="flex-shrink-0">
                          <CandidatePhoto
                            url={photoUrl}
                            name={candidate.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 border-cyan shadow-lg shadow-cyan/30"
                            initialsClassName="text-lg font-bold text-cyan"
                          />
                        </div>

                        {/* Name + Index */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-cyan truncate">
                            {candidate.name}
                          </h3>
                          <p className="text-gold text-xs md:text-sm font-semibold">
                            {candidate.indexNumber}
                          </p>
                        </div>

                        {/* Symbol */}
                        <div className="flex-shrink-0 w-12 md:w-16 flex items-center justify-center">
                          {candidate.symbol ? (
                            <span className="text-2xl md:text-4xl">{candidate.symbol}</span>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-dashed flex items-center justify-center">
                              <span className="text-gray-500 text-xs">—</span>
                            </div>
                          )}
                        </div>

                        {/* X Selection Box */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 border-green-500 bg-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <span className="text-2xl md:text-3xl font-bold text-green-400">✗</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer with Buttons */}
              <div className="p-4 md:p-6 border-t-2 border-cyan/30 bg-navy-darker/50 space-y-3">
                <button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center space-x-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{ballot ? "Confirm Update" : "Confirm Vote"}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Go Back & Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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

          {/* Welcome Message */}
          <div className="mb-6 animate-fade-in">
            <p className="text-gray-400 text-lg">
              Welcome back, <span className="text-cyan font-semibold">{session?.user?.name || 'Voter'}</span>
            </p>
          </div>

          {/* Header */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-cyan/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Cast Your <span className="text-gradient glow-text">Vote</span>
                </h1>
                <p className="text-gray-400 text-lg">
                  Select up to 10 candidates for the election
                </p>
              </div>
            </div>
          </div>

          <GlowDivider className="mb-8" />

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
                      <span className="inline-flex items-center space-x-1.5 px-2 py-1 md:px-4 md:py-2 rounded-lg bg-green-500/20 border border-green-500/50 animate-pulse">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-ping"></span>
                        <span className="text-green-400 font-semibold text-xs md:text-sm">LIVE</span>
                      </span>
                    )}
                    {isElectionEnded && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-1 md:px-4 md:py-2 rounded-lg bg-red-500/20 border border-red-500/50">
                        <svg className="w-3 h-3 md:w-4 md:h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-400 font-semibold text-xs md:text-sm">ENDED</span>
                      </span>
                    )}
                    {!isElectionActive && !isElectionEnded && (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-1 md:px-4 md:py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                        <svg className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-400 font-semibold text-xs md:text-sm">UPCOMING</span>
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

              {/* Voting Guidelines Section */}
              <div className="mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
                {/* Category Counts */}
                <div className="glass-card p-6 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Category Breakdown</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-navy-dark/50 rounded-xl p-4 border border-cyan/10 text-center">
                      <div className="text-2xl font-bold text-cyan mb-1">6</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Sinhala Speaking Boy</div>
                    </div>
                    <div className="bg-navy-dark/50 rounded-xl p-4 border border-pink-500/20 text-center">
                      <div className="text-2xl font-bold text-pink-400 mb-1">1</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Sinhala Speaking Girl</div>
                    </div>
                    <div className="bg-navy-dark/50 rounded-xl p-4 border border-gold/20 text-center">
                      <div className="text-2xl font-bold text-gold mb-1">2</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Tamil Speaking Boy</div>
                    </div>
                    <div className="bg-navy-dark/50 rounded-xl p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">1</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Tamil Speaking Girl</div>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="glass-card p-6 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-transparent">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-yellow-400">Important Voting Notes</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cyan text-xs font-bold">1</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        <span className="text-white font-medium">Selection is not purely based on vote count.</span> Final representatives will be chosen <span className="text-cyan">within each category</span>, not by highest votes overall.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cyan text-xs font-bold">2</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        <span className="text-white font-medium">Keep category numbers in mind</span> while voting to ensure balanced representation across all groups.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cyan text-xs font-bold">3</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        <span className="text-white font-medium">Every stream needs representation.</span> A candidate with high votes <span className="text-red-400">might not be selected</span> if their stream is filled. A candidate with fewer votes <span className="text-green-400">might be selected</span> to ensure fair representation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success/Error Message */}
              {message && (
                <div
                  className={`glass-card mb-6 p-4 animate-fade-in ${message.type === "success"
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10"
                    }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
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
                    {message.type === "success" && (
                      <Link
                        href={`/my-votes?electionId=${selectedElectionId}`}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan/20 border border-cyan/50 text-cyan hover:bg-cyan/30 transition-all text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>View My Votes</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Selection Summary & Submit */}
              <div className="mb-8 p-6 sticky top-[110px] z-40 rounded-xl border border-cyan/30" style={{ backgroundColor: '#050a15', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.9)' }}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-auto">
                    <div className="flex items-center justify-between md:justify-start space-x-4 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-white font-bold text-lg">
                            Selected: <span className="text-cyan text-2xl">{selectedCandidates.size}</span><span className="text-gray-500 text-base"> / 10</span>
                          </span>
                        </div>
                      </div>
                      {selectedCandidates.size === 10 && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gold/20 border border-gold/50 text-gold text-sm animate-pulse">
                          <span>Maximum</span>
                        </span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full md:w-72 h-3 rounded-full bg-navy-dark overflow-hidden border border-cyan/20">
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-cyan to-cyan-light transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleShowConfirmation}
                    disabled={submitting || !isElectionActive || (selectedCandidates.size === 0 && !ballot)}
                    className={`btn-primary w-full md:w-auto px-8 py-3 text-lg flex items-center justify-center space-x-2 ${isElectionActive && (selectedCandidates.size > 0 || ballot) ? 'animate-pulse-glow' : ''
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none`}
                  >
                    {submitting ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{ballot ? "Update Vote" : "Submit Vote"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ballot Paper Rows */}
              <div className="space-y-3">
                {candidates.map((candidate, index) => {
                  const isSelected = selectedCandidates.has(candidate.id);
                  const photoUrl = normalizePhotoUrl(candidate.photoUrl);

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleCandidateToggle(candidate.id)}
                      className={`glass-card cursor-pointer transition-all duration-300 p-4 animate-slide-up ${isSelected
                        ? "border-cyan glow-border bg-cyan/10"
                        : "hover:border-cyan/60"
                        }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Candidate Photo */}
                        <div className="flex-shrink-0">
                          <CandidatePhoto
                            url={photoUrl}
                            name={candidate.name}
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 transition-all ${isSelected
                              ? "border-cyan shadow-lg shadow-cyan/30"
                              : "border-cyan/30"
                              }`}
                            initialsClassName="text-xl font-bold text-cyan"
                          />
                        </div>

                        {/* Name + Index + Languages */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg md:text-xl font-bold transition-colors truncate ${isSelected ? 'text-cyan' : 'text-white'
                            }`}>
                            {candidate.name}
                          </h3>
                          <p className="text-gold text-sm font-semibold mb-1">
                            {candidate.indexNumber}
                          </p>
                          {/* Language Badges */}
                          {candidate.languages && candidate.languages.length > 0 && (
                            <div className="flex flex-wrap gap-1">
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
                        </div>

                        {/* Symbol */}
                        <div className="flex-shrink-0 w-16 md:w-20 flex items-center justify-center">
                          {candidate.symbol ? (
                            <span className="text-4xl md:text-5xl">{candidate.symbol}</span>
                          ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-gray-600 border-dashed flex items-center justify-center">
                              <span className="text-gray-500 text-xs">—</span>
                            </div>
                          )}
                        </div>

                        {/* X Selection Box */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border-3 flex items-center justify-center transition-all ${isSelected
                              ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20"
                              : "border-gray-500 bg-navy-dark/50 hover:border-green-500/50"
                              }`}
                          >
                            {isSelected && (
                              <span className="text-3xl md:text-4xl font-bold text-green-400">✗</span>
                            )}
                          </div>
                        </div>
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
