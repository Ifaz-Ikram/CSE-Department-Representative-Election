"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import CandidateSelector from "@/components/CandidateSelector";
import GlowDivider from "@/components/GlowDivider";
import Link from "next/link";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

interface Candidate {
  id: string;
  name: string;
  indexNumber: string;
  email: string;
  symbol?: string | null;
  photoUrl?: string | null;
  languages?: string[];
}

export default function ManageCandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const electionId = params.id as string;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCandidateSelector, setShowCandidateSelector] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editSymbol, setEditSymbol] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [showWarningModal, setShowWarningModal] = useState<{ type: 'edit' | 'delete', candidate: Candidate } | null>(null);

  // Preset functionality
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showLoadPresetModal, setShowLoadPresetModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [availablePresets, setAvailablePresets] = useState<Array<{ id: string; name: string; candidateCount: number }>>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetMessage, setPresetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Computed election status
  const isSuperAdmin = (session?.user as any)?.role === "super_admin";
  const electionStatus = election ? (() => {
    const now = new Date();
    const start = new Date(election.startTime);
    const end = new Date(election.endTime);
    return {
      isPending: now < start,
      isActive: now >= start && now <= end,
      isEnded: now > end
    };
  })() : { isPending: false, isActive: false, isEnded: false };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const role = (session?.user as any)?.role;

    // Allow both admin and super_admin to access
    if (role && role !== "super_admin" && role !== "admin") {
      router.push("/vote");
    }
  }, [status, session, router]);


  useEffect(() => {
    const role = (session?.user as any)?.role;
    // Both admin and super_admin can fetch candidates
    if ((role === "super_admin" || role === "admin") && electionId) {
      fetchCandidates();
      fetchElection();

      // Poll election data every 5 seconds to catch extensions
      const interval = setInterval(() => {
        fetchElection();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session, electionId]);

  const fetchElection = async () => {
    try {
      const res = await fetch(`/api/candidates?electionId=${electionId}`);
      const data = await res.json();
      setElection(data.election);
    } catch (error) {
      console.error("Failed to fetch election:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`/api/candidates?electionId=${electionId}`);
      const data = await res.json();
      setCandidates(data.candidates);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      setLoading(false);
    }
  };

  const handleCandidateAdded = () => {
    setShowCandidateSelector(false);
    fetchCandidates();
  };

  // Confirmed delete (after warning)
  const handleDeleteCandidateConfirmed = async (candidateId: string) => {
    try {
      await fetch(`/api/admin/candidates?id=${candidateId}`, {
        method: "DELETE",
      });
      fetchCandidates();
    } catch (error) {
      console.error("Failed to delete candidate:", error);
    }
  };

  // Delete handler - shows warning during active election
  const handleDeleteCandidate = (candidate: Candidate) => {
    if (electionStatus.isActive) {
      setShowWarningModal({ type: 'delete', candidate });
    } else {
      if (confirm("Are you sure you want to delete this candidate?")) {
        handleDeleteCandidateConfirmed(candidate.id);
      }
    }
  };

  // Edit handler - shows warning during active election  
  const handleEditClick = (candidate: Candidate) => {
    if (electionStatus.isActive) {
      setShowWarningModal({ type: 'edit', candidate });
    } else {
      proceedToEdit(candidate);
    }
  };

  const proceedToEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditSymbol(candidate.symbol || "");
    setEditPhotoUrl(candidate.photoUrl || "");
    setEditLanguages(candidate.languages || []);
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingCandidate) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      const response = await fetch(`/api/admin/candidates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCandidate.id,
          symbol: editSymbol.trim() || null,
          photoUrl: editPhotoUrl.trim() || null,
          languages: editLanguages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update candidate");
      }

      setEditingCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      setEditError(err.message || "Failed to update candidate");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Preset functions
  const fetchPresets = async () => {
    try {
      const res = await fetch("/api/admin/presets");
      const data = await res.json();
      setAvailablePresets(data.presets || []);
    } catch (error) {
      console.error("Failed to fetch presets:", error);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      setPresetMessage({ type: 'error', text: 'Please enter a preset name' });
      return;
    }

    setPresetLoading(true);
    setPresetMessage(null);

    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId,
          presetName: presetName.trim(),
          description: presetDescription.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPresetMessage({ type: 'success', text: `Saved ${data.preset.candidateCount} candidates as "${presetName}"` });
        setTimeout(() => {
          setShowSavePresetModal(false);
          setPresetName("");
          setPresetDescription("");
          setPresetMessage(null);
        }, 2000);
      } else {
        setPresetMessage({ type: 'error', text: data.error || 'Failed to save preset' });
      }
    } catch (error) {
      setPresetMessage({ type: 'error', text: 'Failed to save preset' });
    } finally {
      setPresetLoading(false);
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    setPresetLoading(true);
    setPresetMessage(null);

    try {
      const res = await fetch("/api/admin/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId, presetId }),
      });

      const data = await res.json();

      if (res.ok) {
        setPresetMessage({ type: 'success', text: data.message });
        fetchCandidates();
        setTimeout(() => {
          setShowLoadPresetModal(false);
          setPresetMessage(null);
        }, 2000);
      } else {
        setPresetMessage({ type: 'error', text: data.error || 'Failed to load preset' });
      }
    } catch (error) {
      setPresetMessage({ type: 'error', text: 'Failed to load preset' });
    } finally {
      setPresetLoading(false);
    }
  };

  const openLoadPresetModal = () => {
    fetchPresets();
    setShowLoadPresetModal(true);
    setPresetMessage(null);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center circuit-bg">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto" />
          <p className="text-cyan text-lg animate-pulse">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen circuit-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <Link
              href="/admin"
              className="text-cyan hover:text-cyan-light mb-4 inline-flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Admin Dashboard</span>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {(electionStatus.isEnded || !isSuperAdmin) ? 'View' : 'Manage'} <span className="text-gradient glow-text">Candidates</span>
                </h1>
                {election && (
                  <p className="text-gray-400 text-lg">{election.name}</p>
                )}
              </div>
              {/* Action buttons for super_admin */}
              {isSuperAdmin && !electionStatus.isEnded && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCandidateSelector(true)}
                    className="btn-primary animate-pulse-glow"
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Candidate</span>
                    </span>
                  </button>

                  {/* Preset Buttons */}
                  <button
                    onClick={() => { setShowSavePresetModal(true); setPresetMessage(null); }}
                    className="bg-gold/20 hover:bg-gold text-gold hover:text-navy-dark font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-gold/50 hover:border-gold"
                    title="Save current candidates as a preset"
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save Preset</span>
                    </span>
                  </button>

                  <button
                    onClick={openLoadPresetModal}
                    className="bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 border border-purple-500/50 hover:border-purple-500"
                    title="Load candidates from a saved preset"
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Load Preset</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner for view-only mode */}
          {(electionStatus.isEnded || !isSuperAdmin) && (
            <div className="glass-card bg-gray-500/10 border-gray-500/30 p-4 mb-6 animate-fade-in">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-300">
                  {electionStatus.isEnded
                    ? "This election has ended. Candidates cannot be modified to preserve result integrity."
                    : "You are viewing candidates in read-only mode. Only super admins can manage candidates."}
                </p>
              </div>
            </div>
          )}

          <GlowDivider className="mb-8" />

          {/* Stats Bar */}
          <div className="glass-card p-4 mb-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan">{candidates.length}</div>
                  <div className="text-gray-400 text-sm">Total Candidates</div>
                </div>
              </div>
              {election && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Election Status</div>
                  <div className={`badge ${new Date() >= new Date(election.startTime) && new Date() <= new Date(election.endTime)
                    ? 'badge-active'
                    : new Date() > new Date(election.endTime)
                      ? 'badge-ended'
                      : 'badge-pending'
                    }`}>
                    {new Date() >= new Date(election.startTime) && new Date() <= new Date(election.endTime)
                      ? '🟢 Active'
                      : new Date() > new Date(election.endTime)
                        ? '🔒 Ended'
                        : '⏳ Pending'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Selector Modal */}
          {showCandidateSelector && (
            <CandidateSelector
              electionId={electionId}
              onSuccess={handleCandidateAdded}
              onCancel={() => setShowCandidateSelector(false)}
            />
          )}

          {/* Warning Modal for Active Election */}
          {showWarningModal && (
            <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
              <div className="card-premium max-w-md w-full border-2 border-gold/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gold">Active Election Warning</h3>
                    <p className="text-gray-400 text-sm">Proceed with caution</p>
                  </div>
                </div>

                <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
                  <p className="text-gray-200">
                    This election is <span className="text-green-400 font-semibold">currently active</span>.
                    {showWarningModal.type === 'edit'
                      ? ' Editing candidate details may affect ongoing votes and voter trust.'
                      : ' Deleting a candidate will remove all votes cast for them and cannot be undone.'}
                  </p>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                  Are you sure you want to {showWarningModal.type === 'edit' ? 'edit' : 'delete'}{' '}
                  <span className="text-white font-semibold">{showWarningModal.candidate.name}</span>?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWarningModal(null)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const { type, candidate } = showWarningModal;
                      setShowWarningModal(null);
                      if (type === 'edit') {
                        proceedToEdit(candidate);
                      } else {
                        handleDeleteCandidateConfirmed(candidate.id);
                      }
                    }}
                    className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all ${showWarningModal.type === 'delete'
                      ? 'bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50'
                      : 'bg-gold/20 hover:bg-gold text-gold hover:text-navy-dark border border-gold/50'
                      }`}
                  >
                    {showWarningModal.type === 'edit' ? 'Edit Anyway' : 'Delete Anyway'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Preset Modal */}
          {showSavePresetModal && (
            <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
              <div className="card-premium max-w-md w-full border-2 border-gold/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Save as Preset</h3>
                      <p className="text-gray-400 text-sm">Save {candidates.length} candidates</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowSavePresetModal(false); setPresetMessage(null); }}
                    className="w-10 h-10 rounded-lg bg-navy-dark/50 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {presetMessage && (
                  <div className={`p-4 rounded-lg mb-4 ${presetMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                    {presetMessage.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-cyan text-sm font-semibold mb-2 uppercase tracking-wide">Preset Name *</label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="e.g., Mock Election 2025"
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan text-sm font-semibold mb-2 uppercase tracking-wide">Description (Optional)</label>
                    <textarea
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="Brief description of this preset..."
                      className="input-field w-full"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowSavePresetModal(false); setPresetMessage(null); }}
                    className="flex-1 btn-secondary"
                    disabled={presetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreset}
                    disabled={presetLoading || !presetName.trim()}
                    className="flex-1 btn-primary animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {presetLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Preset</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Load Preset Modal */}
          {showLoadPresetModal && (
            <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
              <div className="card-premium max-w-md w-full border-2 border-purple-500/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Load Preset</h3>
                      <p className="text-gray-400 text-sm">Add candidates from a saved preset</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowLoadPresetModal(false); setPresetMessage(null); }}
                    className="w-10 h-10 rounded-lg bg-navy-dark/50 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {presetMessage && (
                  <div className={`p-4 rounded-lg mb-4 ${presetMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                    {presetMessage.text}
                  </div>
                )}

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {availablePresets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <p>No presets saved yet</p>
                      <p className="text-sm mt-1">Save candidates from an election to create a preset</p>
                    </div>
                  ) : (
                    availablePresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset.id)}
                        disabled={presetLoading}
                        className="w-full text-left p-4 rounded-lg bg-navy-dark/50 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition-all group disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold group-hover:text-purple-400 transition-colors">{preset.name}</div>
                            <div className="text-gray-400 text-sm">{preset.candidateCount} candidates</div>
                          </div>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowLoadPresetModal(false); setPresetMessage(null); }}
                    className="flex-1 btn-secondary"
                    disabled={presetLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Candidate Modal */}
          {editingCandidate && (
            <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in">
              <div className="card-premium max-w-2xl w-full my-8 max-h-[95vh] overflow-y-auto border-2 border-cyan/50 glow-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Edit Candidate
                      </h2>
                      <p className="text-gray-400 text-sm">Update candidate details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingCandidate(null)}
                    className="w-10 h-10 rounded-lg bg-navy-dark/50 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {editError && (
                  <div className="glass-card bg-red-500/10 border-red-500 p-4 mb-6 animate-fade-in">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-400">{editError}</span>
                    </div>
                  </div>
                )}

                {/* Candidate Info Display */}
                <div className="glass-card bg-cyan/5 p-5 mb-6">
                  <h3 className="text-cyan font-semibold mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Candidate Information</span>
                  </h3>

                  <div className="flex items-start space-x-4">
                    {/* Photo Preview or Initials */}
                    <div className="flex-shrink-0">
                      {normalizePhotoUrl(editPhotoUrl) ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-cyan shadow-lg shadow-cyan/20">
                          <img
                            src={normalizePhotoUrl(editPhotoUrl)!}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              setTimeout(() => {
                                const img = e.target as HTMLImageElement;
                                if (img.naturalWidth === 0) {
                                  img.style.display = 'none';
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan/20 to-navy-lighter border-2 border-cyan/30 flex items-center justify-center">
                          <span className="text-2xl font-bold text-cyan">
                            {getInitials(editingCandidate.name)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Name</span>
                        <p className="text-white font-semibold">
                          {editingCandidate.name}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Reg No</span>
                        <p className="text-gold font-semibold">{editingCandidate.indexNumber}</p>
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Email</span>
                        <p className="text-cyan font-medium break-all">{editingCandidate.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-cyan mb-2 font-semibold text-sm uppercase tracking-wide">
                      Candidate Symbol (Emoji)
                    </label>
                    <textarea
                      value={editSymbol}
                      onChange={(e) => setEditSymbol(e.target.value)}
                      placeholder="Enter candidate's Symbol (Emoji)"
                      className="input-field w-full min-h-[120px] resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan mb-2 font-semibold text-sm uppercase tracking-wide">
                      Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or direct image URL"
                      className="input-field w-full"
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      💡 Google Drive links will be automatically converted to viewable URLs
                    </p>
                  </div>

                  {/* Languages Checkboxes */}
                  <div>
                    <label className="block text-cyan mb-2 font-semibold text-sm uppercase tracking-wide">
                      Languages
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {["English", "Sinhala", "Tamil"].map((lang) => (
                        <label
                          key={lang}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${editLanguages.includes(lang)
                            ? lang === "English" ? "bg-cyan/20 border-cyan text-cyan"
                              : lang === "Sinhala" ? "bg-gold/20 border-gold text-gold"
                                : "bg-purple-500/20 border-purple-500 text-purple-400"
                            : "bg-navy-dark/50 border-cyan/30 text-gray-400 hover:border-cyan/50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={editLanguages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditLanguages([...editLanguages, lang]);
                              } else {
                                setEditLanguages(editLanguages.filter((l) => l !== lang));
                              }
                            }}
                            className="sr-only"
                          />
                          <span className="font-medium">{lang}</span>
                          {editLanguages.includes(lang) && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Select all languages the candidate can speak
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-cyan/20">
                  {electionStatus.isEnded ? (
                    /* Read-only mode - just close button */
                    <button
                      onClick={() => setEditingCandidate(null)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  ) : (
                    /* Edit mode - Cancel and Save */
                    <>
                      <button
                        onClick={() => setEditingCandidate(null)}
                        disabled={editSubmitting}
                        className="btn-secondary order-2 sm:order-1"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleEditSave}
                        disabled={editSubmitting}
                        className="btn-primary order-1 sm:order-2 animate-pulse-glow"
                      >
                        {editSubmitting ? (
                          <span className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.map((candidate, index) => {
              const photoUrl = normalizePhotoUrl(candidate.photoUrl);

              return (
                <div
                  key={candidate.id}
                  className="glass-card p-5 animate-slide-up hover:border-cyan/50 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Candidate Photo */}
                  <div className="flex justify-center mb-4">
                    {photoUrl ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-cyan/30 group-hover:border-cyan transition-all shadow-lg">
                        <img
                          src={photoUrl}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Delay check to allow for redirects
                            setTimeout(() => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth === 0) {
                                img.style.display = 'none';
                                img.nextElementSibling?.classList.remove('hidden');
                              }
                            }, 100);
                          }}
                        />
                        <div className="hidden w-full h-full bg-gradient-to-br from-cyan/20 to-navy-light flex items-center justify-center">
                          <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-navy-light to-navy-lighter border-2 border-cyan/30 group-hover:border-cyan transition-all flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-cyan">{getInitials(candidate.name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan transition-colors">
                      {candidate.name}
                    </h3>
                    <p className="text-gold text-sm font-semibold mb-1">
                      {candidate.indexNumber}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {candidate.email}
                    </p>
                  </div>

                  {candidate.symbol && (
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-4xl">{candidate.symbol}</span>
                    </div>
                  )}

                  {/* Language Badges */}
                  {candidate.languages && candidate.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
                      {["English", "Sinhala", "Tamil"].filter(lang => candidate.languages?.includes(lang)).map((lang) => (
                        <span
                          key={lang}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${lang === "English" ? "bg-cyan/10 text-cyan border-cyan/30"
                            : lang === "Sinhala" ? "bg-gold/10 text-gold border-gold/30"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons - only show for super_admin or after election ends */}
                  {(isSuperAdmin || electionStatus.isEnded) && (
                    <div className="flex gap-2">
                      {electionStatus.isEnded ? (
                        /* Read-only mode after election ends - for everyone */
                        <button
                          onClick={() => handleEditClick(candidate)}
                          className="flex-1 bg-gray-600/20 text-gray-400 font-bold py-2.5 px-3 rounded-lg border border-gray-500/50 flex items-center justify-center space-x-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details</span>
                        </button>
                      ) : (
                        /* Editable mode: super_admin before/during election */
                        <>
                          <button
                            onClick={() => handleEditClick(candidate)}
                            className="flex-1 bg-cyan/20 hover:bg-cyan text-cyan hover:text-navy-dark font-bold py-2.5 px-3 rounded-lg transition-all duration-300 border border-cyan/50 hover:border-cyan flex items-center justify-center space-x-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate)}
                            className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-300 border border-red-500/50 hover:border-red-500 flex items-center justify-center space-x-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {candidates.length === 0 && (
            <div className="glass-card text-center p-12 animate-fade-in">
              <svg className="w-16 h-16 mx-auto text-cyan/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-400 text-lg">No candidates yet.</p>
              <p className="text-gray-500 text-sm mt-2">Click "Add Candidate" to add candidates from the CSE 23 batch.</p>
            </div>
          )}
        </div>
      </main >
    </div >
  );
}
