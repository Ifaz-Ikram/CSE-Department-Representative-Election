"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import GlowDivider from "@/components/GlowDivider";
import ElectionCard from "@/components/ElectionCard";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";
import Link from "next/link";

interface Candidate {
    id: string;
    name: string;
    indexNumber: string;
    email: string;
    bio?: string | null;
    photoUrl?: string | null;
    languages?: string[];
}

interface Ballot {
    id: string;
    updatedAt: string;
    choices: {
        candidate: Candidate;
    }[];
    election: {
        id: string;
        name: string;
        description?: string | null;
        startTime: string;
        endTime: string;
    };
}

export default function MyVotesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [ballots, setBallots] = useState<Ballot[]>([]);
    const [selectedBallotId, setSelectedBallotId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchMyVotes();
        }
    }, [session]);

    const fetchMyVotes = async () => {
        try {
            const res = await fetch("/api/my-votes");
            const data = await res.json();
            if (data.ballots) {
                setBallots(data.ballots);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch votes:", error);
            setLoading(false);
        }
    };

    const handleElectionSelect = (electionId: string) => {
        const ballot = ballots.find(b => b.election.id === electionId);
        if (ballot) {
            setSelectedBallotId(ballot.id);
        }
    };

    const handleBackToList = () => {
        setSelectedBallotId(null);
    };

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center circuit-bg">
                <div className="text-center space-y-4">
                    <div className="loading-spinner mx-auto" />
                    <p className="text-cyan text-lg animate-pulse">Loading your votes...</p>
                </div>
            </div>
        );
    }

    const selectedBallot = ballots.find(b => b.id === selectedBallotId);

    // If no ballot selected, show election selection view (list of voted elections)
    if (!selectedBallotId) {
        return (
            <div className="min-h-screen circuit-bg">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8 animate-fade-in text-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                My <span className="text-gradient glow-text">Votes</span>
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Select an election to review your submitted ballot.
                            </p>
                        </div>

                        <GlowDivider className="mb-12" />

                        {/* Elections Grid (Using derived elections from ballots) */}
                        {ballots.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ballots.map((ballot, index) => (
                                    <div key={ballot.election.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                        <ElectionCard
                                            election={ballot.election}
                                            type="my-vote"
                                            onClick={handleElectionSelect}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card text-center p-12 animate-fade-in max-w-2xl mx-auto">
                                <div className="w-16 h-16 mx-auto rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Votes Yet</h3>
                                <p className="text-gray-400 mb-6">You haven't submitted any votes yet.</p>
                                <Link href="/vote" className="btn-primary inline-flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                                    </svg>
                                    <span>Cast Your Vote</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // Detailed View
    return (
        <div className="min-h-screen circuit-bg">
            <Navigation />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={handleBackToList}
                        className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-cyan transition-colors group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to My Votes</span>
                    </button>

                    {/* Header */}
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan/30 to-cyan/10 flex items-center justify-center border-2 border-cyan/50 shadow-lg shadow-cyan/20">
                                <svg className="w-7 h-7 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    My <span className="text-gradient glow-text">Votes</span>
                                </h1>
                                <p className="text-gray-400">Review your submitted vote</p>
                            </div>
                        </div>
                    </div>

                    {selectedBallot && (
                        <div className="glass-card overflow-hidden animate-slide-up">
                            {/* Election Header */}
                            <div className="p-6 border-b border-cyan/20 bg-gradient-to-r from-cyan/10 to-transparent">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedBallot.election.name}</h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Voted on: {new Date(selectedBallot.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-400 font-semibold">{selectedBallot.choices.length} Candidates Selected</span>
                                    </div>
                                </div>
                            </div>

                            {/* Candidates List */}
                            <div className="p-6">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {selectedBallot.choices.map((choice) => {
                                        const photoUrl = normalizePhotoUrl(choice.candidate.photoUrl);
                                        return (
                                            <div
                                                key={choice.candidate.id}
                                                className="flex items-center space-x-3 p-3 rounded-lg bg-navy-darker/50 border border-cyan/20 hover:border-cyan/40 transition-all duration-200"
                                            >

                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan/40 flex-shrink-0">
                                                    {photoUrl ? (
                                                        <img
                                                            src={photoUrl}
                                                            alt={choice.candidate.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full bg-gradient-to-br from-cyan/30 to-cyan-light/20 flex items-center justify-center text-cyan font-bold text-sm ${photoUrl ? 'hidden' : ''}`}>
                                                        {getInitials(choice.candidate.name)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold truncate">{choice.candidate.name}</p>
                                                    <p className="text-cyan text-xs">{choice.candidate.indexNumber}</p>
                                                </div>
                                                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
