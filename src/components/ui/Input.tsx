"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  valid?: boolean;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, valid, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
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
            ref={ref}
            id={inputId}
            className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors ${error ? "border-red-500" : ""} ${valid ? "pr-10" : ""} ${className}`}
            {...rest}
          />
          {valid && !error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-[fadeIn_0.3s_ease-out]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 9.5L7.5 13L14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
