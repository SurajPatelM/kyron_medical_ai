import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { CLAUDE_MODEL, getClaudeTools, SYSTEM_PROMPT } from "@/lib/claude";
import { runTool, updateSessionTopicFromConcern } from "@/lib/chat-tools";
import {
  appendMessage,
  ensureSession,
} from "@/data/store";
import type { Appointment, ChatMessage } from "@/types";
import type {
  ContentBlock,
  MessageParam,
  TextBlock,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

function toApiMessages(
  history: ChatMessage[]
): MessageParam[] {
  return history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId : uuidv4();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          reply:
            "I'm sorry — the assistant is not fully configured yet. Please add your ANTHROPIC_API_KEY.",
          sessionId,
        },
        { status: 200 }
      );
    }

    const session = ensureSession(sessionId);
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    appendMessage(sessionId, userMsg);

    let apiMessages = toApiMessages(session.messages);

    let appointmentBooked: Appointment | undefined;
    let slotBatch: { ids: string[]; labels: { id: string; label: string }[] } | undefined;
    const tools = getClaudeTools();

    for (let round = 0; round < 8; round++) {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages: apiMessages,
      });

      if (response.stop_reason === "tool_use") {
        const blocks = response.content;
        apiMessages = [...apiMessages, { role: "assistant", content: blocks }];

        const toolResults: ToolResultBlockParam[] = [];

        for (const block of blocks) {
          if (block.type !== "tool_use") continue;
          const input = block.input as Record<string, unknown>;
          if (block.name === "match_doctor") {
            updateSessionTopicFromConcern(session, input);
          }

          const { result, appointmentBooked: booked, slotIds } = await runTool(
            block.name,
            input,
            sessionId
          );

          if (booked) appointmentBooked = booked;
          if (slotIds?.length) {
            const slots = (result as { slots?: { slotId: string; label: string }[] })
              .slots;
            slotBatch = {
              ids: slotIds,
              labels:
                slots?.map((s) => ({ id: s.slotId, label: s.label })) ?? [],
            };
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        apiMessages = [
          ...apiMessages,
          { role: "user", content: toolResults },
        ];
        continue;
      }

      const replyText = extractText(response.content);
      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: replyText,
        createdAt: new Date().toISOString(),
        slotIds: slotBatch?.ids,
        suggestedSlots:
          slotBatch && slotBatch.labels.length > 0
            ? slotBatch.labels
            : undefined,
      };
      appendMessage(sessionId, assistantMsg);

      return NextResponse.json({
        reply: replyText,
        sessionId,
        appointmentBooked,
        suggestedSlots: slotBatch,
      });
    }

    const fallback =
      "I'm sorry, something took too long to process. Could you repeat that in a few words?";
    appendMessage(sessionId, {
      id: uuidv4(),
      role: "assistant",
      content: fallback,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      reply: fallback,
      sessionId,
      appointmentBooked,
      suggestedSlots: slotBatch,
    });
  } catch (e) {
    console.error("POST /api/chat:", e);
    return NextResponse.json(
      {
        reply:
          "I'm sorry, something went wrong on my side. Please try again in a moment.",
      },
      { status: 200 }
    );
  }
}
