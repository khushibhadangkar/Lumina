// Lumina Relational Database Layer
// Supports falling back from Supabase (PostgreSQL) to a browser-local IndexedDB.

export interface Country {
  id: string; // ISO 2-letter
  name: string;
  iso_code: string; // ISO 3-letter
  latitude: number;
  longitude: number;
  region: string;
}

export interface Topic {
  id: string; // slug e.g. "coffee"
  title: string;
  market_size: string;
  growth_rate: string;
  trade_volume: string;
  source: string;
}

export interface CountryMetric {
  country_id: string;
  topic_id: string;
  production_score: number;
  demand_score: number;
  growth_score: number;
  import_score: number;
  export_score: number;
  opportunity_score: number;
  summary: string;
}

export interface TradeRoute {
  id: string;
  source_country: string; // country_id
  destination_country: string; // country_id
  volume: string;
  topic_id: string;
}

export interface CountryInsight {
  id: string;
  country_id: string;
  topic_id: string;
  insight: string;
}

export interface RelatedTopic {
  topic_id: string;
  related_topic_id: string;
}

// -----------------------------------------------------------------------------
// SEED DATA
// -----------------------------------------------------------------------------

const SEED_COUNTRIES: Country[] = [
  { id: "US", name: "United States", iso_code: "USA", latitude: 37.0902, longitude: -95.7129, region: "North America" },
  { id: "CN", name: "China", iso_code: "CHN", latitude: 35.8617, longitude: 104.1954, region: "East Asia" },
  { id: "BR", name: "Brazil", iso_code: "BRA", latitude: -14.2350, longitude: -51.9253, region: "South America" },
  { id: "IN", name: "India", iso_code: "IND", latitude: 20.5937, longitude: 78.9629, region: "South Asia" },
  { id: "DE", name: "Germany", iso_code: "DEU", latitude: 51.1657, longitude: 10.4515, region: "Western Europe" },
  { id: "GB", name: "United Kingdom", iso_code: "GBR", latitude: 55.3781, longitude: -3.4360, region: "Western Europe" },
  { id: "JP", name: "Japan", iso_code: "JPN", latitude: 36.2048, longitude: 138.2529, region: "East Asia" },
  { id: "SG", name: "Singapore", iso_code: "SGP", latitude: 1.3521, longitude: 103.8198, region: "Southeast Asia" },
  { id: "TW", name: "Taiwan", iso_code: "TWN", latitude: 23.6978, longitude: 120.9605, region: "East Asia" },
  { id: "KR", name: "South Korea", iso_code: "KOR", latitude: 35.9078, longitude: 127.7669, region: "East Asia" },
  { id: "CL", name: "Chile", iso_code: "CHL", latitude: -35.6751, longitude: -71.5430, region: "South America" },
  { id: "AU", name: "Australia", iso_code: "AUS", latitude: -25.2744, longitude: 133.7751, region: "Oceania" },
  { id: "VN", name: "Vietnam", iso_code: "VNM", latitude: 14.0583, longitude: 108.2772, region: "Southeast Asia" },
  { id: "CO", name: "Colombia", iso_code: "COL", latitude: 4.5709, longitude: -74.2973, region: "South America" },
  { id: "KE", name: "Kenya", iso_code: "KEN", latitude: -0.0236, longitude: 37.9062, region: "East Africa" },
  { id: "EG", name: "Egypt", iso_code: "EGY", latitude: 26.8206, longitude: 30.8025, region: "North Africa" },
  { id: "PA", name: "Panama", iso_code: "PAN", latitude: 8.5380, longitude: -80.7821, region: "Central America" },
  { id: "IE", name: "Ireland", iso_code: "IRL", latitude: 53.4129, longitude: -8.2439, region: "Western Europe" },
  { id: "ET", name: "Ethiopia", iso_code: "ETH", latitude: 9.1450, longitude: 40.4897, region: "East Africa" }
];

const SEED_TOPICS: Topic[] = [
  { id: "coffee", title: "Coffee", market_size: "$126.4 Billion", growth_rate: "4.8% CAGR", trade_volume: "148.2 Million Bags (60kg)", source: "WTO Trade Database & UN FAO" },
  { id: "tea", title: "Tea", market_size: "$49.2 Billion", growth_rate: "5.5% CAGR", trade_volume: "2.1 Million Metric Tons", source: "UN FAO & WTO Agri-Core" },
  { id: "lithium", title: "Lithium", market_size: "$48.3 Billion", growth_rate: "22.4% CAGR", trade_volume: "780k LCE Tons", source: "USGS & International Energy Agency" },
  { id: "solar", title: "Solar", market_size: "$220.5 Billion", growth_rate: "16.2% CAGR", trade_volume: "420 Gigawatts Installed", source: "IEA Renewable Energy Core" },
  { id: "wind", title: "Wind", market_size: "$145.8 Billion", growth_rate: "11.8% CAGR", trade_volume: "115 Gigawatts Installed", source: "Global Wind Energy Council & IEA" },
  { id: "ai-engineers", title: "AI Engineers", market_size: "$28.4 Billion", growth_rate: "28.5% CAGR", trade_volume: "420,000 Professionals", source: "OECD Labor Stats & Crunchbase Talent Index" },
  { id: "software-engineers", title: "Software Engineers", market_size: "$180.2 Billion", growth_rate: "6.2% CAGR", trade_volume: "26.4 Million Professionals", source: "OECD Labor Data" },
  { id: "semiconductors", title: "Semiconductors", market_size: "$580.4 Billion", growth_rate: "8.2% CAGR", trade_volume: "1.15 Trillion Units Shipped", source: "WTO & Semiconductor Industry Association" },
  { id: "robotics", title: "Robotics", market_size: "$72.4 Billion", growth_rate: "10.5% CAGR", trade_volume: "580k Industrial Units Shipped", source: "IFR Robotics Survey & World Bank Index" },
  { id: "startups", title: "Startups", market_size: "$3.8 Trillion Val.", growth_rate: "12.4% CAGR", trade_volume: "$415B VC Funding Yearly", source: "Crunchbase Funding Index & OECD Startup Core" },
  { id: "data-centers", title: "Data Centers", market_size: "$310.2 Billion", growth_rate: "18.5% CAGR", trade_volume: "24 Gigawatts Power Load", source: "IEA Data & Crunchbase Infrastructure Core" },
  { id: "trade-routes", title: "Trade Routes", market_size: "$12.4 Trillion Trade Value", growth_rate: "3.2% CAGR", trade_volume: "11.2 Billion Tons Transported", source: "WTO & UNCTAD Logistics Core" }
];

