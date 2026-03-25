import { NextRequest, NextResponse } from "next/server";
import { lookupSessionByPhone, transcriptForSession } from "@/data/store";

/**
 * Vapi server URL webhook (inbound). Configure in Vapi dashboard when deployed.
 * Payload shapes vary — we defensively read caller id from common fields.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const caller =
      body?.message?.call?.customer?.number ??
      body?.call?.customer?.number ??
      body?.customer?.number ??
      body?.from;

    if (!caller || typeof caller !== "string") {
      return NextResponse.json({ ok: true });
    }

    const session = lookupSessionByPhone(caller);
    if (!session) {
      return NextResponse.json({
        assistantOverrides: {
          firstMessage:
            "Hi, thanks for calling Kyron Medical! How can I help you today?",
        },
      });
    }

    const transcript = transcriptForSession(session);
    const topic = session.lastTopic
      ? session.lastTopic
      : "your care with us";

    const context = transcript
      ? `\n\nThe patient previously chatted on the web. Transcript:\n${transcript}\n`
      : "";

    return NextResponse.json({
      assistantOverrides: {
        model: {
          messages: [
            {
              role: "system" as const,
              content: `You are Kyron Medical's patient assistant.${context}Welcome them back naturally and reference: ${topic}. Do not give medical advice.`,
            },
          ],
        },
        firstMessage: `Welcome back! Last time we spoke about ${topic}. How can I help you today?`,
      },
    });
  } catch (e) {
    console.error("vapi webhook:", e);
    return NextResponse.json({ ok: true });
  }
}
