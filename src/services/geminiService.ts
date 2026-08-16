// ============================================================
// Lumina — Google Gemini AI Intelligence Brief Service
// Streams grounded country × topic briefs using real Lumina data
// ============================================================

import type { CinematicJourney } from "./narrativeEngine";

export interface BriefContext {
  countryName: string;
  countryId: string;
  topic: string;
  productionScore: number;
  demandScore: number;
  growthScore: number;
  exportScore: number;
  importScore: number;
  opportunityScore: number;
  summary: string;
  insights: string[];
  tradePartners: string[];
  region: string;
}

export async function generateIntelBrief(
  ctx: BriefContext,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const response = await fetch("/api/gemini/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) {
      const errText = await response.text();
      onError(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("Stream reader unavailable.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === "[DONE]" || jsonStr === "") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) onChunk(text);
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone();
  } catch (err: any) {
    onError(`Network error: ${err.message}`);
  }
}

export async function generateStorytellingJourney(
  query: string,
  contextPayload: any
): Promise<CinematicJourney> {
  const response = await fetch("/api/gemini/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, contextPayload }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini.");
  }

  const journey: CinematicJourney = JSON.parse(text);
  return journey;
}
