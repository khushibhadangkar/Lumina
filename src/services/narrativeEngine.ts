// Narrative & Scene Engine for Lumina Cinematic Interactive Documentaries
import { DataIntelligenceEngine } from "./dataEngine";

export interface NarrativeScene {
  title: string;
  narrative: string;
  lat: number;
  lon: number;
  zoom: number; // Zoom distance multiplier (e.g. 4.0 = close, 6.0 = medium, 8.5 = planet)
  globeMode: string; // "" (standard), "network", "split", "compare", "future"
  heatmapMode: string; // "production", "demand", "growth", "exports", "imports", "opportunity"
  timelineVal: number; // 0 (2026) to 50 (2076)
  highlightedHotspotId: string | null;
}

export interface CinematicJourney {
  query: string;
  name: string;
  scenes: NarrativeScene[];
}

const PRESET_STORIES: Record<string, CinematicJourney> = {
  semiconductors: {
    query: "Semiconductors",
    name: "Silicon Superpower Flow",
    scenes: [
      {
        title: "The Silicon Foundation",
        narrative: "Every modern technology, from consumer smartphones to artificial intelligence grids, relies on printed silicon. We start by observing the baseline of logic fabrication capacity, where computing power is concentrated along a tight global supply axis.",
        lat: 25.0,
        lon: 50.0,
        zoom: 6.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: null
      },
      {
        title: "The Hsinchu Nexus",
        narrative: "We fly to Hsinchu, Taiwan. Here, TSMC fabricates over 90% of the world's advanced sub-3nm logic chips. This tiny geographical hub forms the most critical technological foundation on Earth, operating on a delicate geopolitical fault line.",
        lat: 24.78,
        lon: 121.00,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "semi-tw"
      },
      {
        title: "The High-Bandwidth Vault",
        narrative: "We fly to Pyeongtaek, South Korea. Fabs here govern the memory pipeline. High-Bandwidth Memory (HBM) modules made by Samsung and SK Hynix are the crucial registers needed to feed processing units for deep learning models.",
        lat: 37.01,
        lon: 127.05,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "semi-kr"
      },
      {
        title: "Choke Points Unlocked",
        narrative: "Vulnerabilities emerge when we inspect the physical dependencies of silicon fabrication. Fabs cost billions and take years to calibrate. An disruption in the Taiwan Strait would immediately freeze global computing expansion. We split the Earth to examine its internal mechanical core, symbolizing structural dependency.",
        lat: 0,
        lon: 0,
        zoom: 5.0,
        globeMode: "split",
        heatmapMode: "opportunity",
        timelineVal: 15,
        highlightedHotspotId: null
      },
      {
        title: "The Geodistributed Horizon",
        narrative: "By 2076, global governments subsidize localized fabrications. We project a new R&D fab in Hillsboro, USA, alongside Arizona and European expansions, mapping out a diversified and resilient computing frontier.",
        lat: 45.52,
        lon: -122.98,
        zoom: 4.0,
        globeMode: "future",
        heatmapMode: "opportunity",
        timelineVal: 50,
        highlightedHotspotId: "semi-or"
      }
    ]
  },
  lithium: {
    query: "Lithium",
    name: "Lithium White Gold Route",
    scenes: [
      {
        title: "The Lithium Spark",
        narrative: "The global transition away from fossil fuels is bound to a single mineral: Lithium. Decarbonizing transportation relies heavily on massive increases in battery storage capacity. We begin our survey of the critical mineral chains powering the electric future.",
        lat: -10.0,
        lon: -40.0,
        zoom: 6.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: null
      },
      {
        title: "The Liquid Salt Beds",
        narrative: "We fly to the Atacama Basin in Chile. Surrounded by volcanic peaks, the salars hold the planet's largest, lowest-cost lithium reserves. Liquid brine is pumped to the surface to evaporate under intense sun, leaving behind highly concentrated lithium salts.",
        lat: -23.50,
        lon: -68.25,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "li-ch"
      },
      {
        title: "Hard Rock Mining",
        narrative: "We cross the Pacific to Greenbushes, Western Australia. Unlike Chile's liquid extraction, Australian supply is forged from hard-rock spodumene ore mines. Greenbushes produces premium ore concentrates shipped globally for processing.",
        lat: -33.85,
        lon: 116.05,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "li-wa"
      },
      {
        title: "The Refining Monopoly",
        narrative: "Although raw lithium is extracted in South America and Australia, 75% of chemical refining is centralized. Raw spodumene is shipped to hubs like Yichun, China, for synthesis into battery-grade chemical products, creating a centralized logistical bottleneck.",
        lat: 27.81,
        lon: 114.39,
        zoom: 4.2,
        globeMode: "compare",
        heatmapMode: "demand",
        timelineVal: 15,
        highlightedHotspotId: "li-cn"
      },
      {
        title: "Resilient Clay Reserves",
        narrative: "Projecting out to 2076, Western economies build local supply rings. Fledgling sites like Thacker Pass, USA, tap into massive clay beds, striving to create a diversified, independent battery production horizon.",
        lat: 41.70,
        lon: -118.05,
        zoom: 4.0,
        globeMode: "future",
        heatmapMode: "opportunity",
        timelineVal: 50,
        highlightedHotspotId: "li-nv"
      }
    ]
  },
  engineers: {
    query: "AI Engineers",
    name: "The Talent Migration Axis",
    scenes: [
      {
        title: "Intellectual Capitals",
        narrative: "The computational models of the future are not just built by hardware; they are guided by elite human talent. We examine the global labor concentration of AI researchers, showcasing a highly competitive intellectual topography.",
        lat: 30.0,
        lon: -20.0,
        zoom: 6.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: null
      },
      {
        title: "Silicon Valley Magnet",
        narrative: "We fly to San Francisco, USA. Silicon Valley hosts the highest density of elite machine learning engineers, absorbing over 45% of global tech migrations. The concentration here acts as a supermassive gravity well for technological venture capital.",
        lat: 37.77,
        lon: -122.41,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "ai-sf"
      },
      {
        title: "The London Laboratory",
        narrative: "We jump to London, United Kingdom. Home to core laboratories like Google DeepMind, London is a prime European focal point for advanced AI research, connecting academic research channels from Oxford and Cambridge.",
        lat: 51.50,
        lon: -0.12,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "ai-lon"
      },
      {
        title: "Upstream Talent Feeder",
        narrative: "We transition to Bangalore, India. While Silicon Valley and London manage model deployments, Bangalore represents the fastest growing technical engineering talent pool, expanding at 38% annually to build foundational software integrations.",
        lat: 12.97,
        lon: 77.59,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "growth",
        timelineVal: 10,
        highlightedHotspotId: "ai-blr"
      },
      {
        title: "The Global Brain Drain",
        narrative: "Looking ahead to 2076, remote AI development and decentralized open-source networks reshape traditional hubs. We observe talent dispersing into emerging systems, redefining national competitiveness and structural intelligence capabilities.",
        lat: 39.90,
        lon: 116.40,
        zoom: 4.0,
        globeMode: "future",
        heatmapMode: "opportunity",
        timelineVal: 50,
        highlightedHotspotId: "ai-bj"
      }
    ]
  },
  energy: {
    query: "Solar",
    name: "The Grid Decarbonization Journey",
    scenes: [
      {
        title: "The Great Transition",
        narrative: "Phasing out carbon energy requires scaling renewable power grids. We begin our documentary surveying global solar and wind capacities, the physical vectors of green transition.",
        lat: 30.0,
        lon: 10.0,
        zoom: 6.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: null
      },
      {
        title: "The Solar Heartland",
        narrative: "We descend to Gansu, China. This arid region hosts massive solar grid installations. Gansu leverages desert topography to generate over 180GW of clean energy capacity, supplying power to China's coastal industrial centers.",
        lat: 40.04,
        lon: 94.66,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "production",
        timelineVal: 0,
        highlightedHotspotId: "so-cn"
      },
      {
        title: "The Thar Solar Giant",
        narrative: "We fly to Bhadla, India. Favorable solar irradiance triggers the expansion of Bhadla Solar Park, one of the largest utility-scale solar farms in the world, expanding capacity at 32% annually.",
        lat: 27.35,
        lon: 72.18,
        zoom: 4.0,
        globeMode: "network",
        heatmapMode: "growth",
        timelineVal: 0,
        highlightedHotspotId: "so-in"
      },
      {
        title: "Import Dependencies",
        narrative: "We shift to California, USA. The California desert generates significant capacity, yet remains highly dependent on import corridors for panel manufacturing materials. We split the globe to analyze the energy supply imbalances.",
        lat: 34.05,
        lon: -118.24,
        zoom: 4.0,
        globeMode: "split",
        heatmapMode: "demand",
        timelineVal: 15,
        highlightedHotspotId: "so-us"
      },
      {
        title: "Resilient Renewables Horizon",
        narrative: "By 2076, advanced grid batteries and high-voltage DC lines link major solar grids across continents. We map out the future grid capacity reaching deep security and net-zero goals.",
        lat: 27.35,
        lon: 72.18,
        zoom: 4.2,
        globeMode: "future",
        heatmapMode: "opportunity",
        timelineVal: 50,
        highlightedHotspotId: "so-in"
      }
    ]
  }
};

