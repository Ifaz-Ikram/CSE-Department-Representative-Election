"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/vote");
    }
  }, [session, router]);

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
              onClick={() => signIn("google")}
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
