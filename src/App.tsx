import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import GlobeScene from "./components/Globe/GlobeScene";
import IntroScreen from "./components/UI/IntroScreen";
import SearchPanel from "./components/UI/SearchPanel";
import ControlPanel from "./components/UI/ControlPanel";
import DataOverlay from "./components/UI/DataOverlay";
import DocumentaryHUD from "./components/UI/DocumentaryHUD";
import ResearchDossier from "./components/UI/ResearchDossier";
import DatabaseAdmin from "./components/UI/DatabaseAdmin";
import { Database } from "lucide-react";
import { DataIntelligenceEngine } from "./services/dataEngine";
import { NarrativeEngine } from "./services/narrativeEngine";
import type { CinematicJourney } from "./services/narrativeEngine";

// Spherical projection coordinate mapping helper
function latLonToVector3(lat: number, lon: number, radius = 2.0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

export const App: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Coffee"); // Start with Coffee as the baseline product spotlight
  const [activeMode, setActiveMode] = useState("");
  const [timelineVal, setTimelineVal] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<any>(null);
  const [comparePreset, setComparePreset] = useState("coffee-tea");
  const [heatmapMode, setHeatmapMode] = useState("production");

  // Storytelling / Interactive Documentary states
  const [storyModeActive, setStoryModeActive] = useState(false); // Story mode button in search bar
  const [activeJourney, setActiveJourney] = useState<CinematicJourney | null>(null);
  const [activeSceneStep, setActiveSceneStep] = useState(0);

  // Geospatial Country Outlines and Dossiers state
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);

  // Database ready and update triggers
  const [dbReady, setDbReady] = useState(false);
  const [dbTrigger, setDbTrigger] = useState(0);
  const [intelPayload, setIntelPayload] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // Initialize and seed IndexedDB on mount
  useEffect(() => {
    import("./services/db").then(({ db }) => {
      db.init().then(() => db.seed()).then(() => {
        setDbReady(true);
        setDbTrigger(prev => prev + 1);
      });
    });
  }, []);

  // Fetch query intelligence dynamically from the DB Engine asynchronously
  useEffect(() => {
    if (!dbReady) return;
    
    let active = true;

    // Load available topics list dynamically from database
    import("./services/db").then(({ db }) => {
      db.getTopics().then((topics) => {
        if (active) {
          setAvailableTopics(topics.map(t => t.title));
        }
      });
    });

    if (activeMode === "compare") {
      DataIntelligenceEngine.getComparison(comparePreset).then((cmp) => {
        if (active) {
          setCompareData(cmp);
          setIntelPayload(cmp.payloadA);
        }
      });
    } else {
      DataIntelligenceEngine.getIntelligence(searchQuery).then((payload) => {
        if (active) {
          setIntelPayload(payload);
          setCompareData(null);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [searchQuery, activeMode, comparePreset, dbReady, dbTrigger]);

  // 2. Interpolate active hotspot coordinates based on the chronologic slider
  const hotspotsData = useMemo(() => {
    if (!intelPayload) return [];
    return DataIntelligenceEngine.interpolateTimeline(intelPayload.hotspots, timelineVal);
  }, [intelPayload, timelineVal]);

  // 3. Fetch trade paths
  const corridorsData = useMemo(() => {
    if (!intelPayload) return [];
    const hasSearch = searchQuery.trim().length > 0;
    const isNetwork = activeMode === "network" || !!activeJourney;
    return (hasSearch || isNetwork) ? intelPayload.corridors : [];
  }, [intelPayload, searchQuery, activeMode, activeJourney]);

  // Intercept Hotspot Pin Selection: Map clicks on regional pins directly to their sovereign country profiles!
  useEffect(() => {
    if (selectedHotspot) {
      const id = selectedHotspot.id.toLowerCase();
      if (id.includes("tw") || id.includes("semi-tw")) {
        setSelectedCountryId("TW");
      } else if (id.includes("ch") || id.includes("li-ch")) {
        setSelectedCountryId("CL");
      } else if (id.includes("wa") || id.includes("li-wa") || id.includes("au")) {
        setSelectedCountryId("AU");
      } else if (id.includes("us") || id.includes("nv") || id.includes("sf")) {
        setSelectedCountryId("US");
      } else if (id.includes("cn") || id.includes("bj") || id.includes("so-cn")) {
        setSelectedCountryId("CN");
      } else if (id.includes("kr")) {
        setSelectedCountryId("KR");
      } else if (id.includes("in") || id.includes("blr")) {
        setSelectedCountryId("IN");
      } else if (id.includes("de") || id.includes("hamburg")) {
        setSelectedCountryId("DE");
      } else if (id.includes("uk") || id.includes("lon")) {
        setSelectedCountryId("GB");
      }
    }
  }, [selectedHotspot]);

  // Handle Search input: Every search automatically triggers a narrative journey!
  const handleSearch = async (query: string) => {
    if (!query || query.trim().length === 0) return;
    
    // Clear country selection during a search transition
    setSelectedCountryId(null);

    // Fetch narrative journey for the query
    const journey = await NarrativeEngine.getNarrativeJourney(query);
    setActiveJourney(journey);
    setActiveSceneStep(0);
    setSearchQuery(journey.query);
  };

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    setSelectedHotspot(null);
    setSelectedCountryId(null);
    setTimelineVal(0); // Reset timeline when changing modes
  };

  // Listen for related topics trigger clicks
  useEffect(() => {
    const handleTopicChange = (e: Event) => {
      const topic = (e as CustomEvent).detail;
      if (topic) {
        handleSearch(topic);
      }
    };
    window.addEventListener("changeTopic", handleTopicChange);
    return () => window.removeEventListener("changeTopic", handleTopicChange);
  }, []);

  // Synchronize active scene parameters onto the globe controls
  useEffect(() => {
    if (activeJourney) {
      const scene = activeJourney.scenes[activeSceneStep];
      if (scene) {
        // Sync globe modes and visual filters
        setActiveMode(scene.globeMode);
        setHeatmapMode(scene.heatmapMode);
        setTimelineVal(scene.timelineVal);

        // Adjust compare presets if necessary
        if (scene.globeMode === "compare") {
          const lowerQuery = activeJourney.query.toLowerCase();
          if (lowerQuery.includes("lithium")) {
            setComparePreset("solar-wind"); // fallback or custom preset
          } else {
            setComparePreset("coffee-tea");
          }
        }
      }
    }
  }, [activeJourney, activeSceneStep]);

  // Synchronize active scene highlighted hotspot logic
  useEffect(() => {
    if (activeJourney && hotspotsData.length > 0) {
      const scene = activeJourney.scenes[activeSceneStep];
      if (scene && scene.highlightedHotspotId) {
        const found = hotspotsData.find(h => h.id === scene.highlightedHotspotId);
        if (found) {
          const pos = latLonToVector3(found.lat, found.lon, 2.0);
          setSelectedHotspot({ 
            ...found, 
            pos,
            narrative: scene.narrative // inject scene narration directly into spatial bubble card
          });
        } else {
          setSelectedHotspot(null);
        }
      } else {
        setSelectedHotspot(null);
      }
    }
  }, [activeJourney, activeSceneStep, hotspotsData]);

  const handleExitJourney = () => {
    setActiveJourney(null);
    setActiveSceneStep(0);
    setSelectedHotspot(null);
    setSelectedCountryId(null);
    setActiveMode("");
    setTimelineVal(0);
  };

  const handleSelectStory = async (storyId: string | null) => {
    if (storyId) {
      setSelectedCountryId(null);
      const journey = await NarrativeEngine.getNarrativeJourney(storyId);
      setActiveJourney(journey);
      setActiveSceneStep(0);
      setSearchQuery(journey.query);
    } else {
      handleExitJourney();
    }
  };

  return (
    <div 
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#010103",
        overflow: "hidden",
      }}
    >
      {/* 1. space Vignette backdrop (Z-Index 1) */}
      <div className="space-vignette" />

      {/* 2. 3D WebGL Globe Canvas (Z-Index 2) */}
      <GlobeScene
        hotspotsData={hotspotsData}
        corridorsData={corridorsData}
        heatmapMode={heatmapMode}
        activeMode={activeMode}
        timelineVal={timelineVal}
        selectedHotspot={selectedHotspot}
        onHotspotSelect={setSelectedHotspot}
        hoveredHotspot={hoveredHotspot}
        setHoveredHotspot={setHoveredHotspot}
        compareData={compareData}
        activeScene={activeJourney ? activeJourney.scenes[activeSceneStep] : null}
        
        // Geospatial props
        selectedCountryId={selectedCountryId}
        onCountrySelect={setSelectedCountryId}
        hoveredCountryId={hoveredCountryId}
        setHoveredCountryId={setHoveredCountryId}
      />

      {/* 3. Cinematic black fade loader (Z-Index 9999) */}
      <IntroScreen onComplete={() => setIntroComplete(true)} />

      {/* 4. Peripheral Interactive HUD overlays (Z-Index 10) */}
      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {/* Database Control Toggle Button */}
            <button
              className="db-btn"
              onClick={() => setAdminPanelOpen(true)}
              style={{
                position: "absolute",
                top: "40px",
                right: "40px",
                background: "var(--panel-bg)",
                border: "1px solid var(--panel-border)",
                color: "var(--text-secondary)",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
                pointerEvents: "auto",
                zIndex: 100,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--panel-border-hover)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--panel-border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              title="Database Management & CSV Upload"
            >
              <Database size={18} />
            </button>

            {/* Apple Safari Spotlight Search */}
            <SearchPanel
              onSearch={handleSearch}
              activeSearch={searchQuery}
              storyModeActive={storyModeActive}
              setStoryModeActive={setStoryModeActive}
              activeStoryId={activeJourney ? activeJourney.query.toLowerCase() : null}
              onSelectStory={handleSelectStory}
              availableTopics={availableTopics}
            />

            {/* Bloomberg/National Geographic Report Sheets */}
            <DataOverlay
              searchQuery={searchQuery}
              activeMode={activeMode}
              selectedHotspot={selectedHotspot}
              onCloseHotspot={() => setSelectedHotspot(null)}
              hoveredHotspot={hoveredHotspot}
              intelPayload={intelPayload}
              heatmapMode={heatmapMode}
              onHeatmapModeChange={setHeatmapMode}
              compareData={compareData}
            />

            {/* Bloomberg/Palantir Research Dossier Overlay */}
            <AnimatePresence>
              {selectedCountryId && (
                <ResearchDossier
                  countryId={selectedCountryId}
                  searchQuery={searchQuery}
                  onClose={() => setSelectedCountryId(null)}
                />
              )}
            </AnimatePresence>

            {/* Database Admin Sidebar Control Panel */}
            <AnimatePresence>
              {adminPanelOpen && (
                <DatabaseAdmin
                  onClose={() => setAdminPanelOpen(false)}
                  onRefreshData={() => setDbTrigger(prev => prev + 1)}
                />
              )}
            </AnimatePresence>

            {/* Render widescreen Netflix subtitle HUD or regular control capsule deck */}
            <AnimatePresence mode="wait">
              {activeJourney ? (
                <DocumentaryHUD
                  journey={activeJourney}
                  activeSceneStep={activeSceneStep}
                  onSceneStepChange={setActiveSceneStep}
                  onExitJourney={handleExitJourney}
                />
              ) : (
                <ControlPanel
                  activeMode={activeMode}
                  onModeChange={handleModeChange}
                  timelineVal={timelineVal}
                  onTimelineChange={setTimelineVal}
                  comparePreset={comparePreset}
                  onComparePresetChange={setComparePreset}
                  activeStoryId={null}
                  activeStoryStep={0}
                  onStoryStepChange={() => {}}
                  onExitStory={() => {}}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
