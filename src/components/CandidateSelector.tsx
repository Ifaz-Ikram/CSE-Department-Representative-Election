"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { normalizePhotoUrl, getInitials } from "@/lib/themeHelpers";

interface VoterOption {
  value: string; // email
  label: string; // Display: "230253H - Ifaz Ikram - ifazi.23@cse.mrt.ac.lk"
  data: {
    regNo: string;
    firstName: string;
    lastName: string;
    email: string;
    indexNumber: string;
  };
}

interface CandidateSelectorProps {
  electionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CandidateSelector({
  electionId,
  onSuccess,
  onCancel,
}: CandidateSelectorProps) {
  const [registry, setRegistry] = useState<VoterOption[]>([]);
  const [filteredRegistry, setFilteredRegistry] = useState<VoterOption[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<VoterOption | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch voter registry
        const registryRes = await fetch("/api/registry");
        if (!registryRes.ok) throw new Error("Failed to load voter registry");
        const registryData = await registryRes.json();

        // Fetch existing candidates for this election
        const candidatesRes = await fetch(`/api/candidates?electionId=${electionId}`);
        if (!candidatesRes.ok) throw new Error("Failed to load candidates");
        const candidatesData = await candidatesRes.json();

        // Get emails of existing candidates
        const existingEmails = new Set(
          candidatesData.candidates.map((c: any) => c.email).filter(Boolean)
        );

        // Transform into react-select options
        const allOptions: VoterOption[] = registryData.map((voter: any) => ({
          value: voter.email,
          label: `${voter.regNo} - ${voter.firstName} ${voter.lastName} - ${voter.email}`,
          data: voter,
        }));

        // Filter out already-added candidates
        const availableOptions = allOptions.filter(
          (option) => !existingEmails.has(option.value)
        );

        setRegistry(allOptions);
        setFilteredRegistry(availableOptions);
      } catch (err) {
        setError("Failed to load student list");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [electionId]);

  const handleSubmit = async () => {
    if (!selectedVoter) {
      setError("Please select a student");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId,
          name: `${selectedVoter.data.firstName} ${selectedVoter.data.lastName}`,
          email: selectedVoter.data.email,
          indexNumber: selectedVoter.data.regNo,
          bio: bio.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          languages: languages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add candidate");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add candidate");
    } finally {
      setSubmitting(false);
    }
  };

