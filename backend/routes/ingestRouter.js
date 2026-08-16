// ============================================================
// Lumina Backend — Data Ingestion Router
// ============================================================

import { Router } from 'express';
import { ingestService } from '../services/ingestService.js';

export const ingestRouter = Router();

const authorizeIngest = (req, res, next) => {
  const customKey = req.headers['x-supabase-key'];
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  // Ingestion routes are highly privileged and require the correct service role key
  if (!customKey || customKey.trim() !== serviceKey) {
    return res.status(401).json({ 
      error: "Unauthorized: Database administrative ingestion requires the Supabase Service Role Key." 
    });
  }
  next();
};

ingestRouter.post('/comtrade', authorizeIngest, async (req, res) => {
  const { topicId, cmdCode, year } = req.body;

  // Validate topic ID slug structure
  if (!topicId || typeof topicId !== 'string' || !/^[a-z0-9\-]{2,50}$/.test(topicId)) {
    return res.status(400).json({ error: "Missing or invalid 'topicId' parameter (must be a valid slug)." });
  }

  // Validate HS code structure (must be 2-6 digits)
  if (!cmdCode || typeof cmdCode !== 'string' || !/^\d{2,6}$/.test(cmdCode)) {
    return res.status(400).json({ error: "Missing or invalid 'cmdCode' parameter (must be a 2 to 6 digit HS commodity code)." });
  }

  // Validate year parameter
  const numericYear = parseInt(year);
  if (isNaN(numericYear) || numericYear < 2000 || numericYear > 2030) {
    return res.status(400).json({ error: "Missing or invalid 'year' parameter (must be an integer between 2000 and 2030)." });
  }

  try {
    const summary = await ingestService.ingest({ topicId, cmdCode, year: numericYear });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
