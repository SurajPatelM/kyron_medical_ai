import { NextRequest, NextResponse } from "next/server";
import { getSession, transcriptForSession } from "@/data/store";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, sessionId } = await req.json();

    if (!phoneNumber || !sessionId) {
      return NextResponse.json(
        { error: "Phone number and session ID are required" },
        { status: 400 }
      );
    }

    if (!process.env.VAPI_API_KEY) {
      return NextResponse.json(
        { error: "Voice calling is not configured on this server." },
        { status: 503 }
      );
    }

    const session = getSession(sessionId);
    const chatTranscript = session
      ? transcriptForSession(session)
      : "";

    const contextMessage = chatTranscript
      ? `\n\nCONTEXT FROM PRIOR WEB CHAT:\nThe patient has already been chatting via web. Here is the transcript so far:\n${chatTranscript}\n\nContinue the conversation naturally. Greet the patient by name if known, briefly acknowledge what was discussed, and ask how you can continue helping.`
      : "";

    const systemPrompt = `You are a friendly, professional patient assistant for Kyron Medical, a physician group. You help patients with:

1. APPOINTMENT SCHEDULING: Collect patient info, understand their medical concern, match them to the right specialist, and help them pick an available time slot.
2. PRESCRIPTION REFILL STATUS: Ask for their name and prescription, then provide a mock status update.
3. OFFICE INFORMATION: Provide practice hours (Mon-Fri 8 AM - 5 PM) and address (245 Wellness Drive, Suite 300, Boston, MA 02115).

SAFETY RULES:
- NEVER provide medical advice, diagnoses, or treatment recommendations
- NEVER say anything that could be interpreted as a medical opinion
- If asked medical questions, say: "I'm not qualified to provide medical advice. Please discuss that with your doctor during your appointment."

TONE: Warm, concise, professional. Like a friendly medical receptionist.${contextMessage}`;

    const phoneNumberId =
      process.env.VAPI_PHONE_NUMBER_ID || "1733ac9f-e943-40db-ac82-9deb2394094c";
    const assistantId =
      process.env.VAPI_ASSISTANT_ID ||
      "d9db5bb5-31e7-4881-b928-152c199ebbf0";

    const rawPhone = String(phoneNumber);
    const e164 = rawPhone.startsWith("+")
      ? rawPhone
      : `+1${rawPhone.replace(/\D/g, "")}`;

    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId,
        assistantId,
        customer: { number: e164 },
        assistantOverrides: {
          model: {
            provider: "anthropic",
            model: "claude-sonnet-4-20250514",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
            ],
          },
          firstMessage: chatTranscript
            ? `Hi! I'm continuing our conversation from the web chat. How can I keep helping you?`
            : `Hi, thanks for calling Kyron Medical! I'm here to help with appointments, prescription refills, or office information. What can I do for you?`,
        },
      }),
    });

    if (!response.ok) {
      let errBody: unknown;
      try {
        errBody = await response.json();
      } catch {
        errBody = await response.text();
      }
      console.error("Vapi API error:", errBody);
      return NextResponse.json(
        { error: "Failed to initiate call. Please try again." },
        { status: 500 }
      );
    }

    const callData = (await response.json()) as { id?: string };
    return NextResponse.json({
      success: true,
      callId: callData.id,
      message:
        "Calling your number now — you should get a call from Kyron Medical shortly. Please answer when it rings.",
    });
  } catch (error) {
    console.error("Error initiating Vapi call:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