  // Custom styles for react-select to match the premium CSE 23 theme
  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "rgba(10, 15, 31, 0.9)",
      borderColor: state.isFocused ? "#00E5FF" : "rgba(0, 229, 255, 0.3)",
      borderWidth: "2px",
      borderRadius: "0.75rem",
      color: "#fff",
      minHeight: "50px",
      boxShadow: state.isFocused ? "0 0 15px rgba(0, 229, 255, 0.3)" : "none",
      "&:hover": {
        borderColor: "#00E5FF",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "rgba(15, 31, 56, 0.98)",
      border: "2px solid rgba(0, 229, 255, 0.5)",
      borderRadius: "0.75rem",
      overflow: "hidden",
      boxShadow: "0 0 30px rgba(0, 229, 255, 0.2)",
      zIndex: 9999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      padding: "0.5rem",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "rgba(0, 229, 255, 0.15)" : "transparent",
      color: state.isFocused ? "#00E5FF" : "#fff",
      cursor: "pointer",
      borderRadius: "0.5rem",
      padding: "0.75rem 1rem",
      marginBottom: "0.25rem",
      "&:hover": {
        backgroundColor: "rgba(0, 229, 255, 0.15)",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#00E5FF",
      fontWeight: "600",
    }),
    input: (base: any) => ({
      ...base,
      color: "#fff",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "rgba(255, 255, 255, 0.5)",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "#00E5FF",
      "&:hover": {
        color: "#32E6FF",
      },
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: "#00E5FF",
      "&:hover": {
        color: "#ef4444",
      },
    }),
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999]">
        <div className="glass-card p-8 text-center animate-fade-in">
          <div className="loading-spinner mx-auto mb-4" />
          <div className="text-cyan text-lg">Loading student list...</div>
        </div>
      </div>
    );
  }

  const photoPreviewUrl = normalizePhotoUrl(photoUrl);
  const candidateName = selectedVoter
    ? `${selectedVoter.data.firstName} ${selectedVoter.data.lastName}`
    : "";

  return (
    <div className="fixed inset-0 bg-navy-dark/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in">
      <div className="card-premium max-w-2xl w-full my-8 max-h-[95vh] overflow-y-auto border-2 border-cyan/50 glow-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Add Candidate
              </h2>
              <p className="text-gray-400 text-sm">Select from CSE 23 Batch</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-lg bg-navy-dark/50 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="glass-card bg-red-500/10 border-red-500 p-4 mb-6 animate-fade-in">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Searchable Student Selector */}
        <div className="mb-6">
          <label className="block text-cyan mb-3 font-semibold text-sm uppercase tracking-wide">
            Select Student from Whitelist
          </label>
          <Select
            options={filteredRegistry}
            value={selectedVoter}
            onChange={setSelectedVoter}
            placeholder="Search by name, reg number, or email..."
            isSearchable
            isClearable
            styles={customStyles}
            className="text-sm"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            noOptionsMessage={() => "All students have been added as candidates"}
          />
          <p className="text-gray-500 text-xs mt-2 flex items-center space-x-1">
            <svg className="w-4 h-4 text-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Only verified CSE 23 students can be candidates</span>
          </p>
        </div>

        {/* Auto-filled Information */}
        {selectedVoter && (
          <div className="glass-card bg-cyan/5 p-5 mb-6 animate-slide-up">
            <h3 className="text-cyan font-semibold mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Selected Candidate</span>
            </h3>

            <div className="flex items-start space-x-4">
              {/* Photo Preview or Initials */}
              <div className="flex-shrink-0">
                {photoPreviewUrl ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-cyan shadow-lg shadow-cyan/20">
                    <img
                      src={photoPreviewUrl}
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
                      {getInitials(candidateName)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Name</span>
                  <p className="text-white font-semibold">
                    {candidateName}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Reg No</span>
                  <p className="text-gold font-semibold">{selectedVoter.data.regNo}</p>
                </div>

                <div className="md:col-span-2">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Email</span>
                  <p className="text-cyan font-medium break-all">{selectedVoter.data.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editable Fields */}
        {selectedVoter && (
          <div className="space-y-5 animate-slide-up">
            <div>
              <label className="block text-cyan mb-2 font-semibold text-sm uppercase tracking-wide">
                Candidate Manifesto / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter candidate's manifesto, vision, and qualifications..."
                className="input-field w-full min-h-[120px] resize-y"
              />
            </div>

            <div>
              <label className="block text-cyan mb-2 font-semibold text-sm uppercase tracking-wide">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
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
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${languages.includes(lang)
                      ? lang === "English" ? "bg-cyan/20 border-cyan text-cyan"
                        : lang === "Sinhala" ? "bg-gold/20 border-gold text-gold"
                          : "bg-purple-500/20 border-purple-500 text-purple-400"
                      : "bg-navy-dark/50 border-cyan/30 text-gray-400 hover:border-cyan/50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLanguages([...languages, lang]);
                        } else {
                          setLanguages(languages.filter((l) => l !== lang));
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="font-medium">{lang}</span>
                    {languages.includes(lang) && (
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
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-cyan/20">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="btn-secondary order-2 sm:order-1"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedVoter || submitting}
            className={`btn-primary order-1 sm:order-2 ${selectedVoter ? 'animate-pulse-glow' : ''} disabled:animate-none`}
          >
            {submitting ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Candidate</span>
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs flex items-center justify-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Security: Only whitelisted CSE 23 students can be added</span>
          </p>
        </div>
      </div>
    </div>
  );
}
