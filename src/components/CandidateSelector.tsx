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
      backgroundColor: "#1a1a2e",
      borderColor: "#00d9ff",
      color: "#fff",
      minHeight: "50px",
      "&:hover": {
        borderColor: "#00d9ff",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#16213e",
      border: "1px solid #00d9ff",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "#0f3460" : "#16213e",
      color: "#fff",
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-darkBlue p-8 rounded-lg border-2 border-cyan">
          <div className="text-cyan text-xl">Loading student list...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-darkBlue p-8 rounded-lg border-2 border-cyan max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan mb-6">
          Add Candidate from CSE23 Batch
        </h2>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Searchable Student Selector */}
        <div className="mb-6">
          <label className="block text-cyan mb-2 font-semibold">
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
          />
          <p className="text-gray-400 text-xs mt-1">
            Only verified CSE23 students can be candidates
          </p>
        </div>

        {/* Auto-filled Information */}
        {selectedVoter && (
          <div className="bg-blue-900 bg-opacity-30 border border-cyan p-4 rounded mb-6">
            <h3 className="text-cyan font-semibold mb-3">Selected Candidate:</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <p className="text-white font-medium">
                  {selectedVoter.data.firstName} {selectedVoter.data.lastName}
                </p>
              </div>
              
              <div>
                <span className="text-gray-400">Reg No:</span>
                <p className="text-white font-medium">{selectedVoter.data.regNo}</p>
              </div>
              
              <div className="col-span-2">
                <span className="text-gray-400">Email:</span>
                <p className="text-white font-medium">{selectedVoter.data.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Editable Fields */}
        {selectedVoter && (
          <>
            <div className="mb-4">
              <label className="block text-cyan mb-2 font-semibold">
                Candidate Manifesto / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter candidate's manifesto, vision, and qualifications..."
                className="w-full bg-darkBlue border border-cyan rounded p-3 text-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-cyan"
              />
            </div>

            <div className="mb-6">
              <label className="block text-cyan mb-2 font-semibold">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-darkBlue border border-cyan rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan"
              />
              <p className="text-gray-400 text-xs mt-1">
                Leave empty if no photo available
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!selectedVoter || submitting}
            className="px-6 py-2 bg-cyan text-darkBlue font-bold rounded hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Candidate"}
          </button>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>🔒 Security: Only whitelisted CSE23 students can be added</p>
        </div>
      </div>
    </div>
  );
}
