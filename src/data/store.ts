import { v4 as uuidv4 } from "uuid";
import type { Appointment, ChatMessage } from "@/types";

export interface Session {
  id: string;
  messages: ChatMessage[];
  patientPhone?: string;
  lastTopic?: string;
  createdAt: string;
}

const sessions = new Map<string, Session>();
const phoneIndex = new Map<string, string>();
const appointments: Appointment[] = [];

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function ensureSession(sessionId: string): Session {
  let s = sessions.get(sessionId);
  if (!s) {
    s = {
      id: sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    sessions.set(sessionId, s);
  }
  return s;
}

export function indexSessionPhone(sessionId: string, phone: string): void {
  const s = sessions.get(sessionId);
  if (!s) return;
  s.patientPhone = phone;
  try {
    phoneIndex.set(normalizePhone(phone), sessionId);
  } catch {
    /* ignore */
  }
}

export function lookupSessionByPhone(phone: string): Session | undefined {
  const sid = phoneIndex.get(normalizePhone(phone));
  if (!sid) return undefined;
  return sessions.get(sid);
}

export function appendMessage(sessionId: string, message: ChatMessage): void {
  const s = ensureSession(sessionId);
  s.messages.push(message);
}

export function setSessionMessages(sessionId: string, messages: ChatMessage[]): void {
  const s = ensureSession(sessionId);
  s.messages = messages;
}

export function addAppointment(apt: Appointment): void {
  appointments.push(apt);
}

export function getAppointments(): Appointment[] {
  return [...appointments];
}

export function transcriptForSession(session: Session): string {
  return session.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
}

export function newSessionId(): string {
  return uuidv4();
}
