/**
 * BackgroundGrid Component
 * Animated circuit-style background grid
 */

interface BackgroundGridProps {
    children: React.ReactNode;
    className?: string;
}

export default function BackgroundGrid({ children, className = '' }: BackgroundGridProps) {
    return (
        <div className={`circuit-bg relative ${className}`}>
            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan/5 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
