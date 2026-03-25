const PHONE_RE =
  /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b/g;

/** Extract the last plausible US phone from plain text. */
export function extractPhoneFromText(text: string): string | null {
  const matches = text.match(PHONE_RE);
  if (!matches?.length) return null;
  const raw = matches[matches.length - 1].trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return raw;
  if (digits.length === 11 && digits.startsWith("1")) return raw;
  return null;
}

export function extractLatestPhoneFromMessages(
  messages: { role: string; content: string }[]
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const p = extractPhoneFromText(m.content);
    if (p) return p;
  }
  return null;
}
