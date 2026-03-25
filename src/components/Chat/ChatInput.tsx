"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [press, setPress] = useState(false);

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-white/10 bg-[#060d18]/80 px-3 py-3 backdrop-blur-md sm:px-4">
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your message…"
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30 disabled:opacity-50"
      />
      <button
        type="button"
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        onMouseLeave={() => setPress(false)}
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg shadow-teal-500/20 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-40 ${press ? "scale-95" : "scale-100"}`}
      >
        <Send className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