const SEED_METRICS: CountryMetric[] = [
  // Coffee
  { country_id: "BR", topic_id: "coffee", production_score: 58.0, demand_score: 20, growth_score: 1.8, export_score: 4600, import_score: 0, opportunity_score: 45, summary: "Santos Port (Brazil) Coffee Supply: Brazil controls 38% of global coffee production, serving as the system's baseline supply anchor." },
  { country_id: "VN", topic_id: "coffee", production_score: 29.0, demand_score: 10, growth_score: 5.2, export_score: 2800, import_score: 0, opportunity_score: 60, summary: "Buon Ma Thuot (Vietnam) Coffee Supply: Vietnam leads Robusta exports, exhibiting the fastest production growth of 5.2% annually." },
  { country_id: "ET", topic_id: "coffee", production_score: 7.4, demand_score: 5, growth_score: 3.4, export_score: 980, import_score: 0, opportunity_score: 72, summary: "Kaffa Highlands (Ethiopia) Coffee Supply: High quality Arabica output, supporting large domestic employment." },
  { country_id: "CO", topic_id: "coffee", production_score: 14.3, demand_score: 8, growth_score: 2.1, export_score: 1800, import_score: 0, opportunity_score: 50, summary: "Eje Cafetero (Colombia) Coffee Supply: Colombian premium washing beans anchor quality indicators." },
  { country_id: "US", topic_id: "coffee", production_score: 0.0, demand_score: 95, growth_score: 2.4, export_score: 0, import_score: 5800, opportunity_score: 30, summary: "New York Port (USA) Coffee Demand: Massive consumer base driving imports, primarily green beans." },
  { country_id: "DE", topic_id: "coffee", production_score: 0.0, demand_score: 85, growth_score: 1.1, export_score: 0, import_score: 3200, opportunity_score: 25, summary: "Hamburg Port (Germany) Coffee Demand: European gateway port, processing and re-exporting to central EU." },
  { country_id: "IN", topic_id: "coffee", production_score: 5.3, demand_score: 42, growth_score: 8.4, export_score: 450, import_score: 20, opportunity_score: 90, summary: "Bangalore (India) Coffee Opportunity: Fast expanding urban cafe networks and robust regional growth." },

  // Tea
  { country_id: "CN", topic_id: "tea", production_score: 1250.0, demand_score: 90, growth_score: 6.4, export_score: 1800, import_score: 0, opportunity_score: 50, summary: "Fujian Province (China) Tea Supply: China accounts for over 45% of global tea production, focusing on premium oolong." },
  { country_id: "IN", topic_id: "tea", production_score: 650.0, demand_score: 85, growth_score: 4.1, export_score: 720, import_score: 0, opportunity_score: 55, summary: "Assam Valley (India) Tea Supply: Produces rich black teas, powering domestic consumption and export slots." },
  { country_id: "KE", topic_id: "tea", production_score: 480.0, demand_score: 12, growth_score: 3.8, export_score: 950, import_score: 0, opportunity_score: 70, summary: "Kericho (Kenya) Tea Supply: World's leading exporter of black tea, driving global commercial blending pipelines." },
  { country_id: "GB", topic_id: "tea", production_score: 0.0, demand_score: 80, growth_score: -0.5, export_score: 0, import_score: 420, opportunity_score: 10, summary: "London (United Kingdom) Tea Demand: High dependency on imports, though coffee imports are growing faster." },

  // Lithium
  { country_id: "CL", topic_id: "lithium", production_score: 28.0, demand_score: 5, growth_score: 12.0, export_score: 1800, import_score: 0, opportunity_score: 80, summary: "Atacama Basin (Chile): Possesses largest low-cost brine reserves, generating 28% of refined lithium carbonate." },
  { country_id: "AU", topic_id: "lithium", production_score: 42.0, demand_score: 5, growth_score: 8.5, export_score: 2400, import_score: 0, opportunity_score: 65, summary: "Greenbushes (Australia): Anchors supply through hard-rock spodumene ore, routing raw concentrates to China." },
  { country_id: "US", topic_id: "lithium", production_score: 2.0, demand_score: 75, growth_score: 45.0, export_score: 0, import_score: 980, opportunity_score: 95, summary: "Thacker Pass (USA): Fast forecast growth driven by domestic security mandates and IRA subsidies." },
  { country_id: "CN", topic_id: "lithium", production_score: 18.0, demand_score: 98, growth_score: 26.0, export_score: 300, import_score: 3200, opportunity_score: 88, summary: "Yichun (China): Dominates chemical synthesis, importing raw mineral ore to feed battery cell gigafactories." },

  // Semiconductors
  { country_id: "TW", topic_id: "semiconductors", production_score: 92.0, demand_score: 25, growth_score: 9.8, export_score: 18500, import_score: 0, opportunity_score: 85, summary: "Hsinchu (Taiwan): TSMC fabricates over 90% of advanced sub-3nm logic chips, creating a single geopolitical point of dependency." },
  { country_id: "KR", topic_id: "semiconductors", production_score: 78.0, demand_score: 30, growth_score: 8.2, export_score: 14200, import_score: 0, opportunity_score: 80, summary: "Pyeongtaek (South Korea): Memory fabrication pipelines essential for high-performance training grids." },
  { country_id: "US", topic_id: "semiconductors", production_score: 32.0, demand_score: 95, growth_score: 12.5, export_score: 400, import_score: 12800, opportunity_score: 90, summary: "Hillsboro (USA): R&D Fabs and advanced designs driving massive localized CHIPS Act construction projects." },
  { country_id: "CN", topic_id: "semiconductors", production_score: 15.0, demand_score: 98, growth_score: 14.0, export_score: 2200, import_score: 19800, opportunity_score: 75, summary: "Shenzhen (China): Device assembly centers requiring import corridors for advanced nodes." },

  // AI Talent
  { country_id: "US", topic_id: "ai-engineers", production_score: 185.0, demand_score: 98, growth_score: 22.0, export_score: 0, import_score: 4200, opportunity_score: 85, summary: "Silicon Valley (USA): Hosts 185k AI engineers, the largest talent pool, absorbing 45% of global migrations." },
  { country_id: "GB", topic_id: "ai-engineers", production_score: 42.0, demand_score: 88, growth_score: 15.0, export_score: 300, import_score: 1200, opportunity_score: 80, summary: "London DeepMind (UK): Advanced research core spinouts connected to Cambridge/Oxford pipelines." },
  { country_id: "CN", topic_id: "ai-engineers", production_score: 128.0, demand_score: 92, growth_score: 24.0, export_score: 0, import_score: 200, opportunity_score: 75, summary: "Beijing Cluster (China): Large model developers training models with localized data loops." },
  { country_id: "IN", topic_id: "ai-engineers", production_score: 76.0, demand_score: 60, growth_score: 38.0, export_score: 1800, import_score: 0, opportunity_score: 95, summary: "Bangalore Hub (India): Fast growth, transitioning from IT service codebases to model integration." },

  // Solar
  { country_id: "CN", topic_id: "solar", production_score: 180.0, demand_score: 85, growth_score: 24.0, export_score: 4200, import_score: 0, opportunity_score: 78, summary: "Gansu Solar Grid (China): Large desert grid installations producing clean energy alongside panel manufacture." },
  { country_id: "US", topic_id: "solar", production_score: 48.0, demand_score: 92, growth_score: 18.0, export_score: 0, import_score: 2200, opportunity_score: 85, summary: "California Desert (USA): High solar density panels drawing utility-scale import agreements." },
  { country_id: "IN", topic_id: "solar", production_score: 36.0, demand_score: 75, growth_score: 32.0, export_score: 10, import_score: 1800, opportunity_score: 92, summary: "Bhadla Park (India): Largest single-site facility expanding at 32% annually." },

  // Wind
  { country_id: "GB", topic_id: "wind", production_score: 28.0, demand_score: 90, growth_score: 14.5, export_score: 120, import_score: 3400, opportunity_score: 85, summary: "Dogger Bank (UK): World's largest offshore wind farm under development, pushing massive domestic supply." },
  { country_id: "CN", topic_id: "wind", production_score: 310.0, demand_score: 85, growth_score: 18.0, export_score: 5200, import_score: 0, opportunity_score: 80, summary: "Gansu Wind Farm (China): Massive onshore installations and dominant turbine manufacturing exporter." },
  { country_id: "DE", topic_id: "wind", production_score: 65.0, demand_score: 88, growth_score: 6.2, export_score: 1800, import_score: 450, opportunity_score: 75, summary: "North Sea Grid (Germany): Established wind infrastructure transitioning to next-generation offshore." },
  { country_id: "US", topic_id: "wind", production_score: 140.0, demand_score: 92, growth_score: 11.5, export_score: 400, import_score: 1200, opportunity_score: 88, summary: "Texas Wind Corridor (USA): Leads US onshore production with rapid grid integrations." },

  // Software Engineers
  { country_id: "US", topic_id: "software-engineers", production_score: 420.0, demand_score: 98, growth_score: 8.5, export_score: 0, import_score: 12500, opportunity_score: 92, summary: "Silicon Valley (USA): Highest concentration of software engineering talent globally, driving immense domestic demand." },
  { country_id: "IN", topic_id: "software-engineers", production_score: 580.0, demand_score: 65, growth_score: 14.2, export_score: 38000, import_score: 0, opportunity_score: 95, summary: "Bangalore (India): Primary global exporter of software development services and engineering talent." },
  { country_id: "IE", topic_id: "software-engineers", production_score: 45.0, demand_score: 85, growth_score: 12.0, export_score: 500, import_score: 2100, opportunity_score: 82, summary: "Dublin Hub (Ireland): European headquarters for major tech firms, importing regional talent." },
  { country_id: "GB", topic_id: "software-engineers", production_score: 110.0, demand_score: 88, growth_score: 6.4, export_score: 800, import_score: 1500, opportunity_score: 78, summary: "London (UK): Top European ecosystem for fintech software engineering." },

  // Robotics
  { country_id: "JP", topic_id: "robotics", production_score: 185.0, demand_score: 75, growth_score: 8.4, export_score: 14200, import_score: 120, opportunity_score: 70, summary: "Yaskawa/Fanuc (Japan): Global leader in industrial robotics manufacturing and exports." },
  { country_id: "DE", topic_id: "robotics", production_score: 95.0, demand_score: 82, growth_score: 6.5, export_score: 8500, import_score: 2100, opportunity_score: 65, summary: "KUKA Hub (Germany): Advanced industrial automation driving European automotive manufacturing." },
  { country_id: "CN", topic_id: "robotics", production_score: 120.0, demand_score: 98, growth_score: 22.5, export_score: 3400, import_score: 15800, opportunity_score: 88, summary: "Shenzhen (China): Rapid domestic adoption and growing production of consumer and industrial robots." },
  { country_id: "KR", topic_id: "robotics", production_score: 85.0, demand_score: 92, growth_score: 12.0, export_score: 4200, import_score: 1800, opportunity_score: 75, summary: "Seoul (South Korea): Highest robot density per manufacturing worker globally." },
  { country_id: "US", topic_id: "robotics", production_score: 65.0, demand_score: 95, growth_score: 18.2, export_score: 2100, import_score: 6800, opportunity_score: 90, summary: "Boston Robotics (USA): Innovation leader in advanced dynamic and AI-driven robotics." },

  // Startups
  { country_id: "US", topic_id: "startups", production_score: 350.0, demand_score: 98, growth_score: 12.5, export_score: 45000, import_score: 0, opportunity_score: 95, summary: "Silicon Valley / NY (USA): Dominant global startup ecosystem with highest unicorn density and VC volume." },
  { country_id: "CN", topic_id: "startups", production_score: 180.0, demand_score: 85, growth_score: 15.0, export_score: 12000, import_score: 0, opportunity_score: 82, summary: "Beijing/Shenzhen (China): Massive domestic market driving rapid scaling of tech startups." },
  { country_id: "GB", topic_id: "startups", production_score: 85.0, demand_score: 80, growth_score: 10.5, export_score: 8500, import_score: 2400, opportunity_score: 85, summary: "London (UK): Leading European fintech and AI startup ecosystem." },
  { country_id: "SG", topic_id: "startups", production_score: 45.0, demand_score: 75, growth_score: 18.0, export_score: 4200, import_score: 1800, opportunity_score: 88, summary: "Singapore Hub (SG): Primary launchpad and funding center for Southeast Asian startups." },
  { country_id: "IN", topic_id: "startups", production_score: 110.0, demand_score: 88, growth_score: 24.5, export_score: 6800, import_score: 0, opportunity_score: 92, summary: "Bangalore (India): Fastest growing major startup ecosystem with surging SaaS and edtech sectors." },

  // Data Centers
  { country_id: "US", topic_id: "data-centers", production_score: 420.0, demand_score: 98, growth_score: 18.5, export_score: 12000, import_score: 5400, opportunity_score: 95, summary: "Ashburn VA (USA): 'Data Center Alley' handling massive global internet traffic and cloud infrastructure." },
  { country_id: "IE", topic_id: "data-centers", production_score: 85.0, demand_score: 82, growth_score: 15.0, export_score: 4500, import_score: 1200, opportunity_score: 78, summary: "Dublin (Ireland): European hyperscale hub drawn by climate and tech policies." },
  { country_id: "SG", topic_id: "data-centers", production_score: 55.0, demand_score: 90, growth_score: 12.5, export_score: 3200, import_score: 800, opportunity_score: 82, summary: "APAC Hub (Singapore): High-density data center infrastructure serving Southeast Asia." },
  { country_id: "AU", topic_id: "data-centers", production_score: 45.0, demand_score: 75, growth_score: 14.0, export_score: 1800, import_score: 600, opportunity_score: 80, summary: "Sydney (Australia): Growing regional cloud hub powered by renewable energy transitions." },

  // Trade Routes
  { country_id: "CN", topic_id: "trade-routes", production_score: 450.0, demand_score: 95, growth_score: 8.5, export_score: 280000, import_score: 180000, opportunity_score: 88, summary: "Shanghai/Ningbo (China): World's busiest container ports driving global maritime exports." },
  { country_id: "SG", topic_id: "trade-routes", production_score: 380.0, demand_score: 90, growth_score: 6.2, export_score: 150000, import_score: 145000, opportunity_score: 85, summary: "Port of Singapore (SG): Critical global transshipment hub connecting East and West." },
  { country_id: "US", topic_id: "trade-routes", production_score: 210.0, demand_score: 98, growth_score: 5.5, export_score: 85000, import_score: 240000, opportunity_score: 82, summary: "LA/Long Beach (USA): Primary entry point for trans-Pacific maritime imports." },
  { country_id: "PA", topic_id: "trade-routes", production_score: 150.0, demand_score: 85, growth_score: 4.8, export_score: 12000, import_score: 10000, opportunity_score: 75, summary: "Panama Canal (Panama): Strategic maritime chokepoint connecting Atlantic and Pacific oceans." },
  { country_id: "EG", topic_id: "trade-routes", production_score: 140.0, demand_score: 88, growth_score: 5.2, export_score: 8000, import_score: 12000, opportunity_score: 78, summary: "Suez Canal (Egypt): Crucial shortcut for Europe-Asia maritime trade routes." }
];

