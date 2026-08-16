// ============================================================
// Lumina Backend — UN Comtrade Ingestion Verification Task
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { ingestService } from './services/ingestService.js';
import { dbService } from './services/dbService.js';

async function main() {
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
