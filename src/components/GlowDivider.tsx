/**
 * GlowDivider Component
 * A reusable animated divider with neon glow effect
 */

interface GlowDividerProps {
    className?: string;
    variant?: 'cyan' | 'gold';
}

export default function GlowDivider({ className = '', variant = 'cyan' }: GlowDividerProps) {
    const colors = {
        cyan: 'bg-gradient-to-r from-transparent via-cyan to-transparent',
        gold: 'bg-gradient-to-r from-transparent via-gold to-transparent',
    };

    const glowColors = {
        cyan: 'shadow-[0_0_10px_rgba(0,229,255,0.4)]',
        gold: 'shadow-[0_0_10px_rgba(247,201,72,0.4)]',
    };

    return (
        <div
            className={`h-0.5 w-full ${colors[variant]} ${glowColors[variant]} ${className}`}
            aria-hidden="true"
        />
    );
}