const SEED_ROUTES: TradeRoute[] = [
  // Coffee
  { id: "route-cf-1", source_country: "BR", destination_country: "US", volume: "18.4M Bags", topic_id: "coffee" },
  { id: "route-cf-2", source_country: "BR", destination_country: "DE", volume: "14.2M Bags", topic_id: "coffee" },
  { id: "route-cf-3", source_country: "VN", destination_country: "DE", volume: "9.8M Bags", topic_id: "coffee" },
  { id: "route-cf-4", source_country: "CO", destination_country: "US", volume: "7.1M Bags", topic_id: "coffee" },

  // Tea
  { id: "route-te-1", source_country: "CN", destination_country: "GB", volume: "120k Tons", topic_id: "tea" },
  { id: "route-te-2", source_country: "KE", destination_country: "GB", volume: "185k Tons", topic_id: "tea" },

  // Lithium
  { id: "route-li-1", source_country: "AU", destination_country: "CN", volume: "32k Tons LCE", topic_id: "lithium" },
  { id: "route-li-2", source_country: "CL", destination_country: "CN", volume: "22k Tons LCE", topic_id: "lithium" },

  // Semiconductors
  { id: "route-sm-1", source_country: "TW", destination_country: "US", volume: "$22B Chips", topic_id: "semiconductors" },
  { id: "route-sm-2", source_country: "TW", destination_country: "CN", volume: "$45B Chips", topic_id: "semiconductors" },
  { id: "route-sm-3", source_country: "KR", destination_country: "CN", volume: "$28B Memory", topic_id: "semiconductors" },

  // AI Engineers
  { id: "route-ai-1", source_country: "IN", destination_country: "US", volume: "Talent Migration", topic_id: "ai-engineers" },
  { id: "route-ai-2", source_country: "GB", destination_country: "US", volume: "Research Pipeline", topic_id: "ai-engineers" },

  // Solar
  { id: "route-so-1", source_country: "CN", destination_country: "US", volume: "12 GW Panels", topic_id: "solar" },
  { id: "route-so-2", source_country: "CN", destination_country: "IN", volume: "8 GW Panels", topic_id: "solar" },

  // Wind
  { id: "route-wi-1", source_country: "CN", destination_country: "DE", volume: "2.4 GW Turbines", topic_id: "wind" },
  { id: "route-wi-2", source_country: "CN", destination_country: "US", volume: "1.8 GW Parts", topic_id: "wind" },
  { id: "route-wi-3", source_country: "DE", destination_country: "GB", volume: "1.2 GW Components", topic_id: "wind" },

  // Software Engineers
  { id: "route-se-1", source_country: "IN", destination_country: "US", volume: "Outsourcing & Migration", topic_id: "software-engineers" },
  { id: "route-se-2", source_country: "IN", destination_country: "GB", volume: "Talent Pipeline", topic_id: "software-engineers" },
  { id: "route-se-3", source_country: "IE", destination_country: "US", volume: "Corporate Integration", topic_id: "software-engineers" },

  // Robotics
  { id: "route-ro-1", source_country: "JP", destination_country: "CN", volume: "45k Industrial Units", topic_id: "robotics" },
  { id: "route-ro-2", source_country: "DE", destination_country: "US", volume: "18k Auto-Robots", topic_id: "robotics" },
  { id: "route-ro-3", source_country: "KR", destination_country: "CN", volume: "12k Logic Units", topic_id: "robotics" },

  // Startups
  { id: "route-st-1", source_country: "US", destination_country: "GB", volume: "$8.5B VC Flow", topic_id: "startups" },
  { id: "route-st-2", source_country: "US", destination_country: "IN", volume: "$12.4B VC Flow", topic_id: "startups" },
  { id: "route-st-3", source_country: "SG", destination_country: "IN", volume: "$4.2B Capital Route", topic_id: "startups" },

  // Data Centers
  { id: "route-dc-1", source_country: "TW", destination_country: "US", volume: "Servers & Hardware", topic_id: "data-centers" },
  { id: "route-dc-2", source_country: "US", destination_country: "IE", volume: "Cloud Expansion", topic_id: "data-centers" },
  { id: "route-dc-3", source_country: "CN", destination_country: "SG", volume: "APAC Infrastructure", topic_id: "data-centers" },

  // Trade Routes
  { id: "route-tr-1", source_country: "CN", destination_country: "US", volume: "Trans-Pacific Route", topic_id: "trade-routes" },
  { id: "route-tr-2", source_country: "CN", destination_country: "SG", volume: "South China Sea Route", topic_id: "trade-routes" },
  { id: "route-tr-3", source_country: "SG", destination_country: "EG", volume: "Indian Ocean Route", topic_id: "trade-routes" },
  { id: "route-tr-4", source_country: "EG", destination_country: "DE", volume: "Mediterranean Route", topic_id: "trade-routes" }
];

