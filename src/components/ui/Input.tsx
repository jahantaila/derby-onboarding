"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="mb-4">
        <label
          htmlFor={inputId}
          className="block text-sm text-white/70 font-body mb-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors ${error ? "border-red-500" : ""} ${className}`}
          {...rest}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
