/**
 * Vapi "tool-calls" server messages: normalize payloads and format responses.
 * @see https://docs.vapi.ai/server-url/events
 */

export type NormalizedVapiToolCall = {
  toolCallId: string;
  name: string;
  parameters: Record<string, unknown>;
};

function parseParams(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const v = JSON.parse(raw) as unknown;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        return v as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
  }
  return {};
}

function pushNormalized(
  out: NormalizedVapiToolCall[],
  seen: Set<string>,
  toolCallId: string,
  name: string,
  parameters: Record<string, unknown>
): void {
  if (!toolCallId || !name || seen.has(toolCallId)) return;
  seen.add(toolCallId);
  out.push({ toolCallId, name, parameters });
}

/**
 * Build tool call list from `toolCallList` and/or `toolWithToolCallList`.
 * Vapi may send either; some payloads only include `toolWithToolCallList`.
 */
export function normalizeVapiToolCalls(message: Record<string, unknown>): NormalizedVapiToolCall[] {
  const seen = new Set<string>();
  const out: NormalizedVapiToolCall[] = [];

  const toolCallList = message["toolCallList"];
  if (Array.isArray(toolCallList)) {
    for (const item of toolCallList) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const id = String(rec["id"] ?? rec["toolCallId"] ?? "");
      const fn = rec["function"];
      let name = String(rec["name"] ?? "");
      if (
        !name &&
        fn &&
        typeof fn === "object" &&
        !Array.isArray(fn)
      ) {
        name = String((fn as Record<string, unknown>)["name"] ?? "");
      }
      let params = parseParams(rec["parameters"]);
      if (!Object.keys(params).length && fn && typeof fn === "object" && !Array.isArray(fn)) {
        params = parseParams((fn as Record<string, unknown>)["arguments"]);
      }
      const nested = rec["toolCall"];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        const nt = nested as Record<string, unknown>;
        const nid = String(nt["id"] ?? id);
        let nparams = parseParams(nt["parameters"]);
        if (!Object.keys(nparams).length) {
          nparams = parseParams(nt["arguments"]);
        }
        const nname =
          name || String(rec["name"] ?? "");
        pushNormalized(out, seen, nid, nname, nparams);
        continue;
      }
      pushNormalized(out, seen, id, name, params);
    }
  }

  if (out.length > 0) return out;

  const toolWithToolCallList = message["toolWithToolCallList"];
  if (!Array.isArray(toolWithToolCallList)) return out;

  for (const item of toolWithToolCallList) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = String(rec["name"] ?? "");
    const tc = rec["toolCall"];
    if (!tc || typeof tc !== "object" || Array.isArray(tc)) continue;
    const tcr = tc as Record<string, unknown>;
    const id = String(tcr["id"] ?? "");
    let params = parseParams(tcr["parameters"]);
    if (!Object.keys(params).length) {
      params = parseParams(tcr["arguments"]);
    }
    pushNormalized(out, seen, id, name, params);
  }

  return out;
}

/** Vapi requires result/error as a single-line string (no raw newlines). */
export function vapiToolResultString(payload: unknown): string {
  const s =
    typeof payload === "string" ? payload : JSON.stringify(payload ?? null);
  return s.replace(/\n/g, " ").replace(/\r/g, " ");
}
