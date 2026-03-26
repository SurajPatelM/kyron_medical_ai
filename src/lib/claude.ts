import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export const SYSTEM_PROMPT = `You are a friendly, professional patient assistant for Kyron Medical, a physician group. You help patients with:

1. APPOINTMENT SCHEDULING: Collect patient info, understand their medical concern, match them to the right specialist, and help them pick an available time slot.
2. PRESCRIPTION REFILL STATUS: (Simulated) Ask for their name and prescription, then provide a mock status update.
3. OFFICE INFORMATION: Provide practice hours (Mon-Fri 8 AM - 5 PM) and address (245 Wellness Drive, Suite 300, Boston, MA 02115).

APPOINTMENT SCHEDULING WORKFLOW:
- First, warmly greet the patient and ask how you can help
- If they want an appointment, collect: first name, last name, date of birth, phone number, and email
- Ask what body part or health concern brings them in
- Use the match_doctor tool to find the right specialist
- If no specialist matches, politely say the practice does not treat that condition and suggest they consult their primary care physician
- Once matched, use the get_available_slots tool to show available times
- Present 3-5 upcoming options in a friendly format
- If the patient asks for specific days/times (e.g., "do you have a Tuesday afternoon?"), filter accordingly and respond naturally
- Once they choose, use the book_appointment tool to confirm
- IMPORTANT: Once you have successfully booked an appointment, do NOT call book_appointment again for the same patient in the same conversation. After confirming the booking, simply ask if they need anything else and wrap up the conversation naturally.
- After booking, ask if they would like to opt in to SMS reminders unless they already declined. If the patient opts in (including saying yes after you ask, or they already indicated SMS when you called book_appointment with smsOptIn true), use the send_sms_reminder tool to send them a confirmation text (pass their phone number and a short plain-text summary: doctor name, date, and time).
- Offer to continue via phone call if they prefer voice conversation

SAFETY RULES:
- NEVER provide medical advice, diagnoses, or treatment recommendations
- NEVER say anything that could be interpreted as a medical opinion
- If asked medical questions, say: "I'm not qualified to provide medical advice. Please discuss that with your doctor during your appointment."
- Be helpful but stay strictly within scheduling, office info, and prescription status workflows

TONE: Warm, concise, professional. Like a friendly medical receptionist. Use the patient's first name once you know it.`;

export function getClaudeTools(): Tool[] {
  return [
    {
      name: "match_doctor",
      description:
        "Match a patient's health concern to the most appropriate specialist at the practice. Returns the doctor's info or null if no specialist handles that concern.",
      input_schema: {
        type: "object" as const,
        properties: {
          concern: {
            type: "string" as const,
            description:
              "The patient's described health concern or body part they want treated",
          },
        },
        required: ["concern"],
      },
    },
    {
      name: "get_available_slots",
      description:
        "Get available appointment time slots for a specific doctor. Can optionally filter by preferred day of week or time of day.",
      input_schema: {
        type: "object" as const,
        properties: {
          doctorId: { type: "string" as const, description: "The doctor's ID" },
          preferredDay: {
            type: "string" as const,
            description:
              "Optional: preferred day of week (e.g., 'Tuesday', 'Monday')",
          },
          preferredTimeOfDay: {
            type: "string" as const,
            enum: ["morning", "afternoon", "any"],
            description: "Optional: preferred time of day",
          },
          maxResults: {
            type: "number" as const,
            description: "Max number of slots to return. Default 5.",
          },
        },
        required: ["doctorId"],
      },
    },
    {
      name: "book_appointment",
      description:
        "Book an appointment for a patient with a specific doctor at a specific time slot. Call this only after the patient has confirmed the slot.",
      input_schema: {
        type: "object" as const,
        properties: {
          firstName: { type: "string" as const },
          lastName: { type: "string" as const },
          dateOfBirth: {
            type: "string" as const,
            description: "Patient DOB in MM/DD/YYYY format",
          },
          phone: {
            type: "string" as const,
            description: "Patient phone number",
          },
          email: {
            type: "string" as const,
            description: "Patient email address",
          },
          doctorId: { type: "string" as const },
          slotId: { type: "string" as const },
          reason: {
            type: "string" as const,
            description: "Reason for the appointment",
          },
          smsOptIn: {
            type: "boolean" as const,
            description: "Whether patient opted in to SMS reminders",
          },
        },
        required: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "phone",
          "email",
          "doctorId",
          "slotId",
          "reason",
        ],
      },
    },
    {
      name: "send_sms_reminder",
      description:
        "Send an SMS appointment confirmation via Twilio. Call only after the patient has explicitly opted in to SMS reminders post-booking. Use the phone number they provided and a concise summary of the booking.",
      input_schema: {
        type: "object" as const,
        properties: {
          phone: {
            type: "string" as const,
            description: "Patient mobile number to text (any common format; normalized to E.164)",
          },
          appointmentSummary: {
            type: "string" as const,
            description:
              "Short plain-text summary, e.g. \"Appointment with Dr. Smith on March 28, 2026 at 2:00 PM\"",
          },
        },
        required: ["phone", "appointmentSummary"],
      },
    },
    {
      name: "get_office_info",
      description:
        "Get the practice's office hours, address, and contact information.",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "check_prescription_status",
      description: "Check the status of a prescription refill for a patient.",
      input_schema: {
        type: "object" as const,
        properties: {
          patientName: {
            type: "string" as const,
            description: "Patient's full name",
          },
          prescriptionName: {
            type: "string" as const,
            description: "Name of the medication",
          },
        },
        required: ["patientName", "prescriptionName"],
      },
    },
  ];
}
