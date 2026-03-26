"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Loader2 } from "lucide-react";

interface CallButtonProps {
  phoneNumber: string | null;
  sessionId: string;
  onCallInitiated?: () => void;
  onRequestPhone?: () => void;
}

export default function CallButton({
  phoneNumber,
  sessionId,
  onCallInitiated,
  onRequestPhone,
}: CallButtonProps) {
  const [status, setStatus] = useState<"idle" | "calling" | "active" | "error">(
    "idle"
  );

  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Ensure we never get stuck in an "in progress" state if the call ends
    // without sending us an event back to the UI.
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (status === "calling" || status === "active") {
      resetTimerRef.current = window.setTimeout(() => {
        setStatus("idle");
      }, 90_000);
    }

    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [status]);

  const handleCall = async () => {
    if (!phoneNumber) {
      onRequestPhone?.();
      return;
    }

    setStatus("calling");
    try {
      const res = await fetch("/api/vapi/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, sessionId }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("active");
        onCallInitiated?.();
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const backToChat = () => {
    setStatus("idle");
  };

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={handleCall}
        disabled={status === "calling" || status === "active"}
        aria-label="Continue via phone call"
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
          transition-all duration-300
          ${
            status === "active"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : status === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_0_20px_rgba(0,212,170,0.15)]"
          }
          ${!phoneNumber ? "opacity-60" : ""}
          animate-pulse-glow
        `}
      >
        {status === "calling" ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <Phone className="w-4 h-4" aria-hidden />
        )}
        {status === "idle" &&
          (phoneNumber
            ? "Continue via Phone Call"
            : "Provide phone number first")}
        {status === "calling" && "Calling your phone..."}
        {status === "active" && "Call in progress - answer your phone!"}
        {status === "error" && "Call failed - try again"}
      </button>

      {(status === "calling" || status === "active") && (
        <button
          type="button"
          onClick={backToChat}
          className="mt-1 text-left text-[12px] font-medium text-slate-400 transition-colors hover:text-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
        >
          Back to chat
        </button>
      )}
    </div>
  );
}
