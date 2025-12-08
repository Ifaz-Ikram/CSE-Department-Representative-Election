import { useState, useRef, useEffect } from "react";

interface SearchableDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchableDropdown({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className="flex items-center space-x-2 bg-navy-dark border border-cyan/30 rounded-lg px-3 py-2 cursor-pointer hover:border-cyan/60 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-sm flex-1 truncate ${value ? "text-cyan" : "text-gray-400"}`}>
                    {value || placeholder}
                </span>
                <svg
                    className={`w-4 h-4 text-cyan transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-40 mt-1 w-full min-w-[200px] bg-navy-dark border border-cyan/30 rounded-lg shadow-xl shadow-cyan/10 overflow-hidden animate-fade-in">
                    <div className="p-2 border-b border-cyan/10">
                        <input
                            type="text"
                            className="w-full bg-navy-darker/50 border border-cyan/20 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan/50"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <div
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-cyan/10 transition-colors ${value === "" ? "text-cyan bg-cyan/5" : "text-gray-400"
                                }`}
                            onClick={() => {
                                onChange("");
                                setIsOpen(false);
                            }}
                        >
                            All
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-cyan/10 transition-colors ${value === option ? "text-cyan bg-cyan/5" : "text-gray-300"
                                        }`}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                >
                                    {option}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 italic">No matches found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