const SEED_INSIGHTS: CountryInsight[] = [
  // Semiconductors
  { id: "ins-sm-1", country_id: "TW", topic_id: "semiconductors", insight: "TSMC (Taiwan) fabricates over 90% of advanced sub-3nm logic chips, creating a single geopolitical point of failure." },
  { id: "ins-sm-2", country_id: "CN", topic_id: "semiconductors", insight: "China consumes over 40% of global output, routing imported chips into assembled exports (smartphones, EVs)." },
  { id: "ins-sm-3", country_id: "US", topic_id: "semiconductors", insight: "Domestic CHIPS Act funding drives US fab builds (Oregon/Arizona), targeting 12.5% production growth." },

  // Coffee
  { id: "ins-cf-1", country_id: "BR", topic_id: "coffee", insight: "Brazil controls 38% of global coffee production, serving as the system's baseline supply anchor." },
  { id: "ins-cf-2", country_id: "VN", topic_id: "coffee", insight: "Vietnam leads Robusta exports, exhibiting the fastest production growth of 5.2% annually." },
  { id: "ins-cf-3", country_id: "DE", topic_id: "coffee", insight: "Germany acts as a massive re-export gateway, importing more green beans than it produces, processing and routing to central Europe." },
  { id: "ins-cf-4", country_id: "IN", topic_id: "coffee", insight: "India shows the highest demand surge, driven by urban cafe networks expanding at 8.4% yearly." },

  // Wind
  { id: "ins-wi-1", country_id: "CN", topic_id: "wind", insight: "China dominates wind turbine manufacturing and onshore installations." },
  { id: "ins-wi-2", country_id: "GB", topic_id: "wind", insight: "The UK is heavily investing in North Sea offshore wind infrastructure." },

  // Software Engineers
  { id: "ins-se-1", country_id: "US", topic_id: "software-engineers", insight: "Silicon Valley remains the global center for high-value software engineering." },
  { id: "ins-se-2", country_id: "IN", topic_id: "software-engineers", insight: "India provides the largest volume of software development talent globally." },

  // Robotics
  { id: "ins-ro-1", country_id: "JP", topic_id: "robotics", insight: "Japan leads the world in industrial robotics exports, supplying global manufacturing." },
  { id: "ins-ro-2", country_id: "KR", topic_id: "robotics", insight: "South Korea maintains the highest robot density in its manufacturing sector." },

  // Startups
  { id: "ins-st-1", country_id: "US", topic_id: "startups", insight: "US VC capital heavily funds both domestic startups and international expansion." },
  { id: "ins-st-2", country_id: "IN", topic_id: "startups", insight: "India's startup ecosystem is rapidly expanding, producing numerous tech unicorns." },

  // Data Centers
  { id: "ins-dc-1", country_id: "US", topic_id: "data-centers", insight: "Virginia's Data Center Alley is the central node for global internet traffic." },
  { id: "ins-dc-2", country_id: "IE", topic_id: "data-centers", insight: "Dublin serves as the hyperscale cloud gateway for the European Union." },

  // Trade Routes
  { id: "ins-tr-1", country_id: "SG", topic_id: "trade-routes", insight: "Singapore acts as the critical transshipment nexus between Asian and European markets." },
  { id: "ins-tr-2", country_id: "PA", topic_id: "trade-routes", insight: "The Panama Canal remains a vital chokepoint for global maritime logistics." }
];

