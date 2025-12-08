"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

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

interface ElectionCardProps {
    election: Election;
    type: "vote" | "result" | "my-vote";
    onClick: (id: string) => void;
}

export default function ElectionCard({ election, type, onClick }: ElectionCardProps) {
    const [timeRemaining, setTimeRemaining] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    // Memoize date objects to prevent infinite re-renders
    const start = useMemo(() => new Date(election.startTime), [election.startTime]);
    const end = useMemo(() => new Date(election.endTime), [election.endTime]);

    // Determine status (calculate once per render)
    const now = new Date();
    const isActive = now >= start && now <= end;
    const isEnded = now > end;
    const isUpcoming = now < start;

    useEffect(() => {
        if (!isActive && !isUpcoming) {
            setTimeRemaining(null);
            return;
        }

        const calculateTimeRemaining = () => {
            const currentNow = new Date();
            // If upcoming, count down to start. If active, count down to end.
            const targetTime = isUpcoming ? start : end;
            const diff = targetTime.getTime() - currentNow.getTime();

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
    }, [isActive, isUpcoming, start, end]);

    // Determine styles based on status
    let borderColor = "border-gray-500/30";
    let activeClass = "";
    let badge = null;
    let btnConfig = {
        text: "View Details",
        style: "bg-navy-dark border-cyan/30 text-cyan hover:bg-cyan/10"
    };

    if (isActive) {
        borderColor = "border-green-500/50";
        activeClass = "shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_25px_rgba(34,197,94,0.2)]";
        badge = (
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold animate-pulse">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-ping"></span>
                <span>LIVE</span>
            </span>
        );
        if (type === "vote") {
            btnConfig = {
                text: "Vote Now →",
                style: "bg-cyan/10 border-cyan text-cyan hover:bg-cyan hover:text-navy-dark font-bold shadow-lg shadow-cyan/20"
            };
        } else if (type === "my-vote") {
            btnConfig = {
                text: "View My Vote",
                style: "bg-cyan/10 border-cyan text-cyan hover:bg-cyan hover:text-navy-dark font-bold"
            };
        } else {
            btnConfig = {
                text: "View Live Results",
                style: "bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500 hover:text-navy-dark font-bold"
            };
        }
    } else if (isUpcoming) {
        borderColor = "border-yellow-500/50";
        badge = (
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>UPCOMING</span>
            </span>
        );
        btnConfig = {
            text: timeRemaining ? `Starts in ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s` : "Upcoming",
            style: "bg-yellow-500/5 border-yellow-500/30 text-yellow-500 cursor-not-allowed opacity-80"
        };
    } else if (isEnded) {
        borderColor = "border-gray-500/40";
        badge = (
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>ENDED</span>
            </span>
        );
        if (type === "result") {
            btnConfig = {
                text: "View Results",
                style: "bg-gold/10 border-gold text-gold hover:bg-gold hover:text-navy-dark font-bold"
            };
        } else if (type === "my-vote") {
            btnConfig = {
                text: "View My Vote",
                style: "bg-cyan/10 border-cyan text-cyan hover:bg-cyan hover:text-navy-dark font-bold"
            };
        } else {
            btnConfig = {
                text: "Election Ended",
                style: "bg-gray-700/20 border-gray-600 text-gray-400 cursor-not-allowed"
            };
        }
    }

    // Handle click - only allow if active (for vote) or ended/active (for results)
    // Actually, for consistency, let's allow clicking 'ended' in vote mode if we want to show 'results' there? 
    // No, the requirement says "Vote Page... Click active election -> voting".
    // "Results Page... Click election -> results".
    // For simplicity, we'll let the parent handle the click, but visual disabled state helps.
    const isDisabled = (type === "vote" && !isActive) || (type === "result" && isUpcoming);

    return (
        <div
            onClick={() => !isDisabled && onClick(election.id)}
            className={`glass-card p-6 h-full flex flex-col justify-between transition-all duration-300 border-2 ${borderColor} ${activeClass} ${!isDisabled ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-75 cursor-not-allowed'}`}
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    {badge}
                    {isActive && timeRemaining && (
                        <span className="text-cyan font-mono text-sm">
                            Ends in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                        </span>
                    )}
                    {isUpcoming && (
                        <span className="text-yellow-500/80 font-mono text-sm">
                            {start.toLocaleDateString()}
                        </span>
                    )}
                    {isEnded && (
                        <span className="text-gray-500 font-mono text-sm">
                            {end.toLocaleDateString()}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                    {election.name}
                </h3>

                {election.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {election.description}
                    </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-6">
                    <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{election._count?.candidates || 0} Candidates</span>
                    </div>
                    {/* We might not always have votes count visible in client for vote page, but nice to have if available */}
                    {(type === "result" || isEnded) && (
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>{election._count?.ballots || 0} Votes</span>
                        </div>
                    )}
                </div>
            </div>

            <button
                className={`w-full py-2.5 rounded-lg border transition-all duration-300 text-sm uppercase tracking-wider flex items-center justify-center space-x-2 ${btnConfig.style}`}
                disabled={isDisabled}
            >
                <span>{btnConfig.text}</span>
            </button>
        </div>
    );
}
