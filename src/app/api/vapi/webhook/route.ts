import { NextRequest, NextResponse } from "next/server";
import {
  ensureSession,
  lookupSessionByPhone,
  newSessionId,
  transcriptForSession,
  appendMessage,
} from "@/data/store";
import { runTool, updateSessionTopicFromConcern } from "@/lib/chat-tools";
import type { ChatMessage } from "@/types";

/**
 * Vapi server URL webhook (inbound). Configure in Vapi dashboard when deployed.
 * Payload shapes vary — we defensively read caller id from common fields.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    const type = message?.type as string | undefined;

    const caller =
      message?.call?.customer?.number ??
      message?.call?.customer?.phoneNumber ??
      message?.phoneNumber ??
      message?.from ??
      body?.from;

    // Tool calls require a response (results array). All other events can be 200-OK quickly.
    if (type === "tool-calls") {
      const phone = typeof caller === "string" ? caller : undefined;

      const toolCallList: Array<{
        id: string;
        name: string;
        parameters?: Record<string, unknown>;
      }> = Array.isArray(message?.toolCallList) ? message.toolCallList : [];

      const resolvedSessionId = phone
        ? lookupSessionByPhone(phone)?.id ?? newSessionId()
        : newSessionId();
      const ensuredSession = ensureSession(resolvedSessionId);

      const results: Array<{
        name: string;
        toolCallId: string;
        result: string;
      }> = [];

      // Execute each tool sequentially. Booking should save to the same in-memory store as chat.
      // Do NOT send email/SMS here; respond quickly to Vapi.
      for (const toolCall of toolCallList) {
        const toolName = String(toolCall.name ?? "");
        const params = (toolCall.parameters ?? {}) as Record<string, unknown>;
        if (!toolName) continue;

        if (toolName === "match_doctor") {
          updateSessionTopicFromConcern(ensuredSession, params);
        }

        const { result } = await runTool(toolName, params, resolvedSessionId, {
          sendNotifications: false,
        });

        results.push({
          name: toolName,
          toolCallId: String(toolCall.id ?? ""),
          result: JSON.stringify(result),
        });
      }

      return NextResponse.json({ results });
    }

    // Store voice transcript into the same in-memory session (best-effort).
    if (type === "end-of-call-report") {
      const phone = typeof caller === "string" ? caller : undefined;
      if (phone) {
        const session = lookupSessionByPhone(phone);
        if (session) {
          const transcript: string | undefined = message?.artifact?.transcript;
          if (transcript && typeof transcript === "string") {
            const trimmed = transcript.length > 4000 ? `${transcript.slice(0, 4000)}...` : transcript;
            const voiceMsg: ChatMessage = {
              id: newSessionId(),
              role: "assistant",
              content: `Voice call transcript:\n${trimmed}`,
              createdAt: new Date().toISOString(),
            };
            appendMessage(session.id, voiceMsg);
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Default: inbound call / assistant-request flow. Keep existing behavior.
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
