// Research-Grade Country Intelligence Database for Lumina Geospatial Platform
// Combines sovereign country baselines with relational topic metrics queried from the DB.

import { db } from "./db";
import { DataIntelligenceEngine } from "./dataEngine";

export interface CountryResearchProfile {
  id: string;
  name: string;
  overview: string;
  globalRanking: string;
  growth: string;
  tradePartners: string[];
  keyMetrics: Record<string, string>;
  aiInsights: string[];
  relatedTopics: string[];
}

const BASELINE_DOSSIERS: Record<string, {
  name: string;
  overview: string;
  tradePartners: string[];
  keyMetrics: Record<string, string>;
  aiInsights: string[];
  relatedTopics: string[];
}> = {
  US: {
    name: "United States",
    overview: "The United States operates as the intellectual and consumer anchor of the global tech economy, dominating software, R&D, advanced design, and venture capital allocations.",
    tradePartners: [
      "Imports: Taiwan (advanced microprocessors, 90% share)",
      "Imports: China (consumer electronics assembly, lithium batteries)",
      "Exports: Europe & Asia (AI software, chip designs, aerospace tech)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$28.0 Trillion",
      "Tech Sector Share": "10.2% of GDP",
      "AI Talent Density Index": "Highest (185k Professionals)",
      "Systemic Vulnerability": "HIGH (Hardware packaging dependency)"
    },
    aiInsights: [
      "Onshoring critical semiconductor packaging and fabrication under CHIPS Act strategic initiatives.",
      "Deploying clay-based lithium deposits (Thacker Pass) and geothermal brines (Salton Sea) to secure domestic battery loops."
    ],
    relatedTopics: ["AI Engineers", "Software Engineers", "Startups", "Data Centers", "Semiconductors", "Lithium"]
  },
  CN: {
    name: "China",
    overview: "China operates as the world's primary industrial workshop and mineral refinery, controlling dominant shares of chemical processing, solar manufacturing, and consumer hardware assembly.",
    tradePartners: [
      "Imports: Australia & Chile (raw ores, spodumene concentrates)",
      "Imports: Taiwan & South Korea (advanced logic and memory nodes)",
      "Exports: Global markets (assembled hardware, EV batteries, solar arrays)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$18.0 Trillion",
      "Manufacturing Output": "28.4% of Global Total",
      "Battery Material Refining Share": "75% Global Capacity",
      "Systemic Vulnerability": "MEDIUM (Chip import restrictions)"
    },
    aiInsights: [
      "Mandating aggressive domestic hardware substitution to construct a self-sustaining semiconductor stack (Huawei/SMIC).",
      "Dominating clean technology refining pipelines as Western nations push net-zero policies."
    ],
    relatedTopics: ["Semiconductors", "Lithium", "Solar", "Wind", "Robotics", "AI Engineers"]
  },
  BR: {
    name: "Brazil",
    overview: "Brazil is the agricultural and natural resources powerhouse of South America, anchoring global supply chains with massive outputs of soft commodities, minerals, and iron ore.",
    tradePartners: [
      "Exports: United States (soft commodities, crude minerals)",
      "Exports: China & Germany (soy, coffee, raw iron concentrates)",
      "Imports: Germany & USA (heavy tractors, fertilizer, machinery)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$2.2 Trillion",
      "Resource Exports GDP Share": "12.8%",
      "Primary Port Vol (Santos)": "140M Tons/yr",
      "Systemic Vulnerability": "LOW-MEDIUM (Climate dependence)"
    },
    aiInsights: [
      "Investing in high-yield smart-farming sensors and automation to counter cyclical weather fluctuations.",
      "Expanding Santos Port shipping corridors to increase direct container shipping routes to central Europe."
    ],
    relatedTopics: ["Coffee", "Trade Routes", "Agriculture", "Logistics"]
  },
  IN: {
    name: "India",
    overview: "India represents the fastest-growing major economy and service-tech hub, pacing global talent networks, software consulting, and scaling clean energy grids.",
    tradePartners: [
      "Exports: United States & UK (IT consulting, software services)",
      "Exports: Europe (processed agricultural products)",
      "Imports: China (solar panels, electronics component parts)",
      "Imports: Middle East (energy, crude oil)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$3.9 Trillion",
      "Service Exports Revenue": "$320B/yr",
      "Tech Talent Pool Size": "5.4 Million Engineers",
      "Systemic Vulnerability": "MEDIUM (Energy import dependency)"
    },
    aiInsights: [
      "Transitioning from software outsourcing to high-value AI model customization and fine-tuning clusters in Bangalore.",
      "Deploying the world's largest single-site renewable grids (Bhadla Solar Park) to secure energy independence."
    ],
    relatedTopics: ["Software Engineers", "AI Engineers", "Solar", "Coffee", "Tea", "Startups"]
  },
  DE: {
    name: "Germany",
    overview: "Germany operates as the industrial and logistical locomotive of Europe, leading advanced engineering, industrial machinery, and automotive manufacturing.",
    tradePartners: [
      "Exports: USA & China (luxury vehicles, precision machinery)",
      "Exports: EU Block (industrial automation grids)",
      "Imports: China & Taiwan (logic semiconductors, battery cells)",
      "Imports: Norway & Netherlands (energy, natural gas)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$4.5 Trillion",
      "Industrial Exports GDP Share": "38.2%",
      "Logistics Performance Index": "Top Tier (Hamburg Port)",
      "Systemic Vulnerability": "MEDIUM-HIGH (Energy price spikes)"
    },
    aiInsights: [
      "Subsidizing semiconductor fabs (Intel/TSMC) in Saxony to de-risk key automotive supply pipelines.",
      "Transitioning heavy steel and chemical grids to green hydrogen networks sourced from offshore North Sea grids."
    ],
    relatedTopics: ["Robotics", "Wind", "Software Engineers", "Semiconductors", "Coffee"]
  },
  GB: {
    name: "United Kingdom",
    overview: "The United Kingdom anchors European financial services and high-end research, hosting elite AI research institutions and a massive venture-backed startup cluster.",
    tradePartners: [
      "Exports: United States & EU (financial assets, fintech software, AI systems)",
      "Imports: Germany & USA (automotive hardware, machinery)",
      "Imports: Norway & Africa (energy, food commodities)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$3.2 Trillion",
      "Service Tech Sector Share": "12.5% of GDP",
      "AI Talent Density Index": "Top Tier (London DeepMind)",
      "Systemic Vulnerability": "MEDIUM (Supply chains post-Brexit)"
    },
    aiInsights: [
      "Capitalizing on academic spinouts to establish sovereign computing clusters and advanced biomedical models.",
      "Upgrading offshore wind capacity in the North Sea to lower industrial energy tariff footprints."
    ],
    relatedTopics: ["AI Engineers", "Startups", "Tea", "Semiconductors"]
  },
  JP: {
    name: "Japan",
    overview: "Japan acts as the precision engineering and hardware component supplier of the global tech economy, dominating industrial robotics, cleanroom equipment, and chemicals.",
    tradePartners: [
      "Exports: United States & China (automotive parts, robotics, silicon wafers)",
      "Imports: Middle East (petroleum, natural gas)",
      "Imports: Australia & Chile (raw copper, mineral ores)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$4.2 Trillion",
      "Precision Export Share": "20.5% of trade",
      "Robotics Export Share": "45% Global Total",
      "Systemic Vulnerability": "MEDIUM (Labor demographic contraction)"
    },
    aiInsights: [
      "Investing heavily in automation and factory floor humanoid helpers to offset domestic workforce shrinkage.",
      "Expanding advanced node packaging cleanrooms (Rapidus) to rebuild local semiconductor manufacturing."
    ],
    relatedTopics: ["Robotics", "Semiconductors", "Lithium"]
  },
  SG: {
    name: "Singapore",
    overview: "Singapore serves as the financial and logistical gateway to Southeast Asia, coordinating regional trade routes, startup ecosystems, and power-dense data hubs.",
    tradePartners: [
      "Exports: ASEAN countries (refined chemicals, microelectronics)",
      "Imports: Malaysia & Indonesia (energy, raw materials, food)",
      "Imports: United States & China (semiconductor devices, servers)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$500 Billion",
      "Trade to GDP Ratio": "320% (Highest globally)",
      "Maritime Shipping Load": "37M TEU containers",
      "Systemic Vulnerability": "LOW-MEDIUM (Land & cooling caps)"
    },
    aiInsights: [
      "Mandating energy efficiency targets and tropical cooling technologies to combat data center power limits.",
      "Scaling the Strait of Malacca maritime corridors to accommodate next-gen zero-emission ships."
    ],
    relatedTopics: ["Trade Routes", "Startups", "Data Centers", "Semiconductors"]
  },
  TW: {
    name: "Taiwan",
    overview: "Taiwan functions as the silicon anchor of global technology, operating as the single most critical logic node in the global semiconductor matrix.",
    tradePartners: [
      "Exports: United States (advanced microprocessors, $22B)",
      "Exports: China (logic semiconductors, $45B)",
      "Imports: Japan (photolithography equipment, chemical materials)",
      "Imports: Australia & USA (energy, raw silicon)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$800 Billion",
      "Semiconductor Rev Share": "62% of global total",
      "Advanced Logic Fab Share": "92% (sub-3nm chips)",
      "Systemic Vulnerability": "CRITICAL (Geopolitical risk)"
    },
    aiInsights: [
      "Transitioning sub-fab operations to Arizona and Germany to secure geographic redundancy.",
      "Subsidizing local design centers to move up the high-value software stack."
    ],
    relatedTopics: ["Semiconductors", "AI Engineers", "Lithium"]
  },
  KR: {
    name: "South Korea",
    overview: "South Korea acts as the global storage anchor, dominating memory fabrication pipelines essential for high-performance AI training.",
    tradePartners: [
      "Exports: China (memory modules for assembly, 40%)",
      "Exports: United States (datacenter memory arrays, 25%)",
      "Imports: Japan (silicon wafers, high-purity hydrogen fluoride)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$1.8 Trillion",
      "Global DRAM Fabs Share": "70% Market Share",
      "HBM Supply Share (SK Hynix)": "Highest (55%)",
      "Systemic Vulnerability": "MEDIUM-HIGH (Pricing cycles)"
    },
    aiInsights: [
      "Creating the 'Yongin Semiconductor Mega Cluster' ($470B investment) to centralize logic and memory.",
      "Pivoting into advanced foundry packaging services to compete with TSMC."
    ],
    relatedTopics: ["Semiconductors", "Lithium", "AI Engineers"]
  },
  CL: {
    name: "Chile",
    overview: "Chile represents the world's premier low-cost lithium brine reservoir, anchoring the global battery supply chain from the dry salt beds of the Atacama.",
    tradePartners: [
      "Exports: China (crude lithium carbonate concentrates, 68%)",
      "Exports: USA & Germany (refined battery-grade lithium)",
      "Imports: USA (heavy mining vehicles, machinery)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$300 Billion",
      "Global Lithium Reserves Share": "48%",
      "Annual Brine Output": "28k Tons LCE",
      "Systemic Vulnerability": "MEDIUM (Water & regulations)"
    },
    aiInsights: [
      "Mandating domestic cathode processing to move past simple raw material exports.",
      "Implementing direct lithium extraction (DLE) technologies to reduce water footprints."
    ],
    relatedTopics: ["Lithium", "Solar", "Trade Routes"]
  },
  AU: {
    name: "Australia",
    overview: "Australia stands as the premier hard-rock spodumene ore exporter, serving as the raw material supply engine for the Asia-Pacific refining axis.",
    tradePartners: [
      "Exports: China (spodumene concentrates, 90%)",
      "Exports: Japan & South Korea (iron ore, LNG)",
      "Imports: Germany & USA (industrial machinery, electrical grids)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$1.7 Trillion",
      "Global Spodumene Output Share": "42%",
      "Mining Capital Investment": "$35B",
      "Systemic Vulnerability": "LOW-MEDIUM (Over-reliance on China)"
    },
    aiInsights: [
      "Establishing localized chemical refineries in Kwinana to synthesize lithium hydroxide directly.",
      "Securing long-term strategic supply agreements with the US under the Inflation Reduction Act."
    ],
    relatedTopics: ["Lithium", "Solar", "Wind"]
  },
  VN: {
    name: "Vietnam",
    overview: "Vietnam is a rising electronics hub and major agricultural exporter, positioning itself as a key node in the 'China+1' supply chain diversification strategy.",
    tradePartners: [
      "Exports: United States (consumer electronics, coffee, textiles)",
      "Imports: China (electronic components, raw fabrics)",
      "Imports: South Korea (memory chips, panels)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$430 Billion",
      "Agriculture Export Share": "8.5%",
      "Electronics Export Growth": "+14% YoY",
      "Systemic Vulnerability": "MEDIUM (Infrastructure constraints)"
    },
    aiInsights: [
      "Pivoting from assembly to high-value chip packaging (OSAT) hubs backed by US technology partnerships.",
      "Upgrading Buon Ma Thuot coffee clusters with organic certification to capture high-margin European markets."
    ],
    relatedTopics: ["Coffee", "Startups", "Trade Routes"]
  },
  CO: {
    name: "Colombia",
    overview: "Colombia is a premier soft commodity exporter, known globally for high-grade Arabica coffee, oil, and mineral resources, anchoring Latin American trade pipelines.",
    tradePartners: [
      "Exports: United States (petroleum, coffee, flowers)",
      "Exports: China & Europe (coal, agricultural products)",
      "Imports: USA & China (telecoms hardware, chemical formulas)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$360 Billion",
      "Coffee Exports Vol": "14.3M Bags",
      "Resource Export GDP Share": "8.2%",
      "Systemic Vulnerability": "MEDIUM (Climate & logistics)"
    },
    aiInsights: [
      "Establishing coffee cooperatives with blockchain tracking to verify fair wages and climate-resilient farming.",
      "Expanding domestic solar micro-grids to secure agricultural processing operations from energy grid outages."
    ],
    relatedTopics: ["Coffee", "Solar", "Trade Routes"]
  },
  KE: {
    name: "Kenya",
    overview: "Kenya acts as the economic hub of East Africa, driving mobile financial services (M-Pesa) and agricultural exports like premium black tea and cut flowers.",
    tradePartners: [
      "Exports: UK & Pakistan (processed tea concentrates)",
      "Exports: EU (horticultural products)",
      "Imports: China (heavy rail transit, materials)",
      "Imports: India (pharmaceutical goods)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$110 Billion",
      "Tea Export Share": "Kenya is world's #1 exporter",
      "Fintech GDP Impact": "45% of transactions (M-Pesa)",
      "Systemic Vulnerability": "MEDIUM-HIGH (Debt to GDP index)"
    },
    aiInsights: [
      "Leveraging geothermal energy (Rift Valley) to power industrial-scale clean tea packaging and drying cleanrooms.",
      "Expanding Nairobi's 'Silicon Savannah' startup blocks to build regional mobile logistics frameworks."
    ],
    relatedTopics: ["Tea", "Startups", "Trade Routes"]
  },
  EG: {
    name: "Egypt",
    overview: "Egypt is a critical geopolitical trade corridor bridging Africa and Asia, operating the Suez Canal which channels over 12% of global shipping cargo.",
    tradePartners: [
      "Exports: Europe (LNG, agricultural products, textiles)",
      "Imports: Russia & Ukraine (wheat, agricultural grains)",
      "Imports: China (consumer hardware, grid materials)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$400 Billion",
      "Suez Canal Annual Revenue": "$9.4 Billion",
      "Suez Canal Traffic share": "12% of global trade",
      "Systemic Vulnerability": "HIGH (Regional security conflicts)"
    },
    aiInsights: [
      "Upgrading Suez Canal maritime surveillance and digital pilot logs to de-risk bottleneck delays.",
      "Developing green hydrogen fuel loading docks along the Suez canal path to supply next-gen green container ships."
    ],
    relatedTopics: ["Trade Routes", "Data Centers", "Solar"]
  },
  PA: {
    name: "Panama",
    overview: "Panama functions as the primary interoceanic transit hub of the Americas, operating the Panama Canal which coordinates massive trade flows between the Atlantic and Pacific oceans.",
    tradePartners: [
      "Exports: Global markets (shipping registry rights, financial services)",
      "Imports: USA & China (refined oil, electronics, machinery)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$83 Billion",
      "Canal Transit Share": "5% of global maritime trade",
      "Panama Canal Annual Revenue": "$4.9 Billion",
      "Systemic Vulnerability": "MEDIUM-HIGH (Freshwater draft limits)"
    },
    aiInsights: [
      "Constructing auxiliary water reservoirs in the Indio River basin to insulate canal drafts from El Niño droughts.",
      "Expanding the Colon Free Trade Zone into a tech assembly node for Latin American consumer electronics."
    ],
    relatedTopics: ["Trade Routes", "Startups", "Logistics"]
  },
  IE: {
    name: "Ireland",
    overview: "Ireland serves as the European operational headquarters for multinational tech and pharmaceutical giants, leveraging a low corporate tax structure and skilled talent pool.",
    tradePartners: [
      "Exports: United States & UK (organic chemicals, tech software)",
      "Imports: UK & Germany (machinery, automotive equipment)",
      "Imports: USA (telecoms servers, chip precursors)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$520 Billion",
      "Multinational GDP Share": "Over 50%",
      "Data Center Power Share": "21% of national grid",
      "Systemic Vulnerability": "MEDIUM (Tax regulation changes)"
    },
    aiInsights: [
      "Establishing direct data fiber cables to the US east coast to bypass post-Brexit UK nodes.",
      "Subsidizing corporate battery storage fields to balance massive data center grid power draws."
    ],
    relatedTopics: ["Data Centers", "Startups", "Software Engineers"]
  },
  ET: {
    name: "Ethiopia",
    overview: "Ethiopia is the historical birthplace of Arabica coffee and a major East African agricultural exporter, transitioning toward light manufacturing and clean hydroelectric grids.",
    tradePartners: [
      "Exports: China, Germany, Saudi Arabia (coffee, seeds, gold)",
      "Imports: China (rail transit, telecoms infrastructure)",
      "Imports: India (pharmaceuticals, chemicals)"
    ],
    keyMetrics: {
      "Sovereign GDP": "$160 Billion",
      "Coffee Export GDP Share": "5%",
      "Hydroelectric Grid Cap": "5.1 GW (GERD)",
      "Systemic Vulnerability": "MEDIUM-HIGH (Foreign exchange shortages)"
    },
    aiInsights: [
      "Deploying high-efficiency coffee sorting machinery to increase premium grade yields by 15%.",
      "Utilizing surplus power from the Grand Ethiopian Renaissance Dam (GERD) to run regional agro-processing hubs."
    ],
    relatedTopics: ["Coffee", "Trade Routes", "Agriculture"]
  }
};