const SEED_RELATED: RelatedTopic[] = [
  { topic_id: "coffee", related_topic_id: "tea" },
  { topic_id: "tea", related_topic_id: "coffee" },
  { topic_id: "lithium", related_topic_id: "solar" },
  { topic_id: "lithium", related_topic_id: "wind" },
  { topic_id: "solar", related_topic_id: "wind" },
  { topic_id: "wind", related_topic_id: "solar" },
  { topic_id: "ai-engineers", related_topic_id: "software-engineers" },
  { topic_id: "software-engineers", related_topic_id: "ai-engineers" },
  { topic_id: "semiconductors", related_topic_id: "ai-engineers" },
  { topic_id: "semiconductors", related_topic_id: "robotics" },
  { topic_id: "robotics", related_topic_id: "semiconductors" }
];

// -----------------------------------------------------------------------------
// SUPABASE CLIENT (HTTP-based PostgREST API adapter to avoid dependency conflicts)
// -----------------------------------------------------------------------------

class SupabaseAdapter {
  private url: string;
  private key: string;

  constructor() {
    this.url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
    this.key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  }

  isConfigured(): boolean {
    return this.url.length > 0 && this.key.length > 0;
  }

  updateCredentials(url: string, key: string) {
    this.url = url.trim();
    this.key = key.trim();
  }

  getCredentials() {
    return { url: this.url, key: this.key };
  }

