"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return null;
  }

  return (
    <nav className="border-b border-cyan/20 bg-navy-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="text-2xl font-bold">
              <span className="text-white">CSE</span>
              <span className="text-yellow-accent glow-text">23</span>
            </div>
            <div className="hidden md:block text-cyan text-sm">
              Department Representative Elections
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            {session ? (
              <>
                <Link
                  href="/vote"
                  className={`hover:text-cyan transition-colors ${
                    pathname === "/vote" ? "text-cyan" : "text-white"
                  }`}
                >
                  Vote
                </Link>
                <Link
                  href="/results"
                  className={`hover:text-cyan transition-colors ${
                    pathname === "/results" ? "text-cyan" : "text-white"
                  }`}
                >
                  Results
                </Link>
                {(session.user.role === "admin" ||
                  session.user.role === "super_admin") && (
                  <Link
                    href="/admin"
                    className={`hover:text-cyan transition-colors ${
                      pathname.startsWith("/admin") ? "text-cyan" : "text-white"
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <div className="text-cyan">{session.user.name}</div>
                    <div className="text-gray-400 text-xs">
                      {session.user.indexNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="btn-secondary text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => signIn("google")} className="btn-primary">
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
