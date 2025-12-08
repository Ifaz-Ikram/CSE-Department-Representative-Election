"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getInitials } from "@/lib/themeHelpers";

interface CandidatePhotoProps {
    url?: string | null;
    name: string;
    className?: string; // Container classes (width/height/rounded/border)
    initialsClassName?: string; // Classes for the initials text (size/color)
}

/**
 * Optimized Candidate Photo Component
 * Uses next/image for loaded photos and falls back to Initials UI on error.
 */
export default function CandidatePhoto({
    url,
    name,
    className = "",
    initialsClassName = "text-xl font-bold text-cyan",
}: CandidatePhotoProps) {
    const [error, setError] = useState(false);

    // Reset error state if url changes
    useEffect(() => {
        setError(false);
    }, [url]);

    if (!url || error) {
        return (
            <div
                className={`relative overflow-hidden bg-gradient-to-br from-navy-light to-navy-lighter flex items-center justify-center ${className}`}
            >
                <span className={initialsClassName}>{getInitials(name)}</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={url}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={false}
                onError={() => setError(true)}
            />
        </div>
    );
}
