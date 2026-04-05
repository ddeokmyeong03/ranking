import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export default function Input({ label, icon, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-gray-400 flex items-center gap-1">
          {icon && <span>{icon}</span>}
          {label}
        </label>
      )}
      <input
        className={cn(
          "bg-card border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
