import Link from "next/link";
import { Activity } from "lucide-react";
import AppointmentTable from "@/components/Dashboard/AppointmentTable";
import GlassCard from "@/components/UI/GlassCard";
import { getAppointments } from "@/data/store";

export default function DashboardPage() {
  const appointments = getAppointments();

  return (
    <div className="mesh-bg relative min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 to-sky-500/10">
              <Activity className="h-6 w-6 text-teal-300" aria-hidden />
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold text-white">
                Appointments
              </h1>
              <p className="text-sm text-slate-400">
                In-memory list for this server process (demo).
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-teal-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            Back to chat
          </Link>
        </header>

        <GlassCard className="border-white/[0.12] p-6">
          <h2 className="mb-4 font-[family-name:var(--font-outfit)] text-lg font-medium text-slate-100">
            Booked visits
          </h2>
          <AppointmentTable appointments={appointments} />
        </GlassCard>
      </div>
    </div>
  );
}
