"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import Header from "@/components/UI/Header";
import GlassCard from "@/components/UI/GlassCard";
import MessageBubble from "@/components/Chat/MessageBubble";
import ChatInput from "@/components/Chat/ChatInput";
import TypingIndicator from "@/components/Chat/TypingIndicator";
import CallButton from "@/components/Chat/CallButton";

interface ChatContainerProps {
  messages: ChatMessage[];
  sessionId: string;
  isTyping: boolean;
  patientPhone: string | null;
  onSend: (text: string) => void;
  onSlotPick: (slotId: string, label: string) => void;
  onRequestCallPhone: () => void;
  onCallInitiated: () => void;
}

export default function ChatContainer({
  messages,
  sessionId,
  isTyping,
  patientPhone,
  onSend,
  onSlotPick,
  onRequestCallPhone,
  onCallInitiated,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex min-h-0 flex-1 flex-col chat-enter">
      <GlassCard className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/[0.12] bg-white/[0.05] shadow-[0_8px_48px_rgba(0,0,0,0.35)]">
        <Header />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onSlotPick={m.role === "assistant" ? onSlotPick : undefined}
            />
          ))}
          {isTyping ? (
            <div className="flex justify-start">
              <GlassCard className="inline-flex border-teal-500/15 bg-white/[0.06]">
                <TypingIndicator />
              </GlassCard>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <div className="flex flex-col gap-2 border-t border-white/5 px-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <CallButton
            phoneNumber={patientPhone}
            sessionId={sessionId}
            onRequestPhone={onRequestCallPhone}
            onCallInitiated={onCallInitiated}
          />
        </div>
        <ChatInput onSend={onSend} disabled={isTyping} />
      </GlassCard>
    </div>
  );
}
