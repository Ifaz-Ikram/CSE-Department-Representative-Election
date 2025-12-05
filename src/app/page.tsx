"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Image from "next/image";
import GlowDivider from "@/components/GlowDivider";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (session) {
      router.push("/vote");
    }
  }, [session, router]);

  useEffect(() => {
    // Check if user was redirected due to sign-in failure
    const error = searchParams.get("error");

    if (error === "NotCSE23") {
      setErrorMessage("Access denied. Only CSE23 batch accounts are allowed (.23@cse.mrt.ac.lk)");
      setShowError(true);

      // Clean the URL after showing error
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());

      // Auto-hide after 7 seconds
      setTimeout(() => setShowError(false), 7000);
    } else if (error === "NotWhitelisted") {
      setErrorMessage("Access denied. Your email is not in the authorized voter list.");
      setShowError(true);

      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());

      // Auto-hide after 7 seconds
      setTimeout(() => setShowError(false), 7000);
    } else if (error === "InvalidDomain") {
      setErrorMessage("Sign-in failed. Please use your CSE Gmail account.");
      setShowError(true);

      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());

      // Auto-hide after 7 seconds
      setTimeout(() => setShowError(false), 7000);
    } else if (error === "AccessDenied") {
      setErrorMessage("Access denied. Only authorized CSE23 accounts are allowed.");
      setShowError(true);

      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());

      // Auto-hide after 7 seconds
      setTimeout(() => setShowError(false), 7000);
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      {/* Error Notification */}
      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in max-w-md w-full mx-4">
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl px-6 py-4 shadow-2xl backdrop-blur-md glow-border-red">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-300 font-semibold">{errorMessage}</p>
                <p className="text-red-400 text-sm mt-1">Only @cse.mrt.ac.lk accounts are allowed</p>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-16 animate-fade-in">
            {/* Logo Banner */}
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
                <Image
                  src="/cse23logo.jpg"
                  alt="CSE23 Logo"
                  fill
                  className="object-contain rounded-2xl glow-border-gold"
                  priority
                />
              </div>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <div className="text-6xl md:text-8xl font-bold mb-4">
                <span className="text-white">CSE </span>
                <span className="text-gold glow-text-gold">23</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Department Representative
              </h1>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient glow-text">
                Elections
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mt-6 font-light">
                Batch 23 – Semesters 4, 5 & 6
              </p>
              <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                A secure, transparent voting platform for selecting our batch representatives
              </p>
            </div>
          </div>

          <GlowDivider className="my-12" />

          {/* CTA Section */}
          <div className="max-w-md mx-auto mb-16 animate-slide-up">
            <div className="card-premium text-center space-y-6">
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-white">Cast Your Vote</h3>
                <p className="text-gray-400">
                  Sign in with your CSE Gmail account to participate in the election
                </p>
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="btn-primary w-full text-lg py-4 flex items-center justify-center space-x-3 animate-pulse-glow"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign In with Google</span>
              </button>
              <p className="text-xs text-gray-500">
                🔒 Only CSE23 students with official @cse.mrt.ac.lk emails can vote
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-white text-center mb-10">
              Why Choose Our <span className="text-gradient">Platform</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card text-center p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
                <h4 className="text-xl font-bold text-white mb-3">Secure</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Google OAuth authentication ensures only authorized students can vote. Your data is protected.
                </p>
              </div>
              <div className="glass-card text-center p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">✏️</div>
                <h4 className="text-xl font-bold text-white mb-3">Editable</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Change your vote anytime before the election deadline. Flexibility at your fingertips.
                </p>
              </div>
              <div className="glass-card text-center p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">⚖️</div>
                <h4 className="text-xl font-bold text-white mb-3">Democratic</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Every vote counts equally. Fair representation through a transparent democratic process.
                </p>
              </div>
            </div>
          </div>

          <GlowDivider variant="gold" className="my-12" />

          {/* How It Works Section */}
          <div className="card-premium text-left max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gradient mb-6 text-center">How It Works</h3>
            <ol className="space-y-5">
              <li className="flex items-start group">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center text-navy font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                  1
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-white font-semibold mb-1">Sign in with your CSE Gmail account</p>
                  <p className="text-gray-400 text-sm">Use your official @cse.mrt.ac.lk email to access the voting platform</p>
                </div>
              </li>
              <li className="flex items-start group">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center text-navy font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                  2
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-white font-semibold mb-1">Select up to 10 candidates</p>
                  <p className="text-gray-400 text-sm">Review candidate profiles and choose your preferred representatives</p>
                </div>
              </li>
              <li className="flex items-start group">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center text-navy font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                  3
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-white font-semibold mb-1">Submit your ballot</p>
                  <p className="text-gray-400 text-sm">Confirm your choices and submit (you can modify before the deadline)</p>
                </div>
              </li>
              {/* <li className="flex items-start group">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-cyan-light flex items-center justify-center text-navy font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                  4
                </span>
                <div className="flex-1 pt-1">
                  <p className="text-white font-semibold mb-1">View results after election ends</p>
                  <p className="text-gray-400 text-sm">Check real-time results once the voting period concludes</p>
                </div>
              </li> */}
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t border-cyan/20 mt-20 py-10 bg-navy-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            {/* Logo & Title */}
            <div className="flex justify-center items-center space-x-2">
              <div className="text-2xl font-bold">
                <span className="text-white">CSE</span>
                <span className="text-gold glow-text-gold">23</span>
              </div>
              <span className="text-cyan">|</span>
              <p className="text-gray-400">Department Representative Elections</p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center items-center flex-wrap gap-6">
              {/* Website */}
              <a
                href="https://cse23.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan/20 border border-cyan/30 group-hover:border-cyan group-hover:bg-cyan/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-cyan group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="text-cyan text-xs font-medium">Website</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/18t8WuaRZs/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 group-hover:border-blue-500 group-hover:bg-blue-600/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-blue-400 text-xs font-medium">Facebook</span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/cse.23uom?igsh=c2JjcXBxYjB6Ynlw"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-600/20 border border-pink-500/30 group-hover:border-pink-500 group-hover:bg-pink-600/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-pink-400 text-xs font-medium">Instagram</span>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/cse-23/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-700/20 border border-blue-600/30 group-hover:border-blue-600 group-hover:bg-blue-700/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <span className="text-blue-500 text-xs font-medium">LinkedIn</span>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@cse23-mora"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/30 group-hover:border-red-500 group-hover:bg-red-600/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <span className="text-red-500 text-xs font-medium">YouTube</span>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/cse23-mora"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-700/20 border border-gray-600/30 group-hover:border-gray-500 group-hover:bg-gray-700/30 flex items-center justify-center transition-all duration-300">
                  <svg className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <span className="text-gray-300 text-xs font-medium">GitHub</span>
              </a>
            </div>

            {/* University */}
            <p className="text-xs text-gray-600">
              University of Moratuwa • Department of Computer Science and Engineering
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="loading-spinner" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
