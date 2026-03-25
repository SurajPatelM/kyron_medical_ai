import type { Doctor, TimeSlot } from "@/types";

const MORNING = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"];
const AFTERNOON = [
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function slotId(doctorId: string, date: string, time: string): string {
  return `${doctorId}-${date}-${time.replace(/\s/g, "")}`;
}

function generateSlotsForDoctor(doctorId: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 45; dayOffset++) {
    const day = addDays(start, dayOffset);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;

    const dateStr = formatIso(day);
    let s = 0;
    for (const time of [...MORNING, ...AFTERNOON]) {
      const seed =
        doctorId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
        dayOffset * 100 +
        s;
      const booked = pseudoRandom(seed) < 0.4;
      slots.push({
        id: slotId(doctorId, dateStr, time),
        doctorId,
        date: dateStr,
        time,
        duration: 30,
        isBooked: booked,
      });
      s++;
    }
  }

  return slots;
}

const baseDoctors: Omit<Doctor, "availableSlots">[] = [
  {
    id: "dr-chen",
    name: "Dr. Sarah Chen",
    specialty: "Orthopedics",
    bodyParts: [
      "bone",
      "bones",
      "joint",
      "joints",
      "knee",
      "hip",
      "shoulder",
      "back",
      "spine",
      "fracture",
      "sports injury",
      "arthritis",
      "acl",
      "meniscus",
      "wrist",
      "ankle",
      "orthopedic",
    ],
    bio: "Board-certified orthopedic surgeon focused on joint preservation and sports medicine.",
  },
  {
    id: "dr-rodriguez",
    name: "Dr. Michael Rodriguez",
    specialty: "Cardiology",
    bodyParts: [
      "heart",
      "chest pain",
      "blood pressure",
      "palpitations",
      "cardiovascular",
      "cardiac",
      "arrhythmia",
      "cholesterol",
      "hypertension",
      "shortness of breath",
      "edema",
    ],
    bio: "Cardiologist specializing in preventive heart care and chronic disease management.",
  },
  {
    id: "dr-patel",
    name: "Dr. Aisha Patel",
    specialty: "Dermatology",
    bodyParts: [
      "skin",
      "rash",
      "acne",
      "moles",
      "eczema",
      "psoriasis",
      "dermatitis",
      "hives",
      "wart",
      "biopsy",
      "melanoma screening",
    ],
    bio: "Dermatologist with expertise in medical and cosmetic skin conditions.",
  },
  {
    id: "dr-okafor",
    name: "Dr. James Okafor",
    specialty: "ENT / Otolaryngology",
    bodyParts: [
      "ear",
      "ears",
      "nose",
      "throat",
      "sinus",
      "sinuses",
      "hearing",
      "tonsils",
      "voice",
      "tinnitus",
      "allergy ENT",
    ],
    bio: "ENT specialist treating hearing, sinus, and airway disorders.",
  },
  {
    id: "dr-nakamura",
    name: "Dr. Emily Nakamura",
    specialty: "Gastroenterology",
    bodyParts: [
      "stomach",
      "digestion",
      "abdominal pain",
      "nausea",
      "bowel",
      "liver",
      "gerd",
      "ibs",
      "colon",
      "reflux",
      "gi",
    ],
    bio: "Gastroenterologist focused on digestive health and liver disorders.",
  },
];

export const doctors: Doctor[] = baseDoctors.map((d) => ({
  ...d,
  availableSlots: generateSlotsForDoctor(d.id),
}));

export function getDoctorById(id: string): Doctor | undefined {
  return doctors.find((x) => x.id === id);
}

export function getSlotById(slotId: string): { doctor: Doctor; slot: TimeSlot } | null {
  for (const doctor of doctors) {
    const slot = doctor.availableSlots.find((s) => s.id === slotId);
    if (slot) return { doctor, slot };
  }
  return null;
}
