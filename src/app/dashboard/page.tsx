import Link from "next/link";
import { Activity } from "lucide-react";
import AppointmentTable from "@/components/Dashboard/AppointmentTable";
import GlassCard from "@/components/UI/GlassCard";
import { getAppointments } from "@/data/store";

export default function DashboardPage() {
  const appointments = getAppointments();

  return (
    <div className="mesh-bg relative min-h-screen px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <GlassCard className="flex flex-col overflow-hidden border-white/[0.12] bg-white/[0.05] shadow-[0_8px_48px_rgba(0,0,0,0.35)]">
          <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5 text-slate-100">
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
            </div>
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            >
              Back to chat
            </Link>
          </header>

          <div className="space-y-4 p-4 sm:p-6">
            <h2 className="font-[family-name:var(--font-outfit)] text-lg font-medium text-slate-100">
              Booked visits
            </h2>
            <AppointmentTable appointments={appointments} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
