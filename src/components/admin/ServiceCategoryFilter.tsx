"use client";

import { useState, useRef, useEffect } from "react";
import { SERVICE_CATEGORIES } from "@/lib/constants";

interface ServiceCategoryFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ServiceCategoryFilter({ selected, onChange }: ServiceCategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleCategory(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 flex items-center gap-2 whitespace-nowrap"
      >
        Services
        {selected.length > 0 && (
          <span className="bg-derby-blue text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {selected.length}
          </span>
        )}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56 py-2">
          <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-gray-100">
            <button
              onClick={() => onChange(SERVICE_CATEGORIES.map((c) => c.id))}
              className="text-xs text-derby-blue hover:underline"
            >
              Select All
            </button>
            <button
              onClick={() => onChange([])}
              className="text-xs text-gray-500 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {SERVICE_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="rounded border-gray-300 text-derby-blue focus:ring-derby-blue/50"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
