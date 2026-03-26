import Twilio from "twilio";
import type { Appointment } from "@/types";

type TwilioReady = { client: ReturnType<typeof Twilio>; from: string };

/** Reads Twilio credentials from env; trims whitespace. Sends from TWILIO_PHONE_NUMBER. */
export function getTwilioConfig(): TwilioReady | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !fromNumber) return null;
  return { client: Twilio(sid, token), from: fromNumber };
}

/** E.164 for US numbers when possible; preserves leading + if present. */
export function normalizeSmsToNumber(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const rest = trimmed.slice(1).replace(/\D/g, "");
    return rest ? `+${rest}` : trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return digits ? `+${digits}` : trimmed;
}

/**
 * Sends a confirmation SMS via Twilio (from TWILIO_PHONE_NUMBER).
 * Use after the patient opts in to SMS; `appointmentSummary` should be plain text (doctor, date, time).
 */
export async function sendSmsReminder(
  phone: string,
  appointmentSummary: string
): Promise<boolean> {
  const t = getTwilioConfig();
  if (!t) {
    console.warn(
      "Twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER); skipping SMS"
    );
    return false;
  }

  const to = normalizeSmsToNumber(phone);
  const summary = appointmentSummary.trim();
  if (!summary) {
    console.warn("sendSmsReminder: empty appointmentSummary");
    return false;
  }

  const body =
    `${summary} Reply STOP to opt out. - Kyron Medical`.slice(0, 1600);

  try {
    await t.client.messages.create({
      body,
      from: t.from,
      to,
    });
    return true;
  } catch (e) {
    console.error("sendSmsReminder:", e);
    return false;
  }
}

export async function sendAppointmentSms(apt: Appointment): Promise<boolean> {
  const summary = `Your appointment with ${apt.doctor.name} is confirmed for ${apt.slot.date} at ${apt.slot.time}.`;
  return sendSmsReminder(apt.patient.phone, summary);
}
