"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { getInitials } from "@/lib/themeHelpers";

export default function Navigation() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (status === "loading") {
    return null;
  }

  return (
    <nav className="border-b border-cyan/20 bg-navy-dark/90 backdrop-blur-md sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/cse23logo.jpg"
                alt="CSE23 Logo"
                fill
                className="object-contain rounded-lg glow-border-gold"
                priority
              />
            </div>
            <div>
              <div className="text-2xl font-bold">
                <span className="text-white">CSE</span>
                <span className="text-gold glow-text-gold">23</span>
              </div>
              <div className="hidden md:block text-cyan text-xs tracking-wide uppercase">
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
                  href="/results"
                  className={`relative group px-3 py-2 transition-all duration-300 ${pathname === "/results" ? "text-cyan" : "text-white hover:text-cyan"
                    }`}
                >
                  <span className="relative z-10">Results</span>
                  {pathname === "/results" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent glow-border" />
                  )}
                </Link>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center font-bold text-navy border-2 border-cyan/50 shadow-lg">
                      {getInitials(session.user.name || "")}
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
              <button onClick={() => signIn("google", { callbackUrl: "/" })} className="btn-primary">
                Sign In
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center font-bold text-navy border-2 border-cyan/50">
                    {getInitials(session.user.name || "")}
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
                  href="/results"
                  className={`block px-4 py-3 rounded-lg transition-all ${pathname === "/results"
                    ? "bg-cyan/20 text-cyan border border-cyan/50"
                    : "text-white hover:bg-cyan/10"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Results
                </Link>
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
              <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full btn-primary">
                Sign In with Google
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
