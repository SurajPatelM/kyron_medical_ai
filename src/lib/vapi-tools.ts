import { getClaudeTools } from "@/lib/claude";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/**
 * OpenAI-style function definitions for Vapi assistant model configuration.
 * Use the same `name` and JSON schemas as web chat (`getClaudeTools`) so
 * `/api/vapi/webhook` `runTool` handles voice and chat identically.
 */
export function getVapiModelFunctions(): Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Tool["input_schema"];
    strict?: boolean;
  };
}> {
  return getClaudeTools().map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: t.input_schema,
      strict: false,
    },
  }));
}
