// ============================================================
// Lumina — Google Gemini AI Intelligence Brief Service
// Streams grounded country × topic briefs using real Lumina data
// ============================================================

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

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent";

function buildPrompt(ctx: BriefContext): string {
  const insightBlock =
    ctx.insights.length > 0
      ? ctx.insights.map((i) => `• ${i}`).join("\n")
      : "• No specific insights on record.";

  const tradeBlock =
    ctx.tradePartners.length > 0
      ? ctx.tradePartners.slice(0, 4).join("; ")
      : "No major trade corridors recorded.";

  return `You are Lumina Intelligence, an advanced geopolitical and trade analyst. 
Write a concise 3-paragraph intelligence brief for the following country × commodity pair.
Ground every claim strictly in the data provided. Do not invent statistics. Use a confident, analytical tone — like a Bloomberg or Palantir analyst report. Use no markdown headers or bullet points in the output, only clean prose paragraphs.

COUNTRY: ${ctx.countryName} (${ctx.countryId}) — ${ctx.region}
COMMODITY / SECTOR: ${ctx.topic}

LUMINA SCORED DATA:
- Production Score: ${ctx.productionScore}
- Demand Score: ${ctx.demandScore}
- Growth Score (% CAGR): ${ctx.growthScore}
- Export Score (USD M / units): ${ctx.exportScore}
- Import Score (USD M / units): ${ctx.importScore}
- Opportunity Score: ${ctx.opportunityScore} / 100

DATABASE SUMMARY:
${ctx.summary}

KEY INTELLIGENCE INSIGHTS:
${insightBlock}

TRADE CORRIDORS:
${tradeBlock}

Write exactly 3 paragraphs:
1. Current position — what role does this country play in the global ${ctx.topic} supply chain or market right now?
2. Growth trajectory — what does the data reveal about where this country is heading in the next 3–5 years?
3. Strategic opportunity — what should an investor, policy maker, or supply chain director watch for based on this data?

Keep the brief under 280 words total. End with a one-sentence "Intelligence Signal" starting with "▸".`;
}

export async function generateIntelBrief(
  ctx: BriefContext,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_key_here") {
    onError(
      "No Gemini API key configured. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server."
    );
    return;
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(ctx) }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      topP: 0.9,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
          const text =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
