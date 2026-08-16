import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Environment Variable Validation
const requiredEnv = [
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = [];
for (const envVar of requiredEnv) {
  if (!process.env[envVar] || process.env[envVar].trim() === "") {
    missing.push(envVar);
  }
}

if (missing.length > 0) {
  console.error(`\x1b[31m[Lumina Startup Error] Missing required environment variables: ${missing.join(', ')}\x1b[0m`);
  console.error(`Please check your .env file in the project root and ensure these are defined.`);
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY.trim();
const SUPABASE_URL = process.env.SUPABASE_URL.trim();
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();

const PORT = process.env.PORT || 5001;

const app = express();
app.use(cors());
app.use(express.json());

function buildPrompt(ctx) {
  const insightBlock =
    ctx.insights && ctx.insights.length > 0
      ? ctx.insights.map((i) => `• ${i}`).join("\n")
      : "• No specific insights on record.";

  const tradeBlock =
    ctx.tradePartners && ctx.tradePartners.length > 0
      ? ctx.tradePartners.slice(0, 4).join("; ")
      : "No major trade corridors recorded.";

  return `You are Lumina Intelligence, an geopolitical and trade analyst. 
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

function buildStoryPrompt(query, contextPayload) {
  return `You are Lumina Storyteller, an expert geopolitical analyst and narrative designer.
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
}

const getHeaders = (req, useServiceRole = false) => {
  const customKey = req.headers['x-supabase-key'];
  const defaultKey = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const key = customKey || defaultKey;
  return {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
};

const getSupabaseUrl = (req) => {
  return req.headers['x-supabase-url'] || SUPABASE_URL;
};

// SECURITY & VALIDATION HELPERS

const ALLOWED_TABLES = ['countries', 'topics', 'country_metrics', 'trade_routes', 'country_insights', 'related_topics'];

const validateTable = (table) => {
  if (!table || typeof table !== 'string') return false;
  return ALLOWED_TABLES.includes(table.trim());
};

// DATABASE TABLE SCHEMAS ENFORCEMENT

const isSafeText = (text) => {
  if (text === undefined || text === null) return true;
  if (typeof text !== 'string') return false;
  return !text.includes("../") && !text.includes("..\\");
};

const isValidSlug = (text) => {
  if (typeof text !== 'string') return false;
  return /^[a-z0-9\-]{2,50}$/.test(text);
};

const isValidId = (text) => {
  if (typeof text !== 'string') return false;
  return /^[a-zA-Z0-9\-]{2,100}$/.test(text);
};

const isValidCountryId = (text) => {
  if (typeof text !== 'string') return false;
  return /^[A-Z]{2}$/.test(text);
};

const isValidIsoCode = (text) => {
  if (!text) return true;
  if (typeof text !== 'string') return false;
  return /^[A-Z]{3}$/.test(text);
};

const schemas = {
  countries: (row) => {
    if (!isValidCountryId(row.id)) return "Invalid country id";
    if (typeof row.name !== 'string' || row.name.length > 100 || !isSafeText(row.name)) return "Invalid country name";
    if (!isValidIsoCode(row.iso_code)) return "Invalid ISO code";
    if (typeof row.latitude !== 'number' || isNaN(row.latitude) || row.latitude < -90 || row.latitude > 90) return "Invalid latitude";
    if (typeof row.longitude !== 'number' || isNaN(row.longitude) || row.longitude < -180 || row.longitude > 180) return "Invalid longitude";
    if (typeof row.region !== 'string' || row.region.length > 100 || !isSafeText(row.region)) return "Invalid region";
    return null;
  },
  topics: (row) => {
    if (!isValidSlug(row.id)) return "Invalid topic id";
    if (typeof row.title !== 'string' || row.title.length > 100 || !isSafeText(row.title)) return "Invalid topic title";
    if (typeof row.market_size !== 'string' || row.market_size.length > 100 || !isSafeText(row.market_size)) return "Invalid market size";
    if (typeof row.growth_rate !== 'string' || row.growth_rate.length > 100 || !isSafeText(row.growth_rate)) return "Invalid growth rate";
    if (typeof row.trade_volume !== 'string' || row.trade_volume.length > 100 || !isSafeText(row.trade_volume)) return "Invalid trade volume";
    if (typeof row.source !== 'string' || row.source.length > 100 || !isSafeText(row.source)) return "Invalid source";
    return null;
  },
  country_metrics: (row) => {
    if (!isValidCountryId(row.country_id)) return "Invalid country_id";
    if (!isValidSlug(row.topic_id)) return "Invalid topic_id";
    if (typeof row.production_score !== 'number' || isNaN(row.production_score)) return "Invalid production_score";
    if (typeof row.demand_score !== 'number' || isNaN(row.demand_score)) return "Invalid demand_score";
    if (typeof row.growth_score !== 'number' || isNaN(row.growth_score)) return "Invalid growth_score";
    if (typeof row.import_score !== 'number' || isNaN(row.import_score)) return "Invalid import_score";
    if (typeof row.export_score !== 'number' || isNaN(row.export_score)) return "Invalid export_score";
    if (typeof row.opportunity_score !== 'number' || isNaN(row.opportunity_score) || row.opportunity_score < 0 || row.opportunity_score > 100) return "Invalid opportunity_score";
    if (typeof row.summary !== 'string' || row.summary.length > 2000 || !isSafeText(row.summary)) return "Invalid summary";
    return null;
  },
  trade_routes: (row) => {
    if (!isValidId(row.id)) return "Invalid route id";
    if (!isValidCountryId(row.source_country)) return "Invalid source_country";
    if (!isValidCountryId(row.destination_country)) return "Invalid destination_country";
    if (typeof row.volume !== 'string' || row.volume.length > 100 || !isSafeText(row.volume)) return "Invalid volume";
    if (!isValidSlug(row.topic_id)) return "Invalid topic_id";
    return null;
  },
  country_insights: (row) => {
    if (!isValidId(row.id)) return "Invalid insight id";
    if (!isValidCountryId(row.country_id)) return "Invalid country_id";
    if (!isValidSlug(row.topic_id)) return "Invalid topic_id";
    if (typeof row.insight !== 'string' || row.insight.length > 2000 || !isSafeText(row.insight)) return "Invalid insight";
    return null;
  },
  related_topics: (row) => {
    if (!isValidSlug(row.topic_id)) return "Invalid topic_id";
    if (!isValidSlug(row.related_topic_id)) return "Invalid related_topic_id";
    return null;
  }
};

const validateTableSchema = (table, data) => {
  if (!Array.isArray(data)) return "Data must be an array.";
  const validator = schemas[table];
  if (!validator) return "Unsupported table validator.";

  for (let i = 0; i < data.length; i++) {
    const error = validator(data[i]);
    if (error) {
      return `Record at index ${i}: ${error}`;
    }
  }
  return null;
};

const validateQueryParams = (queryParams) => {
  if (queryParams === undefined || queryParams === null) return true;
  if (typeof queryParams !== 'string') return false;
  
  const query = queryParams.trim();
  if (query === "") return true;

  // Only allow alphanumeric, =, &, ., _, -, %, parenthesis, commas, and operators like eq, neq, gt, lt, etc.
  const safePattern = /^[a-zA-Z0-9=&\._\-%,()!]*$/;
  if (!safePattern.test(query)) {
    return false;
  }

  // Prevent obvious SQL commands and comment blocks
  const blacklistedKeywords = ['select', 'insert', 'update', 'delete', 'drop', 'truncate', '--', 'union', '/*', '*/', ';'];
  const lowerQuery = query.toLowerCase();
  for (const keyword of blacklistedKeywords) {
    if (lowerQuery.includes(keyword)) {
      return false;
    }
  }

  return true;
};

const authorizeWrite = (req, res, next) => {
  const customUrl = req.headers['x-supabase-url'];
  const customKey = req.headers['x-supabase-key'];

  // Enforce that updates to the default database require the verified service role key
  if (!customUrl || customUrl.trim() === SUPABASE_URL) {
    if (!customKey || customKey.trim() !== SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(401).json({ 
        error: "Unauthorized: Database administrative writes (insert/truncate) on the default connection require the Supabase Service Role Key." 
      });
    }
  }
  next();
};

const validateBriefContext = (ctx) => {
  if (!ctx || typeof ctx !== 'object') return 'Payload must be an object.';
  
  const strFields = ['countryName', 'countryId', 'topic', 'summary', 'region'];
  for (const field of strFields) {
    if (typeof ctx[field] !== 'string') {
      return `Field '${field}' must be a string.`;
    }
  }

  const numFields = ['productionScore', 'demandScore', 'growthScore', 'exportScore', 'importScore', 'opportunityScore'];
  for (const field of numFields) {
    if (typeof ctx[field] !== 'number' || isNaN(ctx[field])) {
      return `Field '${field}' must be a number.`;
    }
  }

  if (ctx.insights && !Array.isArray(ctx.insights)) {
    return "Field 'insights' must be an array of strings.";
  }
  if (ctx.tradePartners && !Array.isArray(ctx.tradePartners)) {
    return "Field 'tradePartners' must be an array of strings.";
  }

  if (ctx.countryName.length > 100) return "countryName exceeds length limit.";
  if (ctx.countryId.length > 10) return "countryId exceeds length limit.";
  if (ctx.topic.length > 100) return "topic exceeds length limit.";
  if (ctx.region.length > 100) return "region exceeds length limit.";
  if (ctx.summary.length > 2000) return "summary exceeds length limit.";

  if (ctx.insights) {
    for (const insight of ctx.insights) {
      if (typeof insight !== 'string' || insight.length > 300) {
        return "Invalid insight entry.";
      }
    }
  }
  if (ctx.tradePartners) {
    for (const partner of ctx.tradePartners) {
      if (typeof partner !== 'string' || partner.length > 100) {
        return "Invalid trade partner entry.";
      }
    }
  }

  return null;
};

const validateStoryRequest = (reqBody) => {
  const { query, contextPayload } = reqBody;
  if (!query || typeof query !== 'string') return "Field 'query' must be a non-empty string.";
  if (query.length > 100) return "query exceeds length limit.";
  
  const safeQueryPattern = /^[a-zA-Z0-9\s\-_]*$/;
  if (!safeQueryPattern.test(query)) {
    return "query contains prohibited characters.";
  }

  if (contextPayload && typeof contextPayload !== 'object') {
    return "Field 'contextPayload' must be an object or array.";
  }

  return null;
};

// GEMINI PROXY ENDPOINTS

app.post('/api/gemini/brief', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).send("Gemini API key is not configured on the backend.");
  }
  
  const ctx = req.body;
  const validationError = validateBriefContext(ctx);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const prompt = buildPrompt(ctx);
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      topP: 0.9,
    },
  };
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(errText);
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send(err.message);
    }
  }
});

