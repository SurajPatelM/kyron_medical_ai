import { NextRequest, NextResponse } from "next/server";
import {
  ensureSession,
  lookupSessionByPhone,
  newSessionId,
  appendMessage,
} from "@/data/store";
import { runTool, updateSessionTopicFromConcern } from "@/lib/chat-tools";
import { normalizeVapiToolCalls, vapiToolResultString } from "@/lib/vapi-webhook";
import type { ChatMessage } from "@/types";

type VapiToolResultRow = {
  name: string;
  toolCallId: string;
  result?: string;
  error?: string;
};

/**
 * Vapi server URL webhook (inbound + tool-calls). Configure in Vapi dashboard when deployed.
 * @see https://docs.vapi.ai/server-url/events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    const type = message?.type as string | undefined;
    const messageRec =
      message && typeof message === "object" && !Array.isArray(message)
        ? (message as Record<string, unknown>)
        : {};

    const caller =
      message?.call?.customer?.number ??
      message?.call?.customer?.phoneNumber ??
      message?.phoneNumber ??
      message?.from ??
      body?.from;

    if (type === "tool-calls") {
      const phone = typeof caller === "string" ? caller : undefined;

      const normalized = normalizeVapiToolCalls(messageRec);
      if (normalized.length === 0) {
        console.warn(
          "vapi webhook tool-calls: no calls parsed",
          JSON.stringify(message).slice(0, 800)
        );
      }

      const resolvedSessionId = phone
        ? lookupSessionByPhone(phone)?.id ?? newSessionId()
        : newSessionId();
      const ensuredSession = ensureSession(resolvedSessionId);

      const results: VapiToolResultRow[] = [];

      for (const tc of normalized) {
        if (tc.name === "match_doctor") {
          updateSessionTopicFromConcern(ensuredSession, tc.parameters);
        }

        try {
          const { result } = await runTool(tc.name, tc.parameters, resolvedSessionId, {
            sendNotifications: false,
          });
          results.push({
            name: tc.name,
            toolCallId: tc.toolCallId,
            result: vapiToolResultString(result),
          });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Tool execution failed";
          results.push({
            name: tc.name,
            toolCallId: tc.toolCallId,
            error: vapiToolResultString(msg),
          });
        }
      }

      return NextResponse.json({ results }, { status: 200 });
    }

    if (type === "end-of-call-report") {
      const phone = typeof caller === "string" ? caller : undefined;
      if (phone) {
        const session = lookupSessionByPhone(phone);
        if (session) {
          const transcript: string | undefined = message?.artifact?.transcript;
          if (transcript && typeof transcript === "string") {
            const trimmed =
              transcript.length > 4000
                ? `${transcript.slice(0, 4000)}...`
                : transcript;
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

    // Only assistant-request should receive assistantOverrides (not status-update, etc.).
    if (type === "assistant-request" && caller && typeof caller === "string") {
      const session = lookupSessionByPhone(caller);
      if (!session) {
        return NextResponse.json({
          assistantOverrides: {
            firstMessage:
              "Hi, thanks for calling Kyron Medical! How can I help you today?",
          },
        });
      }

      const topic = session.lastTopic
        ? session.lastTopic
        : "your care with us";

      // Do not override model.messages here — that can strip tools defined on the saved assistant.
      return NextResponse.json({
        assistantOverrides: {
          firstMessage: `Welcome back! Last time we spoke about ${topic}. How can I help you today?`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("vapi webhook:", e);
    return NextResponse.json({ ok: true });
  }
}
