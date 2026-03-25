import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d18] disabled:opacity-50";
  const variants = {
    primary:
      "bg-gradient-to-r from-teal-500/90 to-sky-500/90 px-5 py-2.5 text-white shadow-lg shadow-teal-500/20 active:scale-[0.97]",
    ghost:
      "border border-white/15 bg-white/5 px-4 py-2 text-slate-200 hover:bg-white/10 active:scale-[0.98]",
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
