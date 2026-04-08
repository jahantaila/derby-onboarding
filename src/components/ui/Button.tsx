"use client";

import { forwardRef } from "react";
import { type HTMLMotionProps, motion, useReducedMotion } from "framer-motion";

interface Props extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary";
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", children, disabled, ...rest }, ref) => {
    const prefersReduced = useReducedMotion();
    const base =
      "font-body font-semibold px-8 py-3 rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
    const styles =
      variant === "primary"
        ? "bg-derby-gradient text-white hover:opacity-90"
        : "bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20";

    const shouldAnimate = !disabled && !prefersReduced;

    return (
      <motion.button
        ref={ref}
        className={`${base} ${styles} ${className}`}
        disabled={disabled}
        whileHover={
          shouldAnimate
            ? { scale: 1.02, boxShadow: "0 0 20px rgba(32,147,255,0.3)" }
            : undefined
        }
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
