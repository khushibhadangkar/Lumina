// ============================================================
// Lumina Backend — UN Comtrade Ingestion Verification Task
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns/promises';
import { ingestService } from './services/ingestService.js';
import { dbService } from './services/dbService.js';

async function verifySupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  console.log("=== PRE-FLIGHT SUPABASE CONFIGURATION DIAGNOSTIC ===");
  if (!url) {
    console.error("❌ SUPABASE_URL is missing or empty.");
    return false;
  }
  
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    console.log(`- Supabase URL Scheme: ${parsedUrl.protocol}`);
    console.log(`- Supabase Host: ${parsedUrl.hostname}`);
    if (parsedUrl.protocol !== 'https:') {
      console.error(`❌ Warning: SUPABASE_URL protocol must be https (found ${parsedUrl.protocol})`);
    }
  } catch (err) {
    console.error(`❌ Invalid SUPABASE_URL format: ${url}`);
    return false;
  }

  const match = parsedUrl.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
  if (!match) {
    console.error(`❌ Hostname does not match expected Supabase domain format (<project-ref>.supabase.co): ${parsedUrl.hostname}`);
  }
  const urlRef = match ? match[1] : null;

  if (!serviceKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing or empty.");
    return false;
  }

  console.log(`- Service Key length: ${serviceKey.length} characters`);
  
  const parts = serviceKey.split('.');
  if (parts.length !== 3) {
    console.error("❌ Service Key is not a valid JWT (must have 3 parts separated by dots).");
  } else {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log(`- JWT Issuer: ${payload.iss}`);
      console.log(`- JWT Project Ref: ${payload.ref}`);
      console.log(`- JWT Role: ${payload.role}`);

      if (urlRef && payload.ref !== urlRef) {
        console.error(`❌ Mismatch: URL project ref '${urlRef}' does not match JWT credential ref '${payload.ref}'!`);
      } else {
        console.log("✦ Supabase credentials match and format is verified.");
      }
    } catch (err) {
      console.error(`❌ Failed to parse Service Key JWT payload: ${err.message}`);
    }
  }

  console.log("\nTesting DNS Lookup connectivity...");
  try {
    const addresses = await dns.lookup(parsedUrl.hostname);
    console.log(`✦ DNS lookup succeeded: Host resolved to IP address ${addresses.address}`);
  } catch (err) {
    console.error(`❌ DNS lookup failed: ${err.message}`);
    console.error(`  - Error Code: ${err.code}`);
    console.error(`  - Syscall: ${err.syscall}`);
    console.error("  - Diagnostic: This indicates the project ref does not exist, has been deleted, or there is a DNS configuration issue.");
  }
  console.log("====================================================\n");
  return true;
}

async function main() {
  await verifySupabaseConfig();

  console.log("------------------------------------------------------------");
  console.log("Lumina Backend — Triggering Comtrade Ingestion");
  console.log("------------------------------------------------------------");

  const query = {
    reporterCode: 36,     // Australia
    partnerCode: 0,       // World
    period: 2024,
    cmdCode: '282520',   // Lithium
    flowCode: 'X'        // Export
  };

  try {
    const result = await ingestService.ingestTradeFlows(query);
    console.log("Ingestion completed successfully:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\nVerifying database entry in Supabase...");
    const records = await dbService.select(
      "trade_flows",
      `reporter_code=eq.36&commodity_code=eq.282520&period=eq.2024&flow_code=eq.X`
    );
    
    console.log(`Found ${records.length} matching records in Supabase 'trade_flows' table:`);
    console.log(JSON.stringify(records, null, 2));
    
    if (records.length > 0) {
      console.log("\n✦ Ingestion verified successfully! The real Australia 2024 lithium record exists in Supabase.");
    } else {
      console.log("\n⚠ Ingestion completed, but no matching records were retrieved during verification.");
    }
  } catch (err) {
    console.error("Verification task execution failed:");
    console.error(err.message);
    process.exit(1);
  }
}

main();
