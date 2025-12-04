"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

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
  const [selectedVoter, setSelectedVoter] = useState<VoterOption | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRegistry() {
      try {
        const res = await fetch("/api/registry");
        if (!res.ok) throw new Error("Failed to load voter registry");
        
        const data = await res.json();
        
        // Transform into react-select options
        const options: VoterOption[] = data.map((voter: any) => ({
          value: voter.email,
          label: `${voter.regNo} - ${voter.firstName} ${voter.lastName} - ${voter.email}`,
          data: voter,
        }));
        
        setRegistry(options);
      } catch (err) {
        setError("Failed to load student list");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadRegistry();
  }, []);

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

  // Custom styles for react-select to match your CSE23 theme
  const customStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "#1a1f2e",
      borderColor: "#00d9ff",
      color: "#fff",
      minHeight: "45px",
      "&:hover": {
        borderColor: "#00d9ff",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#1a1f2e",
      border: "1px solid #00d9ff",
      zIndex: 9999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "#0f3460" : "#1a1f2e",
      color: "#fff",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#0f3460",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#00d9ff",
    }),
    input: (base: any) => ({
      ...base,
      color: "#fff",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#888",
    }),
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
        <div className="bg-darkBlue p-8 rounded-lg border-2 border-cyan shadow-2xl">
          <div className="text-cyan text-xl">Loading student list...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-[#0f1419] p-6 md:p-8 rounded-lg border-2 border-cyan max-w-2xl w-full my-8 shadow-2xl max-h-[95vh] overflow-y-auto">
        <h2 className="text-xl md:text-2xl font-bold text-cyan mb-4 md:mb-6">
          Add Candidate from CSE23 Batch
        </h2>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Searchable Student Selector */}
        <div className="mb-4 md:mb-6">
          <label className="block text-cyan mb-2 font-semibold text-sm md:text-base">
            Select Student from Whitelist (200 eligible students)
          </label>
          <Select
            options={registry}
            value={selectedVoter}
            onChange={setSelectedVoter}
            placeholder="Type to search by name, reg number, or email..."
            isSearchable
            isClearable
            styles={customStyles}
            className="text-sm"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
          />
          <p className="text-gray-400 text-xs mt-1">
            Only verified CSE23 students can be candidates
          </p>
        </div>

        {/* Auto-filled Information */}
        {selectedVoter && (
          <div className="bg-blue-900 bg-opacity-30 border border-cyan p-3 md:p-4 rounded mb-4 md:mb-6">
            <h3 className="text-cyan font-semibold mb-2 md:mb-3 text-sm md:text-base">Selected Candidate:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Name:</span>
                <p className="text-white font-medium">
                  {selectedVoter.data.firstName} {selectedVoter.data.lastName}
                </p>
              </div>
              
              <div>
                <span className="text-gray-400 text-xs">Reg No:</span>
                <p className="text-white font-medium">{selectedVoter.data.regNo}</p>
              </div>
              
              <div className="md:col-span-2">
                <span className="text-gray-400 text-xs">Email:</span>
                <p className="text-white font-medium break-all">{selectedVoter.data.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Editable Fields */}
        {selectedVoter && (
          <>
            <div className="mb-3 md:mb-4">
              <label className="block text-cyan mb-2 font-semibold text-sm md:text-base">
                Candidate Manifesto / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter candidate's manifesto, vision, and qualifications..."
                className="w-full bg-[#1a1f2e] border border-cyan rounded p-3 text-white min-h-[100px] md:min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan text-sm"
              />
            </div>

            <div className="mb-4 md:mb-6">
              <label className="block text-cyan mb-2 font-semibold text-sm md:text-base">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-[#1a1f2e] border border-cyan rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan text-sm"
              />
              <p className="text-gray-400 text-xs mt-1">
                Leave empty if no photo available
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 md:px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm md:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!selectedVoter || submitting}
            className="px-4 md:px-6 py-2 bg-cyan text-darkBlue font-bold rounded hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base order-1 sm:order-2"
          >
            {submitting ? "Adding..." : "Add Candidate"}
          </button>
        </div>

        <div className="mt-3 md:mt-4 text-center text-gray-400 text-xs md:text-sm">
          <p>🔒 Security: Only whitelisted CSE23 students can be added</p>
        </div>
      </div>
    </div>
  );
}
