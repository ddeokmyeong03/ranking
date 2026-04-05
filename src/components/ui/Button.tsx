import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "dark" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "dark",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    gold: "bg-gold-gradient text-black",
    dark: "bg-card border border-border text-white",
    ghost: "bg-transparent border border-border text-gray-300",
    danger: "bg-danger/20 border border-danger/40 text-red-400",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base w-full",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
