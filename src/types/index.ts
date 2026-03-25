export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bodyParts: string[];
  bio: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  isBooked: boolean;
}

export interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  smsOptIn: boolean;
}

export interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  slot: TimeSlot;
  reason: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  /** When AI listed slots, user can tap these */
  slotIds?: string[];
  suggestedSlots?: { id: string; label: string }[];
}
