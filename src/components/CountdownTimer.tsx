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

    return (
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
                                    {String(timeRemaining.hours).padStart(2, "0")}
                                </span>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">
                                hrs
                            </p>
                        </div>

                        <span className="text-xl md:text-2xl font-light text-cyan/40 -mt-4">
                            :
                        </span>

                        {/* Minutes */}
                        <div className="group">
                            <div className="relative bg-navy-dark/60 backdrop-blur rounded-lg px-3 md:px-5 py-2 md:py-3 border border-cyan/20 group-hover:border-cyan/40 transition-colors">
                                <span className="text-2xl md:text-4xl font-mono font-bold text-white tracking-wider">
                                    {String(timeRemaining.minutes).padStart(2, "0")}
                                </span>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">
                                min
                            </p>
                        </div>

                        <span className="text-xl md:text-2xl font-light text-cyan/40 -mt-4">
                            :
                        </span>

                        {/* Seconds */}
                        <div className="group">
                            <div className="relative bg-navy-dark/60 backdrop-blur rounded-lg px-3 md:px-5 py-2 md:py-3 border border-cyan/20 group-hover:border-cyan/40 transition-colors overflow-hidden">
                                <span className="text-2xl md:text-4xl font-mono font-bold text-cyan tracking-wider">
                                    {String(timeRemaining.seconds).padStart(2, "0")}
                                </span>
                                {/* Subtle tick animation indicator */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50"></div>
                            </div>
                            <p className="text-center text-[10px] md:text-xs text-gray-500 mt-1.5 uppercase tracking-wider">
                                sec
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
