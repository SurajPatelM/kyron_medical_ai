import Link from "next/link";
import { Activity } from "lucide-react";

export default function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
      <Link href="/" className="flex items-center gap-2.5 text-slate-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 to-sky-500/10">
          <Activity className="h-5 w-5 text-teal-300" aria-hidden />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-[family-name:var(--font-outfit)] text-base font-semibold tracking-tight">
            Kyron Medical
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-teal-300/90">
            Patient Assistant
          </span>
        </div>
      </Link>
      <Link
        href="/dashboard"
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
      >
        Dashboard
      </Link>
    </header>
  );
}