app.post('/api/gemini/story', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key is not configured on the backend." });
  }
  
  const validationError = validateStoryRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { query, contextPayload } = req.body;
  const prompt = buildStoryPrompt(query, contextPayload);
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
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SUPABASE DATABASE PROXY ENDPOINTS

app.post('/api/db/select', async (req, res) => {
  const { table, queryParams } = req.body;
  
  if (!validateTable(table)) {
    return res.status(400).json({ error: "Invalid or prohibited table name query." });
  }

  if (!validateQueryParams(queryParams)) {
    return res.status(400).json({ error: "Invalid or prohibited query parameters detected." });
  }

  const targetUrl = getSupabaseUrl(req);
  if (!targetUrl) {
    return res.status(500).json({ error: "Supabase is not configured." });
  }
  try {
    const url = `${targetUrl}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(req, false)
    });
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/insert', authorizeWrite, async (req, res) => {
  const { table, data } = req.body;

  if (!validateTable(table)) {
    return res.status(400).json({ error: "Invalid or prohibited table name query." });
  }

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid payload: 'data' must be an array of records." });
  }

  const schemaError = validateTableSchema(table, data);
  if (schemaError) {
    return res.status(400).json({ error: `Schema validation error: ${schemaError}` });
  }

  const targetUrl = getSupabaseUrl(req);
  if (!targetUrl) {
    return res.status(500).json({ error: "Supabase is not configured." });
  }
  try {
    const response = await fetch(`${targetUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: getHeaders(req, true),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }
    const resData = await response.json();
    res.json(resData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/truncate', authorizeWrite, async (req, res) => {
  const { table } = req.body;

  if (!validateTable(table)) {
    return res.status(400).json({ error: "Invalid or prohibited table name query." });
  }

  const targetUrl = getSupabaseUrl(req);
  if (!targetUrl) {
    return res.status(500).json({ error: "Supabase is not configured." });
  }
  try {
    const response = await fetch(`${targetUrl}/rest/v1/${table}?id=neq.NULL`, {
      method: "DELETE",
      headers: getHeaders(req, true)
    });
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }
    res.send(await response.text());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Lumina Server] Running secure proxy on port ${PORT}`);
});
