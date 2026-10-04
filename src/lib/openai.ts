/**
 * Thin OpenAI REST wrapper, mirroring `paystack.ts`'s style (no SDK).
 *
 * Server-only. `OPENAI_API_KEY` must never be exposed to the client — only
 * import this from `+api.ts` route handlers or Inngest functions.
 */
import * as Sentry from "@sentry/react-native";

const BASE_URL = "https://api.openai.com/v1";

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set. Add your OpenAI secret key to .env.");
  }
  return key;
}

export type ChatMessage = { role: "system" | "user"; content: string };

/** Chat Completions call for a single text response, no streaming. */
export async function generateText(model: string, messages: ChatMessage[]): Promise<string> {
  return Sentry.startSpan(
    { op: "ai.chat", name: `OpenAI ${model}`, attributes: { "ai.model": model } },
    async () => {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature: 0.5 }),
      });
      if (!res.ok) {
        throw new Error(`OpenAI chat completion failed (${res.status}): ${await res.text()}`);
      }
      const json = (await res.json()) as {
        choices: { message: { content: string | null } }[];
      };
      return json.choices[0]?.message.content?.trim() ?? "";
    },
  );
}
