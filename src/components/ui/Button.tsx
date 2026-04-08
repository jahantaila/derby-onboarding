"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", children, ...rest }, ref) => {
    const base =
      "font-body font-semibold px-8 py-3 rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
    const styles =
      variant === "primary"
        ? "bg-derby-gradient text-white hover:opacity-90"
        : "bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20";

    return (
      <button ref={ref} className={`${base} ${styles} ${className}`} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
