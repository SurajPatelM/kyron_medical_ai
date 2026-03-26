import { NextRequest, NextResponse } from "next/server";
import {
  ensureSession,
  getSession,
  indexSessionPhone,
  transcriptForSession,
} from "@/data/store";

function lastUserSnippet(
  session: NonNullable<ReturnType<typeof getSession>>,
  max = 180
): string | null {
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const m = session.messages[i];
    if (m.role === "user") {
      const t = m.content.replace(/\s+/g, " ").trim();
      if (!t) return null;
      return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
    }
  }
  return null;
}

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
    const chatTranscript = session ? transcriptForSession(session) : "";

    const phoneNumberId =
      process.env.VAPI_PHONE_NUMBER_ID || "1733ac9f-e943-40db-ac82-9deb2394094c";
    const assistantId =
      process.env.VAPI_ASSISTANT_ID ||
      "d9db5bb5-31e7-4881-b928-152c199ebbf0";

    const rawPhone = String(phoneNumber);
    const e164 = rawPhone.startsWith("+")
      ? rawPhone
      : `+1${rawPhone.replace(/\D/g, "")}`;

    // Ensure session exists (chat may not have hit API yet) and map phone → session for webhooks.
    ensureSession(sessionId);
    indexSessionPhone(sessionId, e164);

    let firstMessage: string;
    if (chatTranscript.trim() && session) {
      const hint = lastUserSnippet(session);
      firstMessage = hint
        ? `Hi! I'm Kyron Medical's assistant, picking up from your web chat. Last you mentioned: ${hint}. How can I help you now?`
        : `Hi! I'm Kyron Medical's assistant, continuing from your web chat. How can I help you now?`;
    } else {
      firstMessage =
        `Hi, thanks for calling Kyron Medical! I'm here to help with appointments, prescription refills, or office information. What can I do for you?`;
    }

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
        // Only override firstMessage. Overriding model.messages removes tools from the saved assistant.
        assistantOverrides: {
          firstMessage,
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
