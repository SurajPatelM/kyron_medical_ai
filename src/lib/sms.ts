import Twilio from "twilio";
import type { Appointment } from "@/types";

function getTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !fromNumber) return null;
  return { client: Twilio(sid, token), from: fromNumber };
}

export async function sendAppointmentSms(apt: Appointment): Promise<boolean> {
  const t = getTwilio();
  if (!t) {
    console.warn("Twilio env not configured; skipping SMS");
    return false;
  }

  const body = `Your appointment with ${apt.doctor.name} is confirmed for ${apt.slot.date} at ${apt.slot.time}. Reply STOP to opt out. - Kyron Medical`;

  try {
    await t.client.messages.create({
      body,
      from: t.from,
      to: apt.patient.phone.startsWith("+")
        ? apt.patient.phone
        : `+1${apt.patient.phone.replace(/\D/g, "")}`,
    });
    return true;
  } catch (e) {
    console.error("sendAppointmentSms:", e);
    return false;
  }
}
