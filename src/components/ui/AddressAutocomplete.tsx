"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  usePlacesAutocomplete,
  type ParsedAddress,
} from "@/lib/hooks/usePlacesAutocomplete";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  valid?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label = "Street Address",
  placeholder = "123 Main St",
  required,
  valid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { predictions, getPlaceDetails, isLoaded } =
    usePlacesAutocomplete(value);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Open dropdown when predictions arrive
  useEffect(() => {
    if (predictions.length > 0) {
      setOpen(true);
      setActiveIndex(-1);
    }
  }, [predictions]);

  const selectPrediction = useCallback(
    async (prediction: google.maps.places.AutocompletePrediction) => {
      setOpen(false);
      onChange(prediction.description);
      const parsed = await getPlaceDetails(prediction.place_id);
      if (parsed) {
        onSelect(parsed);
      }
    },
    [onChange, onSelect, getPlaceDetails]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  const validCheck = valid && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-[fadeIn_0.3s_ease-out]">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M4 9.5L7.5 13L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  if (!isLoaded) {
    // Fallback: plain input (matches Input component styling)
    return (
      <div className="mb-4">
        <label
          htmlFor={inputId}
          className="block text-sm text-white/70 font-body mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors ${valid ? "pr-10" : ""}`}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {validCheck}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label
        htmlFor={inputId}
        className="block text-sm text-white/70 font-body mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors ${valid ? "pr-10" : ""}`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && predictions.length > 0}
          aria-controls="address-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `address-option-${activeIndex}` : undefined
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (predictions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {validCheck}
      </div>
      {open && predictions.length > 0 && (
        <ul
          id="address-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-derby-dark border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              id={`address-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-4 py-3 text-sm font-body cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-derby-blue-light/20 text-white"
                  : "text-white/70 hover:bg-white/5"
              }`}
              onMouseDown={() => selectPrediction(p)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
