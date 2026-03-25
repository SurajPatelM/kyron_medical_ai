"use client";

import type { ChatMessage } from "@/types";
import GlassCard from "@/components/UI/GlassCard";

interface MessageBubbleProps {
  message: ChatMessage;
  onSlotPick?: (slotId: string, label: string) => void;
}

export default function MessageBubble({
  message,
  onSlotPick,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`msg-appear flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      <GlassCard
        className={
          isUser
            ? "max-w-[85%] border-white/15 bg-white/12 px-4 py-3"
            : "max-w-[85%] border-teal-500/20 bg-white/[0.07] px-4 py-3"
        }
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
          {message.content}
        </p>
        {!isUser &&
        message.suggestedSlots?.length &&
        onSlotPick ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestedSlots.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSlotPick(id, label)}
                className="rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-200 transition-all hover:border-teal-400/50 hover:bg-teal-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </GlassCard>
      <span className="text-[10px] text-slate-500">{time}</span>
    </div>
  );
}
