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

export async function generateStorytellingJourney(
  query: string,
  contextPayload: any
): Promise<CinematicJourney> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_key_here") {
    throw new Error("No Gemini API key configured.");
  }

  const prompt = `You are Lumina Storyteller, an expert geopolitical analyst and narrative designer.
Create a compelling, cinematic 5-scene documentary-style story (CinematicJourney) about the global market for the topic: "${query}".
Ground the story in this local database context if available:
${JSON.stringify(contextPayload)}

Guidelines:
1. Generate exactly 5 scenes representing a logical progression:
   - Scene 1: Global overview / introduction (e.g. market size, broad trade routes, historical or current baseline).
   - Scene 2: Major production/supply anchor (e.g., focus on a country with high production, like Brazil or Vietnam for Coffee, or Chile/Australia for Lithium).
   - Scene 3: Major consumption/demand hub (e.g., USA, Germany or other major consumers).
   - Scene 4: Chokepoint, vulnerability, or structural interdependency (e.g. split globe mode, shipping lane issues, climate impact, labor shifts).
   - Scene 5: Future outlook / emerging frontiers (e.g. year 2076 projection, new tech, sustainability opportunity).
2. For each scene, specify:
   - title: Short, evocative chapter title (e.g. '01 // The Seed of Trade', '02 // The Highland Harvester').
   - narrative: A beautiful, informative, Bloomberg/Netflix-documentary style subtitle paragraph (2-3 sentences, 40-60 words). Make it engaging and storytelling-focused!
   - lat & lon: Latitude and longitude of the focused region (e.g., Brazil is lat -14.235, lon -51.925. Vietnam is lat 14.058, lon 108.277. US is lat 37.09, lon -95.71). Use actual, correct coordinates!
   - zoom: Camera zoom multiplier (usually between 4.0 for close country focus, 6.0 for medium region, 8.5 for wide planet view).
   - globeMode: Must be one of: 'network', 'split', 'compare', 'future', or '' (standard).
   - heatmapMode: Must be one of: 'production', 'demand', 'growth', 'exports', 'imports', 'opportunity'.
   - timelineVal: Progress year value from 0 (corresponding to 2026) to 50 (corresponding to 2076).
   - highlightedHotspotId: The ID of a hotspot from the database payload that represents this region (e.g. 'coffee-br', 'coffee-us'). Must match one of the hotspot IDs exactly, or be null if no specific hotspot is highlighted.

Output a single valid JSON object matching the requested schema.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.75,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING" },
          name: { type: "STRING" },
          scenes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                narrative: { type: "STRING" },
                lat: { type: "NUMBER" },
                lon: { type: "NUMBER" },
                zoom: { type: "NUMBER" },
                globeMode: { type: "STRING" },
                heatmapMode: { type: "STRING" },
                timelineVal: { type: "INTEGER" },
                highlightedHotspotId: { type: "STRING", nullable: true }
              },
              required: ["title", "narrative", "lat", "lon", "zoom", "globeMode", "heatmapMode", "timelineVal"]
            }
          }
        },
        required: ["query", "name", "scenes"]
      }
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

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
