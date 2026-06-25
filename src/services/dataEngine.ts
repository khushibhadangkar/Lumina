// Unified Data Intelligence Engine for Lumina
// Retrieves active parameters from the Relational Database Layer.

import { db } from "./db";

export interface MarketOverview {
  marketSize: string;
  producers: string[];
  consumers: string[];
  growthRate: string;
  tradeVolume: string;
  source: string;
}

export interface HotspotData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  production: number; // Volume in metric units
  demand: number;     // Consumption/Needs score 0-100
  growth: number;     // Annual growth rate percentage
  exports: number;    // Export valuation in $M
  imports: number;    // Import valuation in $M
  opportunity: number; // Opportunity score 0-100
  metricUnit: string;
}

export interface TradeCorridor {
  from: string;
  to: string;
  latFrom: number;
  lonFrom: number;
  latTo: number;
  lonTo: number;
  volume: string;
  type: string;
}

export interface IntelligencePayload {
  query: string;
  overview: MarketOverview;
  hotspots: HotspotData[];
  corridors: TradeCorridor[];
  insights: string[];
}

export class DataIntelligenceEngine {
  // Queries active DB layer to construct topic intelligence payload
  static async getIntelligence(query: string): Promise<IntelligencePayload | null> {
    if (!query) return null;
    await db.init();
    
    const topics = await db.getTopics();
    const cleanQuery = query.toLowerCase().trim();
    
    // Find closest mapping profile
    let topic = topics.find(
      t => t.id === cleanQuery || t.title.toLowerCase() === cleanQuery ||
           t.id.includes(cleanQuery) || cleanQuery.includes(t.id)
    );
    
    // Fallback to coffee if not found to prevent empty canvas crash
    if (!topic) {
      topic = topics.find(t => t.id === "coffee");
      if (!topic) return null;
    }

    // 1. Fetch Relational Joined Metrics & Country data
    const dbMetrics = await db.getCountryMetrics(topic.id);
    
    // Dynamic metric unit based on topic id
    const metricUnit = this.getMetricUnit(topic.id);

    const hotspots: HotspotData[] = dbMetrics.map((m) => ({
      id: `${topic!.id}-${m.country_id.toLowerCase()}`,
      name: m.name,
      lat: m.latitude,
      lon: m.longitude,
      category: `${topic!.title} Hub`,
      production: m.production_score,
      demand: m.demand_score,
      growth: m.growth_score,
      exports: m.export_score,
      imports: m.import_score,
      opportunity: m.opportunity_score,
      metricUnit
    }));

    // Sort hotspots to get producers & consumers list for market overview
    const producers = [...dbMetrics]
      .filter((m) => m.production_score > 0)
      .sort((a, b) => b.production_score - a.production_score)
      .slice(0, 4)
      .map((m) => m.name);

    const consumers = [...dbMetrics]
      .filter((m) => m.demand_score > 0)
      .sort((a, b) => b.demand_score - a.demand_score)
      .slice(0, 4)
      .map((m) => m.name);

    // 2. Fetch Joined Trade Corridors
    const dbRoutes = await db.getTradeRoutes(topic.id);
    const corridors: TradeCorridor[] = dbRoutes.map((r) => ({
      from: r.srcName,
      to: r.dstName,
      latFrom: r.srcLat,
      lonFrom: r.srcLon,
      latTo: r.dstLat,
      lonTo: r.dstLon,
      volume: r.volume,
      type: topic!.id === "solar" || topic!.id === "wind" || topic!.id === "lithium" ? "energy" : "trade"
    }));

    // 3. Fetch Country-Topic Insights
    const dbInsights = await db.getCountryInsights(topic.id);
    const insights: string[] = dbInsights.map((i) => i.insight);
    
    // Add a generic fallback insight if none loaded
    if (insights.length === 0) {
      insights.push(`${topic.title} logistics networks are scaling. Check detailed country panels for specific trade lane updates.`);
    }

    const overview: MarketOverview = {
      marketSize: topic.market_size || "N/A",
      producers: producers.length > 0 ? producers : ["Global Suppliers"],
      consumers: consumers.length > 0 ? consumers : ["Global Buyers"],
      growthRate: topic.growth_rate || "N/A",
      tradeVolume: topic.trade_volume || "N/A",
      source: topic.source || "Database"
    };

    return {
      query: topic.title,
      overview,
      hotspots,
      corridors,
      insights
    };
  }

  private static getMetricUnit(topicId: string): string {
    switch (topicId) {
      case "coffee": return "Million Bags";
      case "tea": return "Thousand Tons";
      case "lithium": return "k Tons LCE";
      case "ai-engineers":
      case "software-engineers": return "Thousand Engineers";
      case "solar":
      case "wind":
      case "data-centers": return "GW Capacity";
      case "semiconductors": return "Production Index";
      default: return "Score";
    }
  }

  // Timeline chronology interpolator
  // Calculates data frame shifts from 2026 to 2076 based on historical vs forecast logs
  static interpolateTimeline(
    baseHotspots: HotspotData[],
    timelineProgress: number // 0 (2026) to 50 (2076)
  ): HotspotData[] {
    const year = 2026 + timelineProgress;
    
    return baseHotspots.map(h => {
      // Production & Demand evolve dynamically
      const growthFactor = 1.0 + (h.growth / 100.0) * timelineProgress;
      const decayFactor = 1.0 - (0.01 * timelineProgress); // subtle shifts
      
      const newProd = h.production > 0 
        ? parseFloat((h.production * growthFactor).toFixed(2))
        : 0;

      const newDemand = Math.min(
        100, 
        Math.max(5, Math.floor(h.demand * (year < 2035 ? growthFactor : growthFactor * decayFactor)))
      );

      const newExports = h.exports > 0
        ? parseFloat((h.exports * growthFactor).toFixed(2))
        : 0;

      const newImports = h.imports > 0
        ? parseFloat((h.imports * growthFactor).toFixed(2))
        : 0;

      return {
        ...h,
        production: newProd,
        demand: newDemand,
        exports: newExports,
        imports: newImports,
      };
    });
  }

  // Solves side-by-side Comparative Datasets
  static async getComparison(preset: string): Promise<{
    titleA: string;
    titleB: string;
    payloadA: IntelligencePayload;
    payloadB: IntelligencePayload;
  }> {
    const cleanPreset = preset.toLowerCase().trim();

    let topicIdA = "coffee";
    let topicIdB = "tea";

    if (cleanPreset.includes("tea") || cleanPreset.includes("coffee")) {
      topicIdA = "coffee";
      topicIdB = "tea";
    } else if (cleanPreset.includes("wind") || cleanPreset.includes("solar")) {
      topicIdA = "solar";
      topicIdB = "wind";
    } else if (cleanPreset.includes("software") || cleanPreset.includes("ai")) {
      topicIdA = "ai-engineers";
      topicIdB = "software-engineers";
    }

    const payloadA = (await this.getIntelligence(topicIdA))!;
    const payloadB = (await this.getIntelligence(topicIdB))!;

    return {
      titleA: payloadA.query,
      titleB: payloadB.query,
      payloadA,
      payloadB
    };
  }
}
