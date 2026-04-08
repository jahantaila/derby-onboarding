"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlacesAutocomplete } from "@/lib/hooks/usePlacesAutocomplete";

interface Props {
  areas: string[];
  onAdd: (city: string) => void;
  onRemove: (city: string) => void;
}

export default function ServiceAreaPicker({ areas, onAdd, onRemove }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { predictions, isLoaded } = usePlacesAutocomplete(input, {
    types: ["(cities)"],
  });

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

  useEffect(() => {
    if (predictions.length > 0) {
      setOpen(true);
      setActiveIndex(-1);
    }
  }, [predictions]);

  const selectCity = useCallback(
    (description: string) => {
      // Extract just the city name (first part before comma)
      const city = description.split(",")[0].trim();
      if (city && !areas.includes(city)) {
        onAdd(city);
      }
      setInput("");
      setOpen(false);
    },
    [areas, onAdd]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && predictions[activeIndex]) {
        selectCity(predictions[activeIndex].description);
      } else if (input.trim()) {
        // Allow manual entry as fallback
        const trimmed = input.trim();
        if (!areas.includes(trimmed)) {
          onAdd(trimmed);
        }
        setInput("");
        setOpen(false);
      }
      return;
    }

    if (!open || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!isLoaded) {
    // Fallback: plain input with Add button (original behavior)
    return (
      <div className="mb-4">
        <label className="block text-sm text-white/70 font-body mb-1">
          Service Areas
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors"
            placeholder="e.g. North Austin"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = input.trim();
                if (trimmed && !areas.includes(trimmed)) {
                  onAdd(trimmed);
                }
                setInput("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = input.trim();
              if (trimmed && !areas.includes(trimmed)) {
                onAdd(trimmed);
              }
              setInput("");
            }}
            className="bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors font-body"
          >
            Add
          </button>
        </div>
        <TagPills areas={areas} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label className="block text-sm text-white/70 font-body mb-1">
        Service Areas
      </label>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors"
        placeholder="Type a city name..."
        autoComplete="off"
        role="combobox"
        aria-expanded={open && predictions.length > 0}
        aria-controls="service-area-listbox"
        aria-activedescendant={
          activeIndex >= 0 ? `service-area-option-${activeIndex}` : undefined
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => {
          if (predictions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && predictions.length > 0 && (
        <ul
          id="service-area-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-derby-dark border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              id={`service-area-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-4 py-3 text-sm font-body cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-derby-blue-light/20 text-white"
                  : "text-white/70 hover:bg-white/5"
              }`}
              onMouseDown={() => selectCity(p.description)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
      <TagPills areas={areas} onRemove={onRemove} />
    </div>
  );
}

function TagPills({
  areas,
  onRemove,
}: {
  areas: string[];
  onRemove: (area: string) => void;
}) {
  if (areas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {areas.map((area) => (
        <span
          key={area}
          className="bg-derby-blue/20 text-derby-blue-light text-sm font-body px-3 py-1 rounded-full flex items-center gap-1"
        >
          {area}
          <button
            type="button"
            onClick={() => onRemove(area)}
            className="hover:text-white ml-1"
          >
            &times;
          </button>
        </span>
      ))}
    </div>
  );
}
