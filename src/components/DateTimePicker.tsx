"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
    label: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    required?: boolean;
    minDate?: Date;
}

export default function DateTimePicker({
    label,
    value,
    onChange,
    required = false,
    minDate,
}: DateTimePickerProps) {
    const handleSetNow = () => {
        onChange(new Date());
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-cyan text-sm font-bold uppercase tracking-wide">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={handleSetNow}
                    className="text-xs text-cyan hover:text-cyan-light transition-colors flex items-center space-x-1 px-2 py-1 rounded border border-cyan/30 hover:border-cyan/60"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Set to Now</span>
                </button>
            </div>
            <DatePicker
                selected={value}
                onChange={onChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={minDate}
                required={required}
                className="input-field w-full"
                calendarClassName="custom-datepicker"
                wrapperClassName="w-full"
                placeholderText="Select date and time..."
            />
        </div>
    );
}
