"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
    startTime: string | Date;
    endTime: string | Date;
}

export default function CountdownTimer({ startTime, endTime }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date();
            const end = new Date(endTime);
            const start = new Date(startTime);

            // If election ended, show null
            if (now > end) {
                setTimeRemaining(null);
                return;
            }

            // If election hasn't started, target start time. If active, target end time.
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
    }, [startTime, endTime]);

    if (!timeRemaining) return null;

    const isUrgent = timeRemaining.hours === 0;
    const isWarning = timeRemaining.hours < 4;

    let message = "Voting Closes In";
    let accentColor = "cyan"; // Tailwind color name part

    if (isUrgent) {
        message = "Hurry! Less than an hour left ⏳";
        accentColor = "red-400";
    } else if (isWarning) {
        message = "Time is running out";
        accentColor = "yellow-400";
    }

    // Dynamic border/text classes based on urgency
    const borderColor = isUrgent ? "border-red-500/30" : isWarning ? "border-yellow-500/30" : "border-cyan/10";
    const textColor = isUrgent ? "text-red-400" : isWarning ? "text-yellow-400" : "text-cyan";
    const glowColor = isUrgent ? "from-red-500/10" : isWarning ? "from-yellow-500/10" : "from-cyan/5";
    const pulseColor = isUrgent ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-cyan";

    return (
        <div className={`mt-6 pt-6 border-t ${borderColor}`}>
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-dark/80 via-navy-lighter/50 to-navy-dark/80 backdrop-blur-sm border ${borderColor} p-6 transition-colors duration-1000`}>
                {/* Subtle animated background glow */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${glowColor} to-transparent animate-pulse`}></div>

                <div className="relative">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`}></div>
                        <span className={`${textColor} text-sm font-bold uppercase tracking-widest`}>
                            {message}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`}></div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <div className={`bg-navy-dark/60 backdrop-blur-md rounded-xl px-4 py-3 border ${borderColor} min-w-[70px] text-center`}>
                                <span className="text-3xl md:text-4xl font-mono font-bold text-white">
                                    {String(timeRemaining.hours).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-gray-500 text-xs mt-1 lowercase">hours</span>
                        </div>

                        <span className={`text-2xl font-light ${textColor} -mt-5`}>:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <div className={`bg-navy-dark/60 backdrop-blur-md rounded-xl px-4 py-3 border ${borderColor} min-w-[70px] text-center`}>
                                <span className="text-3xl md:text-4xl font-mono font-bold text-white">
                                    {String(timeRemaining.minutes).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-gray-500 text-xs mt-1 lowercase">mins</span>
                        </div>

                        <span className={`text-2xl font-light ${textColor} -mt-5`}>:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                            <div className={`bg-navy-dark/60 backdrop-blur-md rounded-xl px-4 py-3 border ${borderColor} min-w-[70px] text-center relative overflow-hidden`}>
                                <span className={`text-3xl md:text-4xl font-mono font-bold ${textColor}`}>
                                    {String(timeRemaining.seconds).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-gray-500 text-xs mt-1 lowercase">secs</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
