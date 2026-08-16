// ============================================================
// Lumina Backend — UN Comtrade Data Ingestion Core Service
// ============================================================

import { comtradeClient } from './comtradeClient.js';
import { dbService } from './dbService.js';

export const ingestService = {
  async ingest({ topicId, cmdCode, year }) {
    const logs = [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] Starting UN Comtrade ingestion for topic '${topicId}' (HS: ${cmdCode}) for year ${year}`);

    // 1. Fetch dynamic country lists to build the mapper
    let countriesList;
    try {
      countriesList = await dbService.select("countries");
    } catch (err) {
      throw new Error(`Failed to load countries from database: ${err.message}`);
    }

    const iso3ToIso2 = {};
    const countryNames = {};
    countriesList.forEach(c => {
      if (c.iso_code && c.id) {
        iso3ToIso2[c.iso_code.toUpperCase()] = c.id.toUpperCase();
        countryNames[c.id.toUpperCase()] = c.name;
      }
    });

    // Verify the target topic exists in the database
    let topicsList;
    try {
      topicsList = await dbService.select("topics", `id=eq.${topicId}`);
    } catch (err) {
      throw new Error(`Failed to verify topic existence in database: ${err.message}`);
    }

    if (topicsList.length === 0) {
      throw new Error(`Topic '${topicId}' does not exist in the database. Please create the topic schema first.`);
    }
    const topicName = topicsList[0].title;

    // 2. Fetch trade data from UN Comtrade (both Imports M and Exports X)
    let importResults = [];
    let exportResults = [];

    try {
      logs.push("Fetching Import records from UN Comtrade...");
      importResults = await comtradeClient.fetchTradeData({ period: year, cmdCode, flowCode: 'M' });
    } catch (err) {
      logs.push(`Warning: Import fetch failed or returned empty: ${err.message}`);
    }

    try {
      logs.push("Fetching Export records from UN Comtrade...");
      exportResults = await comtradeClient.fetchTradeData({ period: year, cmdCode, flowCode: 'X' });
    } catch (err) {
      logs.push(`Warning: Export fetch failed or returned empty: ${err.message}`);
    }

    logs.push(`Retrieved ${importResults.length} imports and ${exportResults.length} exports.`);

    if (importResults.length === 0 && exportResults.length === 0) {
      throw new Error("No trade records were returned from UN Comtrade for the specified query.");
    }

    const routesToUpsert = [];
    const countryAggregates = {};

    const getAggregate = (iso2) => {
      if (!countryAggregates[iso2]) {
        countryAggregates[iso2] = {
          exportsM: 0,
          importsM: 0,
          partners: new Set()
        };
      }
      return countryAggregates[iso2];
    };

    // Helper validation regex
    const isValidCountryId = (code) => /^[A-Z]{2}$/.test(code);
    const isValidSlug = (slug) => /^[a-z0-9\-]{2,50}$/.test(slug);

    // 3. Process Imports (flowCode 'M')
    for (const record of importResults) {
      const reporterISO3 = (record.reporterISO || "").toUpperCase().trim();
      const partnerISO3 = (record.partnerISO || "").toUpperCase().trim();
      
      const reporterISO2 = iso3ToIso2[reporterISO3];
      const partnerISO2 = iso3ToIso2[partnerISO3];
      const primaryValue = parseFloat(record.primaryValue || "0");

      if (!reporterISO2 || !isValidCountryId(reporterISO2)) continue;

      const valueM = primaryValue / 1000000;

      // Partner code 0 or 'W00' represents trade with the World (totals)
      if (record.partnerCode === 0 || partnerISO3 === 'W00') {
        getAggregate(reporterISO2).importsM += valueM;
      } else if (partnerISO2 && isValidCountryId(partnerISO2) && reporterISO2 !== partnerISO2) {
        // Trade route: from partner to reporter (since this is an import for reporter)
        routesToUpsert.push({
          id: `route-${partnerISO2}-${reporterISO2}-${topicId}`,
          source_country: partnerISO2,
          destination_country: reporterISO2,
          volume: `$${valueM.toFixed(1)}M`,
          topic_id: topicId
        });
        getAggregate(reporterISO2).partners.add(partnerISO2);
      }
    }

    // 4. Process Exports (flowCode 'X')
    for (const record of exportResults) {
      const reporterISO3 = (record.reporterISO || "").toUpperCase().trim();
      const partnerISO3 = (record.partnerISO || "").toUpperCase().trim();
      
      const reporterISO2 = iso3ToIso2[reporterISO3];
      const partnerISO2 = iso3ToIso2[partnerISO3];
      const primaryValue = parseFloat(record.primaryValue || "0");

      if (!reporterISO2 || !isValidCountryId(reporterISO2)) continue;

      const valueM = primaryValue / 1000000;

      if (record.partnerCode === 0 || partnerISO3 === 'W00') {
        getAggregate(reporterISO2).exportsM += valueM;
      } else if (partnerISO2 && isValidCountryId(partnerISO2) && reporterISO2 !== partnerISO2) {
        // Trade route: from reporter to partner
        routesToUpsert.push({
          id: `route-${reporterISO2}-${partnerISO2}-${topicId}`,
          source_country: reporterISO2,
          destination_country: partnerISO2,
          volume: `$${valueM.toFixed(1)}M`,
          topic_id: topicId
        });
        getAggregate(reporterISO2).partners.add(partnerISO2);
      }
    }

    // 5. Generate Country Metrics & Scores
    const metricsToUpsert = [];
    let maxExport = 0;
    let maxImport = 0;

    Object.values(countryAggregates).forEach(agg => {
      if (agg.exportsM > maxExport) maxExport = agg.exportsM;
      if (agg.importsM > maxImport) maxImport = agg.importsM;
    });

    for (const [countryId, agg] of Object.entries(countryAggregates)) {
      const rawExportsM = parseFloat(agg.exportsM.toFixed(2));
      const rawImportsM = parseFloat(agg.importsM.toFixed(2));
      
      // Normalized scores (exports mapped to production, imports mapped to demand)
      const productionScore = parseFloat((agg.exportsM * 1.2).toFixed(2));
      const demandScore = parseFloat((agg.importsM * 1.1).toFixed(2));
      const growthScore = 2.5; // stable positive projection baseline

      const exportRatio = maxExport > 0 ? (agg.exportsM / maxExport) : 0;
      const importRatio = maxImport > 0 ? (agg.importsM / maxImport) : 0;
      // Weighted index logic
      const opportunityScore = Math.min(100, Math.max(10, Math.round((exportRatio * 60) + (importRatio * 40))));

      const countryName = countryNames[countryId] || countryId;
      const summary = `${countryName} ${topicName} Trade: Annual exports registered at $${rawExportsM.toFixed(1)}M and imports at $${rawImportsM.toFixed(1)}M in ${year}. Operates through ${agg.partners.size} custom trade corridors.`;

      // Validate scores before adding to upsert queue
      if (
        isValidCountryId(countryId) &&
        isValidSlug(topicId) &&
        !isNaN(productionScore) &&
        !isNaN(demandScore) &&
        opportunityScore >= 0 &&
        opportunityScore <= 100
      ) {
        metricsToUpsert.push({
          id: `${countryId}-${topicId}`,
          country_id: countryId,
          topic_id: topicId,
          production_score: productionScore,
          demand_score: demandScore,
          growth_score: growthScore,
          export_score: rawExportsM,
          import_score: rawImportsM,
          opportunity_score: opportunityScore,
          summary
        });
      } else {
        logs.push(`Warning: Metric record for '${countryId}' failed schema validation - skipping`);
      }
    }

    // 6. DB Upserts
    let routesCount = 0;
    let metricsCount = 0;

    if (routesToUpsert.length > 0) {
      // Validate routes structure
      const validRoutes = routesToUpsert.filter(r => 
        isValidCountryId(r.source_country) && 
        isValidCountryId(r.destination_country) && 
        r.source_country !== r.destination_country
      );
      
      if (validRoutes.length > 0) {
        await dbService.upsert("trade_routes", validRoutes);
        routesCount = validRoutes.length;
        logs.push(`Successfully upserted ${routesCount} trade routes to Supabase.`);
      }
    }

    if (metricsToUpsert.length > 0) {
      await dbService.upsert("country_metrics", metricsToUpsert);
      metricsCount = metricsToUpsert.length;
      logs.push(`Successfully upserted ${metricsCount} country metrics to Supabase.`);
    }

    const endTimestamp = new Date().toISOString();
    logs.push(`[${endTimestamp}] UN Comtrade Ingestion complete.`);

    return {
      success: true,
      topicId,
      year,
      recordsIngested: routesCount + metricsCount,
      tradeRoutesIngested: routesCount,
      countryMetricsIngested: metricsCount,
      timestamp: endTimestamp,
      logs
    };
  }
};
