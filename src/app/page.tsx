"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navigation from "@/components/Navigation";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />
      
      {/* Error Notification */}
      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-500/20 border border-red-500 rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-400 font-semibold">{errorMessage}</p>
                <p className="text-red-300 text-sm">Only @cse.mrt.ac.lk accounts are allowed</p>
              </div>
              <button 
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-300 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="text-6xl md:text-8xl font-bold mb-4">
              <span className="text-white">CSE</span>
              <span className="text-yellow-accent glow-text">23</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Department Representative
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-cyan glow-text">
              Elections
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A secure, transparent voting platform for selecting our batch representatives
            </p>
          </div>

          {/* CTA Section */}
          <div className="card max-w-md mx-auto space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">Cast Your Vote</h3>
              <p className="text-gray-400">
                Sign in with your CSE Gmail account to participate in the election
              </p>
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="btn-primary w-full text-lg py-4 flex items-center justify-center space-x-3"
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
              Only CSE23 students with official @cse.mrt.ac.lk emails can vote
            </p>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="card">
              <div className="text-cyan text-4xl mb-3">🔒</div>
              <h4 className="text-xl font-bold text-white mb-2">Secure</h4>
              <p className="text-gray-400 text-sm">
                Google OAuth authentication ensures only authorized students can vote
              </p>
            </div>
            <div className="card">
              <div className="text-cyan text-4xl mb-3">✏️</div>
              <h4 className="text-xl font-bold text-white mb-2">Editable</h4>
              <p className="text-gray-400 text-sm">
                Change your vote anytime before the election deadline
              </p>
            </div>
            <div className="card">
              <div className="text-cyan text-4xl mb-3">📊</div>
              <h4 className="text-xl font-bold text-white mb-2">Transparent</h4>
              <p className="text-gray-400 text-sm">
                Results are published after the election ends
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="card text-left max-w-2xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-cyan mb-4">How It Works</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-cyan font-bold mr-3">1.</span>
                <span>Sign in with your CSE Gmail account</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan font-bold mr-3">2.</span>
                <span>Select up to 10 candidates for the election</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan font-bold mr-3">3.</span>
                <span>Submit your ballot (you can change it before the deadline)</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan font-bold mr-3">4.</span>
                <span>View results after the election ends</span>
              </li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t border-cyan/20 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>CSE23 Department Representative Elections</p>
          <p className="mt-2">Secure • Transparent • Democratic</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan text-xl">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