export class NarrativeEngine {
  /**
   * Generates a 5-scene documentary narrative for any search query.
   * If a preset is available, it uses the preset.
   * Otherwise, it dynamically creates a journey using the data from the Data Engine.
   */
  static async getNarrativeJourney(query: string): Promise<CinematicJourney> {
    const cleanQuery = query.toLowerCase().trim();

    // 1. Check if we have pre-programmed presets
    if (cleanQuery.includes("semiconductor") || cleanQuery.includes("chip")) {
      return PRESET_STORIES.semiconductors;
    }
    if (cleanQuery.includes("lithium") || cleanQuery.includes("battery")) {
      return PRESET_STORIES.lithium;
    }
    if (cleanQuery.includes("engineer") || cleanQuery.includes("talent") || cleanQuery.includes("ai")) {
      return PRESET_STORIES.engineers;
    }
    if (cleanQuery.includes("energy") || cleanQuery.includes("solar") || cleanQuery.includes("wind") || cleanQuery.includes("renew")) {
      return PRESET_STORIES.energy;
    }

    // 2. Dynamic Fallback Narratives
    // Fetch payload from the DataIntelligenceEngine
    const payload = (await DataIntelligenceEngine.getIntelligence(query)) || (await DataIntelligenceEngine.getIntelligence("coffee"))!;
    const name = `${payload.query} Global Matrix`;
    const hotspots = payload.hotspots;
    
    // Fallback coordinates if no hotspots exist
    const h1 = hotspots[0] || { lat: 20, lon: 0, name: "Global Hub", id: null };
    const h2 = hotspots[1] || hotspots[0] || { lat: 40, lon: -70, name: "Consumer Hub", id: null };
    const h3 = hotspots[hotspots.length - 1] || hotspots[0] || { lat: 10, lon: 100, name: "Growth Node", id: null };

    return {
      query: payload.query,
      name,
      scenes: [
        {
          title: `01 // The Global ${payload.query} Matrix`,
          narrative: `We begin our cinematic investigation into the global networks of ${payload.query}. Valued at ${payload.overview.marketSize}, this market operates via trade lanes linking raw hubs to demand centers.`,
          lat: 20,
          lon: 0,
          zoom: 6.0,
          globeMode: "network",
          heatmapMode: "production",
          timelineVal: 0,
          highlightedHotspotId: null
        },
        {
          title: `02 // Primary Supply Anchor`,
          narrative: `We fly directly to ${h1.name}. This geographic location represents a vital supply anchor for the ${payload.query} ecosystem, pacing international prices and supply consistency.`,
          lat: h1.lat,
          lon: h1.lon,
          zoom: 4.0,
          globeMode: "network",
          heatmapMode: "production",
          timelineVal: 0,
          highlightedHotspotId: h1.id
        },
        {
          title: `03 // Demand Terminus`,
          narrative: `We transition to the consumer center at ${h2.name}. Here, massive demand drives imports valued in the millions, drawing trade lanes across the oceans to sustain consumption levels.`,
          lat: h2.lat,
          lon: h2.lon,
          zoom: 4.0,
          globeMode: "network",
          heatmapMode: "demand",
          timelineVal: 0,
          highlightedHotspotId: h2.id
        },
        {
          title: `04 // Interdependent Core`,
          narrative: `Splitting the hemispheres reveals the internal structure of this global resource matrix. Supply networks are fragile, susceptible to shipping corridor blocks and labor shifts.`,
          lat: 0,
          lon: 0,
          zoom: 5.0,
          globeMode: "split",
          heatmapMode: "exports",
          timelineVal: 15,
          highlightedHotspotId: null
        },
        {
          title: `05 // Emerging Frontiers`,
          narrative: `Looking out to the year 2076, timeline forecasts indicate major shifts. New growth hotspots like ${h3.name} gain strategic prominence, shaping the future layout of the ${payload.query} trade network.`,
          lat: h3.lat,
          lon: h3.lon,
          zoom: 4.0,
          globeMode: "future",
          heatmapMode: "opportunity",
          timelineVal: 50,
          highlightedHotspotId: h3.id
        }
      ]
    };
  }
}
