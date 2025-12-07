"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getInitials } from "@/lib/themeHelpers";

export default function Navigation() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Check if results should be visible based on ended elections and visibility toggles
  useEffect(() => {
    const checkElectionStatus = async () => {
      try {
        const res = await fetch('/api/elections');
        if (res.ok) {
          const data = await res.json();
          const now = new Date();

          const isSuperAdmin = role === 'super_admin';
          const isAdmin = role === 'admin';
          const isVoter = role === 'voter';

          // Super admin always sees results if there are any ended elections
          if (isSuperAdmin) {
            const hasEndedElection = data.elections?.some((election: any) => {
              const end = new Date(election.endTime);
              return now > end;
            });
            setShowResults(hasEndedElection);
            return;
          }

          // For admins: show if any election has ended (auto-enable on access)
          if (isAdmin) {
            const hasEndedElection = data.elections?.some((election: any) => {
              const end = new Date(election.endTime);
              return now > end;
            });
            setShowResults(hasEndedElection);
            return;
          }

          // For voters: show only if manually enabled via publicResultsVisible
          if (isVoter) {
            const hasPublicResults = data.elections?.some((election: any) => {
              const end = new Date(election.endTime);
              return now > end && election.publicResultsVisible === true;
            });
            setShowResults(hasPublicResults);
            return;
          }

          // Default: hide results
          setShowResults(false);
        }
      } catch (error) {
        console.error('Failed to check election status:', error);
        setShowResults(false);
      }
    };

    if (session) {
      checkElectionStatus();
    }
  }, [session, role]);

  if (status === "loading") {
    return null;
  }

  return (
    <>
      <nav className="border-b border-cyan/20 bg-navy-dark sticky top-0 z-50 shadow-lg mb-8">

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <Link href="/" className="flex items-center group py-1">
              <div className="font-[family-name:var(--font-orbitron)] flex flex-col justify-center">
                <div className="text-xl font-bold tracking-wide leading-none">
                  <span className="text-white">CSE </span>
                  <span className="text-gold glow-text-gold">23</span>
                </div>
                <div className="hidden md:block text-cyan text-xs tracking-wide uppercase leading-none mt-1.5">
                  Department Elections
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {session ? (
                <>
                  <Link
                    href="/vote"
                    className={`relative group px-3 py-2 transition-all duration-300 ${pathname === "/vote" ? "text-cyan" : "text-white hover:text-cyan"
                      }`}
                  >
                    <span className="relative z-10">Vote</span>
                    {pathname === "/vote" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent glow-border" />
                    )}
                  </Link>
                  <Link
                    href="/my-votes"
                    className={`relative group px-3 py-2 transition-all duration-300 ${pathname === "/my-votes" ? "text-cyan" : "text-white hover:text-cyan"
                      }`}
                  >
                    <span className="relative z-10">My Votes</span>
                    {pathname === "/my-votes" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent glow-border" />
                    )}
                  </Link>
                  {showResults && (
                    <Link
                      href="/results"
                      className={`relative group px-3 py-2 transition-all duration-300 ${pathname === "/results" ? "text-cyan" : "text-white hover:text-cyan"
                        }`}
                    >
                      <span className="relative z-10">Results</span>
                      {pathname === "/results" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent glow-border" />
                      )}
                    </Link>
                  )}
                  {(session.user.role === "admin" ||
                    session.user.role === "super_admin") && (
                      <Link
                        href="/admin"
                        className={`relative group px-3 py-2 transition-all duration-300 ${pathname.startsWith("/admin") ? "text-cyan" : "text-white hover:text-cyan"
                          }`}
                      >
                        <span className="relative z-10">Admin</span>
                        {pathname.startsWith("/admin") && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent glow-border" />
                        )}
                      </Link>
                    )}

                  {/* User Profile Section */}
                  <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-cyan/30">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan/50 shadow-lg flex-shrink-0">
                        {session.user.image ? (
                          <img
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center font-bold text-navy">
                            {getInitials(session.user.name || "")}
                          </div>
                        )}
                      </div>
                      {/* User Info */}
                      <div className="text-sm">
                        <div className="text-white font-semibold">{session.user.name}</div>
                        <div className="text-cyan text-xs">
                          {session.user.indexNumber}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="btn-glass text-xs"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => signIn("google", { callbackUrl: "/" })} className="btn-primary flex items-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-cyan p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 animate-slide-up">
              {session ? (
                <>
                  {/* User Info Mobile */}
                  <div className="flex items-center space-x-3 p-3 bg-navy-light/50 rounded-lg border border-cyan/20">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan/50 flex-shrink-0">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center font-bold text-navy">
                          {getInitials(session.user.name || "")}
                        </div>
                      )}
                    </div>
                    <div className="text-sm flex-1">
                      <div className="text-white font-semibold">{session.user.name}</div>
                      <div className="text-cyan text-xs">{session.user.indexNumber}</div>
                    </div>
                  </div>

                  <Link
                    href="/vote"
                    className={`block px-4 py-3 rounded-lg transition-all ${pathname === "/vote"
                      ? "bg-cyan/20 text-cyan border border-cyan/50"
                      : "text-white hover:bg-cyan/10"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vote
                  </Link>
                  <Link
                    href="/my-votes"
                    className={`block px-4 py-3 rounded-lg transition-all ${pathname === "/my-votes"
                      ? "bg-cyan/20 text-cyan border border-cyan/50"
                      : "text-white hover:bg-cyan/10"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Votes
                  </Link>
                  {showResults && (
                    <Link
                      href="/results"
                      className={`block px-4 py-3 rounded-lg transition-all ${pathname === "/results"
                        ? "bg-cyan/20 text-cyan border border-cyan/50"
                        : "text-white hover:bg-cyan/10"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Results
                    </Link>
                  )}
                  {(session.user.role === "admin" ||
                    session.user.role === "super_admin") && (
                      <Link
                        href="/admin"
                        className={`block px-4 py-3 rounded-lg transition-all ${pathname.startsWith("/admin")
                          ? "bg-cyan/20 text-cyan border border-cyan/50"
                          : "text-white hover:bg-cyan/10"
                          }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                  <button
                    onClick={() => signOut()}
                    className="w-full btn-secondary"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full btn-primary flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
