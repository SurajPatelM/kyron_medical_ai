import { doctors } from "@/data/doctors";
import type { Doctor } from "@/types";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s/]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

/**
 * Score concern against doctor keywords; returns best match or null.
 */
export function matchDoctor(concern: string): Doctor | null {
  if (!concern.trim()) return null;

  const concernTokens = tokenize(concern);
  const concernPhrase = concern.toLowerCase();

  let best: { doctor: Doctor; score: number } | null = null;

  for (const doctor of doctors) {
    let score = 0;
    for (const part of doctor.bodyParts) {
      const p = part.toLowerCase();
      if (concernPhrase.includes(p)) score += 3;
      else if (concernTokens.has(p)) score += 2;
      else {
        for (const t of concernTokens) {
          if (t.length > 2 && (p.includes(t) || t.includes(p))) score += 1;
        }
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { doctor, score };
    }
  }

  if (!best || best.score < 2) return null;
  return best.doctor;
}
