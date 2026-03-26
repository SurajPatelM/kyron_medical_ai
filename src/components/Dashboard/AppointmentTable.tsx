"use client";

import type { Appointment } from "@/types";
import GlassCard from "@/components/UI/GlassCard";

interface Props {
  appointments: Appointment[];
}

export default function AppointmentTable({ appointments }: Props) {
  if (!appointments.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
        No appointments booked yet. Try the chat assistant on the home page.
      </p>
    );
  }

  return (
    <GlassCard className="overflow-x-auto border-white/[0.12]">
      <table className="w-full min-w-[900px] text-left text-sm text-slate-200">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-teal-300/90">
            <th className="px-4 py-3 font-semibold">Patient Name</th>
            <th className="px-4 py-3 font-semibold">Doctor</th>
            <th className="px-4 py-3 font-semibold">Specialty</th>
            <th className="px-4 py-3 font-semibold">Date / Time</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr
              key={a.id}
              className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
            >
              <td className="px-4 py-3">
                {a.patient.firstName} {a.patient.lastName}
              </td>
              <td className="px-4 py-3">
                {a.doctor.name}
              </td>
              <td className="px-4 py-3 text-slate-300">{a.doctor.specialty}</td>
              <td className="px-4 py-3 text-slate-300">
                {a.slot.date}
                <span className="block text-slate-400">{a.slot.time}</span>
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-slate-400">
                {a.reason}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.status === "confirmed"
                      ? "bg-teal-500/15 text-teal-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
