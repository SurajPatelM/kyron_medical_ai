"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ChatContainer from "@/components/Chat/ChatContainer";
import { extractLatestPhoneFromMessages } from "@/lib/phone";
import type { ChatMessage } from "@/types";

const STORAGE_KEY = "kyron-session";

function createWelcome(): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Hello — I’m Kyron Medical’s virtual assistant. I can help you schedule a visit with the right specialist, check a (demo) prescription refill status, or share our office details. How can I help you today?",
    createdAt: now,
  };
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [phoneHint, setPhoneHint] = useState(false);

  useEffect(() => {
    let sid = sessionStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, sid);
    }
    setSessionId(sid);
    setMessages([createWelcome()]);
  }, []);

  const patientPhone = useMemo(
    () => extractLatestPhoneFromMessages(messages),
    [messages]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setPhoneHint(false);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId }),
        });
        const data = await res.json();
        const reply = typeof data.reply === "string" ? data.reply : "";
        const suggested = data.suggestedSlots as
          | { ids: string[]; labels: { id: string; label: string }[] }
          | undefined;

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
          slotIds: suggested?.ids,
          suggestedSlots:
            suggested?.labels && suggested.labels.length > 0
              ? suggested.labels
              : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I’m sorry — I couldn’t reach the assistant just now. Please try again shortly.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId]
  );

  const onSlotPick = useCallback(
    (slotId: string, label: string) => {
      sendMessage(
        `I'd like to book the slot: ${label} (slot id: ${slotId}). Please confirm booking with the details we discussed.`
      );
    },
    [sendMessage]
  );

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060d18] text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="mesh-bg relative flex h-[100dvh] flex-col px-3 py-4 sm:mx-auto sm:max-w-[700px] sm:px-4 sm:py-6">
      {phoneHint ? (
        <p
          className="mb-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200/90"
          role="status"
        >
          Please share a mobile number in the chat (with area code) so we can call
          you.
        </p>
      ) : null}
      <ChatContainer
        messages={messages}
        sessionId={sessionId}
        isTyping={isTyping}
        patientPhone={patientPhone}
        onSend={sendMessage}
        onSlotPick={onSlotPick}
        onRequestCallPhone={() => setPhoneHint(true)}
        onCallInitiated={() => setPhoneHint(false)}
      />
    </div>
  );
}