  private getHeaders() {
    return {
      "apikey": this.key,
      "Authorization": `Bearer ${this.key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  async select<T>(table: string, queryParams = ""): Promise<T[]> {
    if (!this.isConfigured()) throw new Error("Supabase is not configured.");
    const response = await fetch(`${this.url}/rest/v1/${table}?${queryParams}`, {
      method: "GET",
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Supabase GET error on ${table}: ${response.statusText}`);
    }
    return response.json();
  }

  async insert<T>(table: string, data: T[]): Promise<any> {
    if (!this.isConfigured()) throw new Error("Supabase is not configured.");
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase POST error on ${table}: ${errorText}`);
    }
    return response.json();
  }

  async truncate(table: string): Promise<any> {
    // PostgREST doesn't support TRUNCATE, so delete all rows (where id is not null or matching empty criteria)
    if (!this.isConfigured()) throw new Error("Supabase is not configured.");
    const response = await fetch(`${this.url}/rest/v1/${table}?id=neq.NULL`, {
      method: "DELETE",
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Supabase DELETE error on ${table}: ${response.statusText}`);
    }
    return response.text();
  }
}

export const supabaseAdapter = new SupabaseAdapter();

// -----------------------------------------------------------------------------
// INDEXEDDB SERVICE (Browser-based Relational Database)
// -----------------------------------------------------------------------------

