import { getDoctorById, getSlotById } from "@/data/doctors";
import {
  addAppointment,
  indexSessionPhone,
  setSessionLastBookedAppointment,
  type Session,
} from "@/data/store";
import { matchDoctor } from "@/lib/matching";
import { sendAppointmentEmail } from "@/lib/email";
import { sendAppointmentSms } from "@/lib/sms";
import type { Appointment, Doctor, Patient } from "@/types";
import { v4 as uuidv4 } from "uuid";

function weekdayName(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function parseHour(time: string): number {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 12;
  let h = parseInt(m[1], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h;
}

function isMorning(time: string): boolean {
  return parseHour(time) < 12;
}

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  sessionId: string,
  opts?: { sendNotifications?: boolean }
): Promise<{ result: unknown; appointmentBooked?: Appointment; slotIds?: string[] }> {
  const sendNotifications = opts?.sendNotifications ?? true;

  switch (name) {
    case "match_doctor": {
      const concern = String(input.concern ?? "");
      const doctor = matchDoctor(concern);
      if (!doctor) return { result: { matched: false, message: "No specialist found" } };
      return {
        result: {
          matched: true,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            bio: doctor.bio,
          },
        },
      };
    }

    case "get_available_slots": {
      const doctorId = String(input.doctorId ?? "");
      const preferredDay = input.preferredDay
        ? String(input.preferredDay).toLowerCase()
        : undefined;
      const preferredTimeOfDay = (input.preferredTimeOfDay as string) || "any";
      const maxResults = Math.min(
        Math.max(Number(input.maxResults) || 5, 1),
        12
      );

      const doctor = getDoctorById(doctorId);
      if (!doctor) {
        return { result: { error: "Doctor not found", slots: [] } };
      }

      let slots = doctor.availableSlots.filter((s) => !s.isBooked);

      if (preferredDay) {
        slots = slots.filter(
          (s) => weekdayName(s.date).toLowerCase() === preferredDay
        );
      }

      if (preferredTimeOfDay === "morning") {
        slots = slots.filter((s) => isMorning(s.time));
      } else if (preferredTimeOfDay === "afternoon") {
        slots = slots.filter((s) => !isMorning(s.time));
      }

      slots.sort((a, b) => {
        const da = a.date.localeCompare(b.date);
        if (da !== 0) return da;
        return a.time.localeCompare(b.time);
      });

      const picked = slots.slice(0, maxResults);
      const slotIds = picked.map((s) => s.id);

      return {
        result: {
          doctorName: doctor.name,
          specialty: doctor.specialty,
          slots: picked.map((s) => ({
            slotId: s.id,
            date: s.date,
            dayOfWeek: weekdayName(s.date),
            time: s.time,
            label: `${weekdayName(s.date)}, ${formatDisplayDate(s.date)} at ${s.time}`,
          })),
        },
        slotIds,
      };
    }

    case "book_appointment": {
      const firstName = String(input.firstName ?? "");
      const lastName = String(input.lastName ?? "");
      const dateOfBirth = String(input.dateOfBirth ?? "");
      const phone = String(input.phone ?? "");
      const email = String(input.email ?? "");
      const doctorId = String(input.doctorId ?? "");
      const slotId = String(input.slotId ?? "");
      const reason = String(input.reason ?? "");
      const smsOptIn = Boolean(input.smsOptIn);

      const found = getSlotById(slotId);
      if (!found) {
        return { result: { success: false, error: "Slot not found." } };
      }
      if (found.slot.doctorId !== doctorId) {
        return { result: { success: false, error: "Slot does not match doctor." } };
      }
      if (found.slot.isBooked) {
        return {
          result: {
            success: true,
            alreadyBooked: true,
            message: "This appointment was already confirmed.",
          },
        };
      }

      found.slot.isBooked = true;

      const patient: Patient = {
        firstName,
        lastName,
        dateOfBirth,
        phone,
        email,
        smsOptIn,
      };

      const doctorSnap = doctorSnapshot(found.doctor);
      const slotSnap = { ...found.slot };

      const appointment: Appointment = {
        id: uuidv4(),
        patient,
        doctor: doctorSnap,
        slot: slotSnap,
        reason,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      addAppointment(appointment);
      setSessionLastBookedAppointment(sessionId, appointment.id);
      indexSessionPhone(sessionId, phone);

      // Webhook handlers need to respond quickly; avoid awaiting notifications when running there.
      if (sendNotifications) {
        await sendAppointmentEmail(appointment);
        if (smsOptIn) {
          await sendAppointmentSms(appointment);
        }
      } else {
        void sendAppointmentEmail(appointment).catch(() => undefined);
        if (smsOptIn) {
          void sendAppointmentSms(appointment).catch(() => undefined);
        }
      }

      return {
        result: {
          success: true,
          appointmentId: appointment.id,
          confirmation: `Booked with ${found.doctor.name} on ${weekdayName(found.slot.date)}, ${formatDisplayDate(found.slot.date)} at ${found.slot.time}.`,
        },
        appointmentBooked: appointment,
      };
    }

    case "get_office_info": {
      return {
        result: {
          hours: "Monday–Friday, 8:00 AM – 5:00 PM",
          address: "245 Wellness Drive, Suite 300, Boston, MA 02115",
          phone: "+1 (857) 269-2211",
          name: "Kyron Medical",
        },
      };
    }

    case "check_prescription_status": {
      const patientName = String(input.patientName ?? "");
      const prescriptionName = String(input.prescriptionName ?? "");
      return {
        result: {
          patientName,
          prescription: prescriptionName,
          status: "In process — expected ready for pickup in 1–2 business days at our pharmacy partner.",
          note: "This is a simulated status for demo purposes.",
        },
      };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function doctorSnapshot(d: Doctor): Doctor {
  return {
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    bodyParts: [...d.bodyParts],
    bio: d.bio,
    availableSlots: [],
  };
}

/** Attach last topic from user messages for voice callback greeting */
export function updateSessionTopicFromConcern(session: Session, toolInput: unknown): void {
  if (typeof toolInput === "object" && toolInput && "concern" in toolInput) {
    const c = (toolInput as { concern?: string }).concern;
    if (typeof c === "string" && c.trim()) session.lastTopic = c.trim();
  }
}
