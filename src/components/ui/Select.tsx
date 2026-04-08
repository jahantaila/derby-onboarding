"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly { label: string; value: string }[];
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, options, error, id, className = "", ...rest }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="mb-4">
        <label
          htmlFor={selectId}
          className="block text-sm text-white/70 font-body mb-1"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors appearance-none ${error ? "border-red-500" : ""} ${className}`}
          {...rest}
        >
          <option value="" className="bg-derby-dark">
            Select…
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-derby-dark">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-400 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
