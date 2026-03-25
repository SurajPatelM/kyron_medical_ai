import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
        backdrop-blur-[20px]
        ${hover ? "transition-all duration-300 hover:border-teal-400/25 hover:bg-white/[0.09] hover:shadow-[0_0_32px_rgba(0,212,170,0.08)]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