export class CountryIntelEngine {
  // Generates dynamic, database-backed profile for clicked countries
  static async getProfile(countryId: string, searchQuery?: string): Promise<CountryResearchProfile | null> {
    await db.init();
    const cid = countryId.toUpperCase();
    
    // Load baseline data from map
    const baseline = BASELINE_DOSSIERS[cid];
    if (!baseline) return null;

    const profile: CountryResearchProfile = {
      id: cid,
      name: baseline.name,
      overview: baseline.overview,
      globalRanking: "N/A",
      growth: "Sovereign growth baseline",
      tradePartners: [...baseline.tradePartners],
      keyMetrics: { ...baseline.keyMetrics },
      aiInsights: [...baseline.aiInsights],
      relatedTopics: [...baseline.relatedTopics]
    };

    // If query is active, query IndexedDB / Supabase dynamically
    if (searchQuery && searchQuery.trim().length > 0) {
      const topicIntel = await DataIntelligenceEngine.getIntelligence(searchQuery);
      if (topicIntel) {
        const key = searchQuery.toLowerCase().trim();
        const topics = await db.getTopics();
        const activeTopic = topics.find(t => t.id === key || t.id.includes(key) || key.includes(t.id));
        const topicId = activeTopic ? activeTopic.id : "coffee";

        // 1. Fetch metric row for this country and topic
        const dbMetrics = await db.getCountryMetrics(topicId);
        const activeMetric = dbMetrics.find(m => m.country_id === cid);

        if (activeMetric) {
          // Dynamic override of dossier metrics
          profile.keyMetrics[`${topicIntel.query} Capacity`] = `${activeMetric.production_score} ${topicId === "coffee" ? "Million Bags" : topicId === "tea" ? "Thousand Tons" : topicId === "lithium" ? "k Tons LCE" : "GW Capacity"}`;
          profile.keyMetrics[`${topicIntel.query} Demand Rating`] = `${activeMetric.demand_score} / 100`;
          profile.keyMetrics[`${topicIntel.query} Exports`] = `$${activeMetric.export_score}M`;
          profile.keyMetrics[`${topicIntel.query} Imports`] = `$${activeMetric.import_score}M`;
          profile.keyMetrics[`${topicIntel.query} Opportunity`] = `${activeMetric.opportunity_score} / 100`;

          profile.growth = `Annualized ${topicIntel.query} growth is pacing at +${activeMetric.growth_score}% YoY.`;
          
          // Calculate dynamic global ranking in this topic network
          const sorted = [...dbMetrics].sort((a, b) => {
            const valA = a.production_score || a.demand_score;
            const valB = b.production_score || b.demand_score;
            return valB - valA;
          });
          const rankIdx = sorted.findIndex(m => m.country_id === cid);
          if (rankIdx !== -1) {
            profile.globalRanking = `#${rankIdx + 1} of ${sorted.length} active hubs in the global ${topicIntel.query} network`;
          }
        }

        // 2. Fetch trade route corridors for this country
        const dbRoutes = await db.getTradeRoutes(topicId);
        const countryCorridors = dbRoutes.filter(
          r => r.source_country === cid || r.destination_country === cid
        );
        if (countryCorridors.length > 0) {
          profile.tradePartners = countryCorridors.map((r) => {
            const isSource = r.source_country === cid;
            const direction = isSource ? "Export Route" : "Import Route";
            const partner = isSource ? r.dstName : r.srcName;
            return `${direction} to ${partner} (${r.volume})`;
          });
        }

        // 3. Fetch AIinsights from DB
        const dbInsights = await db.getCountryInsights(topicId, cid);
        if (dbInsights.length > 0) {
          profile.aiInsights = [...dbInsights.map(i => i.insight), ...profile.aiInsights];
        }

        // 4. Fetch related topics from DB
        const dbRelated = await db.getRelatedTopics(topicId);
        if (dbRelated.length > 0) {
          profile.relatedTopics = dbRelated.map(t => t.title);
        }
      }
    }

    return profile;
  }
}