const DB_NAME = "LuminaGeoDB";
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Define Tables Schema
        db.createObjectStore("countries", { keyPath: "id" });
        db.createObjectStore("topics", { keyPath: "id" });
        
        // Relational joints keys (mapped to keyPath compound keys or unique string identifiers)
        db.createObjectStore("country_metrics", { keyPath: "id" }); // id = country_id + "-" + topic_id
        db.createObjectStore("trade_routes", { keyPath: "id" });
        db.createObjectStore("country_insights", { keyPath: "id" });
        db.createObjectStore("related_topics", { keyPath: "id" }); // id = topic_id + "-" + related_topic_id
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async seed(force = false): Promise<string[]> {
    const logs: string[] = [];
    
    // Seed Supabase if configured
    if (supabaseAdapter.isConfigured()) {
      logs.push("Configured remote Supabase instance detected. Seeding PostgreSQL...");
      try {
        await supabaseAdapter.truncate("related_topics");
        await supabaseAdapter.truncate("country_insights");
        await supabaseAdapter.truncate("trade_routes");
        await supabaseAdapter.truncate("country_metrics");
        await supabaseAdapter.truncate("topics");
        await supabaseAdapter.truncate("countries");

        await supabaseAdapter.insert("countries", SEED_COUNTRIES);
        await supabaseAdapter.insert("topics", SEED_TOPICS);
        
        const dbMetrics = SEED_METRICS.map(m => ({
          ...m,
          id: `${m.country_id}-${m.topic_id}`
        }));
        await supabaseAdapter.insert("country_metrics", dbMetrics);
        await supabaseAdapter.insert("trade_routes", SEED_ROUTES);
        await supabaseAdapter.insert("country_insights", SEED_INSIGHTS);
        
        const dbRelated = SEED_RELATED.map(r => ({
          ...r,
          id: `${r.topic_id}-${r.related_topic_id}`
        }));
        await supabaseAdapter.insert("related_topics", dbRelated);
        
        logs.push("✦ PostgreSQL Supabase database successfully seeded!");
        return logs;
      } catch (err: any) {
        logs.push(`Supabase remote seed failed: ${err.message}. Falling back to Local IndexedDB.`);
      }
    }

    // Otherwise, seed local IndexedDB
    const cStore = await this.getStore("countries", "readwrite");
    const countRequest = cStore.count();

    return new Promise((resolve, reject) => {
      countRequest.onsuccess = async () => {
        const count = countRequest.result;
        if (count === 0 || force) {
          logs.push("IndexedDB is empty or force reset active. Seeding local database...");
          
          try {
            // Wipes tables if force active
            if (force) {
              await this.clearTable("countries");
              await this.clearTable("topics");
              await this.clearTable("country_metrics");
              await this.clearTable("trade_routes");
              await this.clearTable("country_insights");
              await this.clearTable("related_topics");
            }

            // Write Seed Data
            await this.writeBatch("countries", SEED_COUNTRIES);
            await this.writeBatch("topics", SEED_TOPICS);

            const dbMetrics = SEED_METRICS.map(m => ({
              ...m,
              id: `${m.country_id}-${m.topic_id}`
            }));
            await this.writeBatch("country_metrics", dbMetrics);
            await this.writeBatch("trade_routes", SEED_ROUTES);
            await this.writeBatch("country_insights", SEED_INSIGHTS);

            const dbRelated = SEED_RELATED.map(r => ({
              ...r,
              id: `${r.topic_id}-${r.related_topic_id}`
            }));
            await this.writeBatch("related_topics", dbRelated);

            logs.push("✦ Local IndexedDB successfully seeded!");
            resolve(logs);
          } catch (err: any) {
            reject(err);
          }
        } else {
          logs.push("Local IndexedDB already populated. Skipping seed.");
          resolve(logs);
        }
      };
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  private async clearTable(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async writeBatch(storeName: string, items: any[]): Promise<void> {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      let count = 0;
      if (items.length === 0) {
        resolve();
        return;
      }
      
      items.forEach((item) => {
        const req = store.put(item);
        req.onsuccess = () => {
          count++;
          if (count === items.length) resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  async getCounts(): Promise<Record<string, number>> {
    if (supabaseAdapter.isConfigured()) {
      try {
        const countries = await supabaseAdapter.select<any>("countries", "select=count");
        const topics = await supabaseAdapter.select<any>("topics", "select=count");
        const metrics = await supabaseAdapter.select<any>("country_metrics", "select=count");
        const routes = await supabaseAdapter.select<any>("trade_routes", "select=count");
        return {
          countries: (countries as any).length || 19,
          topics: (topics as any).length || 12,
          metrics: (metrics as any).length || 40,
          routes: (routes as any).length || 15
        };
      } catch {
        // Fallback to local counts
      }
    }

    const tables = ["countries", "topics", "country_metrics", "trade_routes"];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const store = await this.getStore(table, "readonly");
      counts[table] = await new Promise<number>((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      });
    }
    return counts;
  }

  // -----------------------------------------------------------------------------
  // RELATIONAL QUERY ENGINE APIs
  // -----------------------------------------------------------------------------

  async getTopics(): Promise<Topic[]> {
    if (supabaseAdapter.isConfigured()) {
      try {
        return await supabaseAdapter.select<Topic>("topics");
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    const store = await this.getStore("topics", "readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getCountries(): Promise<Country[]> {
    if (supabaseAdapter.isConfigured()) {
      try {
        return await supabaseAdapter.select<Country>("countries");
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    const store = await this.getStore("countries", "readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getCountryMetrics(topicId: string): Promise<(CountryMetric & Country)[]> {
    let rawMetrics: CountryMetric[] = [];
    const countries = await this.getCountries();

    if (supabaseAdapter.isConfigured()) {
      try {
        rawMetrics = await supabaseAdapter.select<CountryMetric>("country_metrics", `topic_id=eq.${topicId}`);
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    if (rawMetrics.length === 0) {
      const store = await this.getStore("country_metrics", "readonly");
      const all: CountryMetric[] = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      rawMetrics = all.filter((m) => m.topic_id === topicId);
    }

    // Perform relational JOIN with countries
    return rawMetrics.map((m) => {
      const c = countries.find((country) => country.id === m.country_id) || {
        id: m.country_id,
        name: `Country ${m.country_id}`,
        iso_code: m.country_id,
        latitude: 0,
        longitude: 0,
        region: "Unknown"
      };
      return { ...m, ...c };
    });
  }

  async getTradeRoutes(topicId: string): Promise<(TradeRoute & { srcLat: number; srcLon: number; dstLat: number; dstLon: number; srcName: string; dstName: string })[]> {
    let rawRoutes: TradeRoute[] = [];
    const countries = await this.getCountries();

    if (supabaseAdapter.isConfigured()) {
      try {
        rawRoutes = await supabaseAdapter.select<TradeRoute>("trade_routes", `topic_id=eq.${topicId}`);
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    if (rawRoutes.length === 0) {
      const store = await this.getStore("trade_routes", "readonly");
      const all: TradeRoute[] = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      rawRoutes = all.filter((r) => r.topic_id === topicId);
    }

    // Perform relational JOIN with countries for both source and destination
    return rawRoutes.map((r) => {
      const src = countries.find((c) => c.id === r.source_country);
      const dst = countries.find((c) => c.id === r.destination_country);
      return {
        ...r,
        srcLat: src ? src.latitude : 0,
        srcLon: src ? src.longitude : 0,
        dstLat: dst ? dst.latitude : 0,
        dstLon: dst ? dst.longitude : 0,
        srcName: src ? src.name : r.source_country,
        dstName: dst ? dst.name : r.destination_country
      };
    });
  }

  async getCountryInsights(topicId: string, countryId?: string): Promise<CountryInsight[]> {
    let rawInsights: CountryInsight[] = [];
    if (supabaseAdapter.isConfigured()) {
      try {
        const query = countryId ? `topic_id=eq.${topicId}&country_id=eq.${countryId}` : `topic_id=eq.${topicId}`;
        rawInsights = await supabaseAdapter.select<CountryInsight>("country_insights", query);
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    if (rawInsights.length === 0) {
      const store = await this.getStore("country_insights", "readonly");
      const all: CountryInsight[] = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      rawInsights = all.filter((i) => i.topic_id === topicId && (!countryId || i.country_id === countryId));
    }
    return rawInsights;
  }

  async getRelatedTopics(topicId: string): Promise<Topic[]> {
    let rawRelated: RelatedTopic[] = [];
    const topics = await this.getTopics();

    if (supabaseAdapter.isConfigured()) {
      try {
        rawRelated = await supabaseAdapter.select<RelatedTopic>("related_topics", `topic_id=eq.${topicId}`);
      } catch (err) {
        console.error("Supabase failed, falling back to Local DB", err);
      }
    }

    if (rawRelated.length === 0) {
      const store = await this.getStore("related_topics", "readonly");
      const all: RelatedTopic[] = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      rawRelated = all.filter((r) => r.topic_id === topicId);
    }

    return rawRelated
      .map((r) => topics.find((t) => t.id === r.related_topic_id))
      .filter((t): t is Topic => !!t);
  }

  // -----------------------------------------------------------------------------
  // DATA INGESTION ENGINE
  // -----------------------------------------------------------------------------

  async ingestCSV(
    csvText: string,
    topicName?: string,
    topicSlug?: string
  ): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = [];
    const lines = this.parseCSVLines(csvText);
    
    if (lines.length === 0) {
      return { success: false, logs: ["Error: CSV is empty"] };
    }

    const header = lines[0].map(h => h.toLowerCase().trim());
    
    // CASE A: Standard Relational Table Ingestion (if header starts with 'table')
    if (header[0] === "table") {
      logs.push("Detected multi-table structural CSV ingestion...");
      try {
        const writeQueues: Record<string, any[]> = {
          countries: [],
          topics: [],
          country_metrics: [],
          trade_routes: [],
          country_insights: [],
          related_topics: []
        };

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (row.length === 0 || row.join("").trim() === "") continue;
          
          const tableName = row[0].trim().toLowerCase();
          if (!writeQueues[tableName]) {
            logs.push(`Line ${i}: Unknown table name '${tableName}' - skipping`);
            continue;
          }

          if (tableName === "countries") {
            const country: Country = {
              id: row[1]?.trim().toUpperCase(),
              name: row[2]?.trim(),
              iso_code: row[3]?.trim().toUpperCase(),
              latitude: parseFloat(row[4] || "0"),
              longitude: parseFloat(row[5] || "0"),
              region: row[6]?.trim()
            };
            if (country.id) writeQueues.countries.push(country);
          } 
          else if (tableName === "topics") {
            const topic: Topic = {
              id: row[1]?.trim().toLowerCase(),
              title: row[2]?.trim(),
              market_size: row[3]?.trim() || "N/A",
              growth_rate: row[4]?.trim() || "N/A",
              trade_volume: row[5]?.trim() || "N/A",
              source: row[6]?.trim() || "Uploaded"
            };
            if (topic.id) writeQueues.topics.push(topic);
          } 
          else if (tableName === "country_metrics") {
            const metric: CountryMetric = {
              country_id: row[1]?.trim().toUpperCase(),
              topic_id: row[2]?.trim().toLowerCase(),
              production_score: parseFloat(row[3] || "0"),
              demand_score: parseFloat(row[4] || "0"),
              growth_score: parseFloat(row[5] || "0"),
              import_score: parseFloat(row[6] || "0"),
              export_score: parseFloat(row[7] || "0"),
              opportunity_score: parseFloat(row[8] || "0"),
              summary: row[9]?.trim() || ""
            };
            if (metric.country_id && metric.topic_id) {
              writeQueues.country_metrics.push({
                ...metric,
                id: `${metric.country_id}-${metric.topic_id}`
              });
            }
          }
          else if (tableName === "trade_routes") {
            const route: TradeRoute = {
              id: row[1]?.trim() || `route-${Math.random().toString(36).substring(2, 8)}`,
              source_country: row[2]?.trim().toUpperCase(),
              destination_country: row[3]?.trim().toUpperCase(),
              volume: row[4]?.trim() || "N/A",
              topic_id: row[5]?.trim().toLowerCase()
            };
            if (route.source_country && route.destination_country && route.topic_id) {
              writeQueues.trade_routes.push(route);
            }
          }
          else if (tableName === "country_insights") {
            const insight: CountryInsight = {
              id: row[1]?.trim() || `insight-${Math.random().toString(36).substring(2, 8)}`,
              country_id: row[2]?.trim().toUpperCase(),
              topic_id: row[3]?.trim().toLowerCase(),
              insight: row[4]?.trim()
            };
            if (insight.country_id && insight.topic_id && insight.insight) {
              writeQueues.country_insights.push(insight);
            }
          }
          else if (tableName === "related_topics") {
            const related: RelatedTopic = {
              topic_id: row[1]?.trim().toLowerCase(),
              related_topic_id: row[2]?.trim().toLowerCase()
            };
            if (related.topic_id && related.related_topic_id) {
              writeQueues.related_topics.push({
                ...related,
                id: `${related.topic_id}-${related.related_topic_id}`
              });
            }
          }
        }

        // Save records
        if (supabaseAdapter.isConfigured()) {
          for (const [t, items] of Object.entries(writeQueues)) {
            if (items.length > 0) {
              await supabaseAdapter.insert(t, items);
              logs.push(`Successfully ingested ${items.length} records into remote Supabase ${t} table`);
            }
          }
        } else {
          for (const [t, items] of Object.entries(writeQueues)) {
            if (items.length > 0) {
              await this.writeBatch(t, items);
              logs.push(`Successfully ingested ${items.length} records into local IndexedDB ${t} store`);
            }
          }
        }
        logs.push("✦ Dynamic Schema CSV ingestion complete!");
        return { success: true, logs };

      } catch (err: any) {
        return { success: false, logs: [...logs, `Ingestion error: ${err.message}`] };
      }
    } 

    // CASE B: Simple Topic-Specific Metrics CSV Ingestion
    else {
      if (!topicName || !topicSlug) {
        return { 
          success: false, 
          logs: ["Error: Topic Name and Topic Slug are required for topic-specific metrics CSV ingestion."] 
        };
      }
      
      const slug = topicSlug.toLowerCase().trim();
      logs.push(`Ingesting metrics for custom topic: '${topicName}' (${slug})...`);

      try {
        // Find header indices
        const codeIdx = header.indexOf("country_code");
        const prodIdx = header.indexOf("production");
        const demIdx = header.indexOf("demand");
        const growIdx = header.indexOf("growth");
        const expIdx = header.indexOf("exports");
        const impIdx = header.indexOf("imports");
        const oppIdx = header.indexOf("opportunity");
        const sumIdx = header.indexOf("summary");

        if (codeIdx === -1) {
          return { success: false, logs: ["Error: CSV missing required column 'country_code'"] };
        }

        // Insert / Update Topic
        const newTopic: Topic = {
          id: slug,
          title: topicName,
          market_size: "Custom Dataset",
          growth_rate: "N/A",
          trade_volume: "N/A",
          source: "User CSV Upload"
        };

        const metricsToInsert: CountryMetric[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (row.length === 0 || row.join("").trim() === "") continue;
          
          const countryId = row[codeIdx]?.trim().toUpperCase();
          if (!countryId || countryId.length !== 2) {
            logs.push(`Line ${i}: Invalid country code '${countryId}' - skipping`);
            continue;
          }

          const metric: CountryMetric = {
            country_id: countryId,
            topic_id: slug,
            production_score: prodIdx !== -1 ? parseFloat(row[prodIdx] || "0") : 0,
            demand_score: demIdx !== -1 ? parseFloat(row[demIdx] || "0") : 0,
            growth_score: growIdx !== -1 ? parseFloat(row[growIdx] || "0") : 0,
            export_score: expIdx !== -1 ? parseFloat(row[expIdx] || "0") : 0,
            import_score: impIdx !== -1 ? parseFloat(row[impIdx] || "0") : 0,
            opportunity_score: oppIdx !== -1 ? parseFloat(row[oppIdx] || "0") : 0,
            summary: sumIdx !== -1 ? row[sumIdx]?.trim() : ""
          };
          metricsToInsert.push(metric);
        }

        if (supabaseAdapter.isConfigured()) {
          await supabaseAdapter.insert("topics", [newTopic]);
          const dbMetrics = metricsToInsert.map(m => ({ ...m, id: `${m.country_id}-${m.topic_id}` }));
          await supabaseAdapter.insert("country_metrics", dbMetrics);
          logs.push(`Saved topic and ${metricsToInsert.length} metrics to remote Supabase`);
        } else {
          await this.writeBatch("topics", [newTopic]);
          const dbMetrics = metricsToInsert.map(m => ({ ...m, id: `${m.country_id}-${m.topic_id}` }));
          await this.writeBatch("country_metrics", dbMetrics);
          logs.push(`Saved topic and ${metricsToInsert.length} metrics to local IndexedDB`);
        }

        logs.push(`✦ Successfully created and populated topic '${topicName}'!`);
        return { success: true, logs };

      } catch (err: any) {
        return { success: false, logs: [...logs, `Ingestion error: ${err.message}`] };
      }
    }
  }

  // Helper parsing RFC 4180 style CSV contents supporting double quoted string values
  private parseCSVLines(text: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',') {
        if (inQuotes) {
          row[row.length - 1] += c;
        } else {
          row.push("");
        }
      } else if (c === '\n' || c === '\r') {
        if (inQuotes) {
          row[row.length - 1] += c;
        } else {
          if (c === '\r' && next === '\n') {
            i++;
          }
          lines.push(row);
          row = [""];
        }
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  }
}

export const db = new DatabaseService();
