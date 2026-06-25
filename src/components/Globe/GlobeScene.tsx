import React, { useRef, useEffect, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { COUNTRIES_BOUNDARIES } from "../../utils/countryBorders";
import { GLOBAL_CITIES } from "../../utils/textureGenerator";
import { DataIntelligenceEngine } from "../../services/dataEngine";
import type { 
  HotspotData, 
  TradeCorridor, 
  IntelligencePayload 
} from "../../services/dataEngine";

interface GlobeSceneProps {
  hotspotsData: HotspotData[];
  corridorsData: TradeCorridor[];
  heatmapMode: string;
  activeMode: string;
  timelineVal: number;
  selectedHotspot: any;
  onHotspotSelect: (hotspot: any) => void;
  hoveredHotspot: any;
  setHoveredHotspot: (hotspot: any) => void;
  compareData: {
    titleA: string;
    titleB: string;
    payloadA: IntelligencePayload;
    payloadB: IntelligencePayload;
  } | null;
  activeScene: any;
  
  // Geospatial Country States
  selectedCountryId: string | null;
  onCountrySelect: (countryId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (countryId: string | null) => void;
}

// Map GeoJSON country properties to standard ISO 2-letter codes used in Lumina
const getCountryCode = (feat: any) => {
  const code = feat.properties?.ISO_A2 || feat.properties?.ISO_A2_EH;
  if (code && code !== "-99") return code;
  
  const name = feat.properties?.ADMIN || feat.properties?.NAME;
  if (!name) return code;
  
  const mapping: Record<string, string> = {
    "Taiwan": "TW",
    "United States": "US",
    "United States of America": "US",
    "China": "CN",
    "Chile": "CL",
    "Australia": "AU",
    "South Korea": "KR",
    "Republic of Korea": "KR",
    "Brazil": "BR",
    "India": "IN",
    "United Kingdom": "GB",
    "Germany": "DE"
  };
  return mapping[name] || code;
};

// Calculate dynamic centroid for any GeoJSON feature (country outline)
const getFeatureCenter = (feat: any) => {
  if (feat.properties?.LABEL_X !== undefined && feat.properties?.LABEL_Y !== undefined) {
    return { lat: feat.properties.LABEL_Y, lon: feat.properties.LABEL_X };
  }
  
  if (feat.geometry) {
    let latSum = 0;
    let lonSum = 0;
    let count = 0;
    const processCoords = (coords: any[]) => {
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoords(coord);
        } else {
          lonSum += coord[0];
          latSum += coord[1];
          count++;
        }
      });
    };
    processCoords(feat.geometry.coordinates);
    if (count > 0) {
      return { lat: latSum / count, lon: lonSum / count };
    }
  }
  return { lat: 0, lon: 0 };
};

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  hotspotsData,
  corridorsData,
  heatmapMode,
  activeMode,
  timelineVal,
  selectedHotspot,
  onHotspotSelect,
  hoveredHotspot,
  setHoveredHotspot,
  compareData,
  activeScene,
  selectedCountryId,
  onCountrySelect,
  hoveredCountryId,
  setHoveredCountryId,
}) => {
  const globeRef = useRef<any>(null);
  const globeRefA = useRef<any>(null);
  const globeRefB = useRef<any>(null);
  
  const [countriesGeoJson, setCountriesGeoJson] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<"planet" | "country" | "city">("planet");
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  const lastClickTime = useRef(0);

  // Track window resizing for precise fullscreen canvas scaling
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load countries boundaries GeoJSON for border rendering and highlights
  useEffect(() => {
    fetch("https://unpkg.com/three-globe/example/img/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        setCountriesGeoJson(data);
      })
      .catch((err) => console.error("Failed to load borders GeoJSON", err));
  }, []);

  // Synchronize camera controls in Compare Mode (Dual Globes)
  useEffect(() => {
    if (activeMode !== "compare") return;
    
    let isSyncing = false;
    const syncA = () => {
      if (isSyncing) return;
      if (!globeRefA.current || !globeRefB.current) return;
      isSyncing = true;
      const pov = globeRefA.current.pointOfView();
      globeRefB.current.pointOfView(pov);
      isSyncing = false;
    };

    const syncB = () => {
      if (isSyncing) return;
      if (!globeRefA.current || !globeRefB.current) return;
      isSyncing = true;
      const pov = globeRefB.current.pointOfView();
      globeRefA.current.pointOfView(pov);
      isSyncing = false;
    };

    let controlsA: any = null;
    let controlsB: any = null;

    const timer = setTimeout(() => {
      if (globeRefA.current && globeRefB.current) {
        controlsA = globeRefA.current.controls();
        controlsB = globeRefB.current.controls();
        
        if (controlsA && controlsB) {
          controlsA.addEventListener("change", syncA);
          controlsB.addEventListener("change", syncB);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (controlsA) controlsA.removeEventListener("change", syncA);
      if (controlsB) controlsB.removeEventListener("change", syncB);
    };
  }, [activeMode, countriesGeoJson]);

  // Find corresponding topic hotspot data in a list for a given GeoJSON country feature
  const findCountryHotspotInList = (feat: any, list: HotspotData[]) => {
    const code = getCountryCode(feat);
    if (!code) return null;
    const codeLower = code.toLowerCase();
    const name = (feat.properties?.ADMIN || feat.properties?.NAME || "").toLowerCase();
    
    return list.find(h => {
      const idLower = h.id.toLowerCase();
      const hNameLower = h.name.toLowerCase();
      
      let searchCode = codeLower;
      if (searchCode === "gb") searchCode = "uk";
      
      // Match by ID suffix e.g. cf-br matches br
      if (idLower.endsWith("-" + searchCode) || idLower.endsWith(searchCode)) {
        return true;
      }
      // Match by bracket name container e.g. Santos Port (Brazil) matches Brazil
      if (hNameLower.includes("(" + name + ")")) {
        return true;
      }
      
      // Explicit fallbacks for country name patterns
      if (codeLower === "us" && (hNameLower.includes("(usa)") || hNameLower.includes("(us)"))) return true;
      if (codeLower === "gb" && (hNameLower.includes("(uk)") || hNameLower.includes("(united kingdom)"))) return true;
      if (codeLower === "kr" && hNameLower.includes("(south korea)")) return true;
      if (codeLower === "sg" && (hNameLower.includes("(sg)") || hNameLower.includes("(singapore)"))) return true;
      if (codeLower === "tw" && hNameLower.includes("taiwan")) return true;
      if (codeLower === "eg" && hNameLower.includes("egypt")) return true;
      if (codeLower === "pa" && hNameLower.includes("panama")) return true;
      if (codeLower === "ie" && hNameLower.includes("ireland")) return true;
      if (codeLower === "jp" && hNameLower.includes("japan")) return true;
      if (codeLower === "vn" && hNameLower.includes("vietnam")) return true;
      if (codeLower === "et" && hNameLower.includes("ethiopia")) return true;
      if (codeLower === "co" && hNameLower.includes("colombia")) return true;
      if (codeLower === "ke" && hNameLower.includes("kenya")) return true;
      
      return false;
    });
  };

  // Find the maximum value in the current dataset to normalize 3D column heights and polygon colors
  const maxVal = useMemo(() => {
    if (hotspotsData.length === 0) return 1;
    return Math.max(...hotspotsData.map((h) => {
      switch (heatmapMode) {
        case "production": return h.production;
        case "demand": return h.demand;
        case "growth": return h.growth;
        case "exports": return h.exports;
        case "imports": return h.imports;
        case "opportunity": return h.opportunity;
        default: return h.production;
      }
    }), 1);
  }, [hotspotsData, heatmapMode]);

  // Normalize heights for side-by-side datasets
  const compareHotspotsA = useMemo(() => {
    if (!compareData) return [];
    return DataIntelligenceEngine.interpolateTimeline(compareData.payloadA.hotspots, timelineVal);
  }, [compareData, timelineVal]);

  const compareHotspotsB = useMemo(() => {
    if (!compareData) return [];
    return DataIntelligenceEngine.interpolateTimeline(compareData.payloadB.hotspots, timelineVal);
  }, [compareData, timelineVal]);

  const maxValA = useMemo(() => {
    if (compareHotspotsA.length === 0) return 1;
    return Math.max(...compareHotspotsA.map(h => h.production), 1);
  }, [compareHotspotsA]);

  const maxValB = useMemo(() => {
    if (compareHotspotsB.length === 0) return 1;
    return Math.max(...compareHotspotsB.map(h => h.production), 1);
  }, [compareHotspotsB]);

  // Determine active visual styles based on current visual mode (Split/Future vs Satellite Day)
  const isHolographic = activeMode === "split" || activeMode === "future";
  const isMobile = dimensions.width <= 480;
  const globeImage = isHolographic
    ? null
    : "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
  const atmosphereColor = isHolographic ? "#00f0ff" : "#3b82f6";
  const shouldAutoRotate = !selectedHotspot && !selectedCountryId && activeMode !== "split" && (!activeScene || activeScene.zoom >= 5.0);

  // Configure OrbitControls auto-rotation, boundaries, and dynamic zoom tracking
  useEffect(() => {
    let cleanups: (() => void)[] = [];

    const setupControls = (ref: any) => {
      if (!ref.current) return;
      const controls = ref.current.controls();
      if (controls) {
        controls.enablePan = false;
        controls.minDistance = 130;
        controls.maxDistance = 500;
        controls.autoRotate = shouldAutoRotate;
        controls.autoRotateSpeed = 0.5;
        
        // Premium Apple-level inertia/damping
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        const handleCameraChange = () => {
          const pov = ref.current.pointOfView();
          const alt = pov.altitude; // radius multiplier (starts around 2.5)
          
          let level: "planet" | "country" | "city" = "planet";
          if (alt > 1.95) {
            level = "planet";
          } else if (alt > 1.25) {
            level = "country";
          } else {
            level = "city";
          }
          setZoomLevel(level);
        };
        
        controls.addEventListener("change", handleCameraChange);
        cleanups.push(() => {
          controls.removeEventListener("change", handleCameraChange);
        });
      }
    };

    if (activeMode === "compare") {
      setupControls(globeRefA);
      setupControls(globeRefB);
    } else {
      setupControls(globeRef);
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [shouldAutoRotate, activeMode, countriesGeoJson]);

  // Handle smooth fly-to camera positioning when active hotspot, scene, or country changes
  useEffect(() => {
    const flyTo = (ref: any) => {
      if (!ref.current) return;
      
      if (activeScene) {
        ref.current.pointOfView({
          lat: activeScene.lat,
          lng: activeScene.lon,
          altitude: Math.max(0.6, activeScene.zoom / 2.5)
        }, 1500);
      } else if (selectedCountryId && countriesGeoJson) {
        // Find country outline feature and fly to its exact calculated centroid
        const feat = countriesGeoJson.features.find((f: any) => getCountryCode(f) === selectedCountryId);
        if (feat) {
          const center = getFeatureCenter(feat);
          ref.current.pointOfView({
            lat: center.lat,
            lng: center.lon,
            altitude: 1.4
          }, 1500);
        } else {
          // Fallback to static boundaries list if GeoJSON not loaded/found
          const country = COUNTRIES_BOUNDARIES.find((c) => c.id === selectedCountryId);
          if (country) {
            ref.current.pointOfView({
              lat: country.center.lat,
              lng: country.center.lon,
              altitude: 1.4
            }, 1500);
          }
        }
      } else if (selectedHotspot) {
        ref.current.pointOfView({
          lat: selectedHotspot.lat,
          lng: selectedHotspot.lon,
          altitude: 1.25
        }, 1500);
      }
    };

    if (activeMode === "compare") {
      flyTo(globeRefA);
      flyTo(globeRefB);
    } else {
      flyTo(globeRef);
    }
  }, [activeScene, selectedCountryId, selectedHotspot, activeMode, countriesGeoJson]);

  // Globe surface custom material to simulate high-end holographic effect vs realistic PBR reflectivity
  const customGlobeMaterial = useMemo(() => {
    if (isHolographic) {
      return new THREE.MeshPhongMaterial({
        color: new THREE.Color("#002447"),
        transparent: true,
        opacity: 0.35,
        shininess: 10,
        wireframe: false
      });
    }
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color("#08152e"),
      shininess: 75,
      specular: new THREE.Color("#111111")
    });
  }, [isHolographic]);

  // Get dynamic polygon fill color mapped to specific viz metrics (HSL gradients)
  const getCountryColorForModeInList = (hotspot: HotspotData, mode: string, max: number) => {
    let val = 0;
    switch (mode) {
      case "production": val = hotspot.production; break;
      case "demand": val = hotspot.demand; break;
      case "growth": val = hotspot.growth; break;
      case "exports": val = hotspot.exports; break;
      case "imports": val = hotspot.imports; break;
      case "opportunity": val = hotspot.opportunity; break;
      default: val = hotspot.production;
    }
    
    const ratio = Math.min(1, val / max);
    if (ratio <= 0) return "rgba(255, 255, 255, 0.01)";
    
    switch (mode) {
      case "production":
        return `rgba(16, 185, 129, ${0.15 + ratio * 0.55})`; // Emerald green for high supply
      case "demand":
        return `rgba(239, 68, 68, ${0.15 + ratio * 0.55})`; // Red for high demand
      case "exports":
        return `rgba(245, 158, 11, ${0.15 + ratio * 0.55})`; // Gold/Yellow for high exports
      case "imports":
        return `rgba(59, 130, 246, ${0.15 + ratio * 0.55})`; // Blue for imports
      case "growth":
        return `rgba(168, 85, 247, ${0.15 + ratio * 0.55})`; // Purple for growth
      case "opportunity":
        return `rgba(6, 182, 212, ${0.15 + ratio * 0.55})`; // Teal for opportunity
      default:
        return `rgba(255, 255, 255, ${0.1 + ratio * 0.4})`;
    }
  };

  // Polygon background coloring (Highlights active, hovered, and selected countries)
  const getHexColor = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    
    if (isHolographic) {
      if (isSelected) return "rgba(0, 243, 255, 0.45)";
      if (isHovered) return "rgba(0, 243, 255, 0.25)";
      return "rgba(0, 243, 255, 0.05)";
    }
    
    if (isSelected) return "rgba(207, 168, 100, 0.55)";
    if (isHovered) return "rgba(255, 255, 255, 0.28)";
    
    const hotspot = findCountryHotspotInList(feat, hotspotsData);
    if (hotspot) {
      return getCountryColorForModeInList(hotspot, heatmapMode, maxVal);
    }
    
    return "rgba(255, 255, 255, 0.01)";
  };

  // Polygon background coloring for Globe A
  const getHexColorA = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    
    if (isSelected) return "rgba(207, 168, 100, 0.55)";
    if (isHovered) return "rgba(255, 255, 255, 0.28)";
    
    const hotspot = findCountryHotspotInList(feat, compareHotspotsA);
    if (hotspot) {
      return getCountryColorForModeInList(hotspot, heatmapMode, maxValA);
    }
    return "rgba(255, 255, 255, 0.01)";
  };

  // Polygon background coloring for Globe B
  const getHexColorB = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    
    if (isSelected) return "rgba(207, 168, 100, 0.55)";
    if (isHovered) return "rgba(255, 255, 255, 0.28)";
    
    const hotspot = findCountryHotspotInList(feat, compareHotspotsB);
    if (hotspot) {
      return getCountryColorForModeInList(hotspot, heatmapMode, maxValB);
    }
    return "rgba(255, 255, 255, 0.01)";
  };

  // Polygon boundary stroke coloring
  const getStrokeColor = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    
    if (isHolographic) {
      if (isSelected) return "#00f3ff";
      if (isHovered) return "rgba(0, 243, 255, 0.7)";
      return "rgba(0, 243, 255, 0.25)";
    }
    
    if (isSelected) return "#ebd09b";
    if (isHovered) return "#ffffff";
    
    const hotspot = findCountryHotspotInList(feat, hotspotsData);
    if (hotspot) {
      return "rgba(255, 255, 255, 0.22)";
    }
    return "rgba(255, 255, 255, 0.08)";
  };

  // Polygon boundary stroke coloring for comparison maps
  const getStrokeColorA = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    if (isSelected) return "#ebd09b";
    if (isHovered) return "#ffffff";
    const hotspot = findCountryHotspotInList(feat, compareHotspotsA);
    return hotspot ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)";
  };

  const getStrokeColorB = (feat: any) => {
    const code = getCountryCode(feat);
    const isSelected = code === selectedCountryId;
    const isHovered = code === hoveredCountryId;
    if (isSelected) return "#ebd09b";
    if (isHovered) return "#ffffff";
    const hotspot = findCountryHotspotInList(feat, compareHotspotsB);
    return hotspot ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)";
  };

  // Generate interactive country tooltips showing detailed metrics
  const getTooltipHTML = (feat: any) => {
    const code = getCountryCode(feat);
    const name = feat.properties?.ADMIN || feat.properties?.NAME || "Unknown Country";
    const hotspot = findCountryHotspotInList(feat, hotspotsData);
    
    if (!hotspot) {
      return `<div style="background: rgba(8, 8, 10, 0.95); color: #fff; padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); font-family: 'Inter', sans-serif; font-size: 11px;">
        <strong>${name}</strong>
      </div>`;
    }
    
    let metricLabel = "";
    let metricVal = "";
    switch (heatmapMode) {
      case "production": 
        metricLabel = "Production Output"; 
        metricVal = `${hotspot.production} ${hotspot.metricUnit}`; 
        break;
      case "demand": 
        metricLabel = "Demand Score"; 
        metricVal = `${hotspot.demand} / 100`; 
        break;
      case "growth": 
        metricLabel = "Annual Growth"; 
        metricVal = `${hotspot.growth}%`; 
        break;
      case "exports": 
        metricLabel = "Exports Valuation"; 
        metricVal = `$${hotspot.exports}M`; 
        break;
      case "imports": 
        metricLabel = "Imports Valuation"; 
        metricVal = `$${hotspot.imports}M`; 
        break;
      case "opportunity": 
        metricLabel = "Opportunity Rating"; 
        metricVal = `${hotspot.opportunity} / 100`; 
        break;
      default:
        metricLabel = "Capacity";
        metricVal = `${hotspot.production} ${hotspot.metricUnit}`;
    }
    
    return `<div style="background: rgba(8, 8, 12, 0.96); color: #fff; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.12); font-family: 'Inter', sans-serif; font-size: 11px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); min-width: 160px;">
      <strong style="font-size: 12px; color: #ffffff; display: block; margin-bottom: 2px;">${name}</strong>
      <span style="font-size: 8px; color: var(--text-secondary); text-transform: uppercase; font-family: monospace;">SOVEREIGN CODE: ${code}</span>
      <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin: 6px 0;"></div>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <span style="color: rgba(255, 255, 255, 0.5); text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.03em;">${metricLabel}</span>
        <span style="color: var(--accent-gold); font-weight: 600;">${metricVal}</span>
      </div>
    </div>`;
  };

  const getTooltipHTMLA = (feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.NAME || "Unknown Country";
    const hotspot = findCountryHotspotInList(feat, compareHotspotsA);
    if (!hotspot) return `<div style="background: rgba(8,8,10,0.95); color: #fff; padding: 6px 12px; border-radius: 6px; font-family: sans-serif; font-size: 11px;"><strong>${name}</strong></div>`;
    return `<div style="background: rgba(8,8,12,0.96); color: #fff; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(207,168,100,0.2); font-family: sans-serif; font-size: 11px; box-shadow: 0 8px 20px rgba(0,0,0,0.6);">
      <strong>${name}</strong>
      <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 6px 0;"></div>
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <span style="color: #aaa; text-transform: uppercase; font-size: 8.5px;">Output</span>
        <span style="color: var(--accent-gold); font-weight: bold;">${hotspot.production} ${hotspot.metricUnit}</span>
      </div>
    </div>`;
  };

  const getTooltipHTMLB = (feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.NAME || "Unknown Country";
    const hotspot = findCountryHotspotInList(feat, compareHotspotsB);
    if (!hotspot) return `<div style="background: rgba(8,8,10,0.95); color: #fff; padding: 6px 12px; border-radius: 6px; font-family: sans-serif; font-size: 11px;"><strong>${name}</strong></div>`;
    return `<div style="background: rgba(8,8,12,0.96); color: #fff; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); font-family: sans-serif; font-size: 11px; box-shadow: 0 8px 20px rgba(0,0,0,0.6);">
      <strong>${name}</strong>
      <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 6px 0;"></div>
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <span style="color: #aaa; text-transform: uppercase; font-size: 8.5px;">Output</span>
        <span style="color: #ffffff; font-weight: bold;">${hotspot.production} ${hotspot.metricUnit}</span>
      </div>
    </div>`;
  };

  // Zoom-based progressive disclosure filtering
  const activePoints = useMemo(() => {
    // Hide regional hotspots/pillars when fully zoomed out to planet level
    if (zoomLevel === "planet" && !selectedHotspot && !selectedCountryId) {
      return [];
    }
    return hotspotsData;
  }, [hotspotsData, zoomLevel, selectedHotspot, selectedCountryId]);

  // Force HTML elements updating by injecting updated key states
  const htmlData = useMemo(() => {
    return hotspotsData.map((h) => ({
      ...h,
      isSelected: selectedHotspot?.id === h.id,
      isHovered: hoveredHotspot?.id === h.id,
      activeHeatmapVal: heatmapMode
    }));
  }, [hotspotsData, selectedHotspot, hoveredHotspot, heatmapMode]);

  const activeHtmlData = useMemo(() => {
    // Hide floating HUD tags at planet level to avoid layout clutter
    if (zoomLevel === "planet" && !selectedHotspot && !selectedCountryId) {
      return [];
    }
    return htmlData;
  }, [htmlData, zoomLevel, selectedHotspot, selectedCountryId]);

  const activeCompareHotspotsA = useMemo(() => {
    if (zoomLevel === "planet" && !selectedHotspot && !selectedCountryId) {
      return [];
    }
    return compareHotspotsA;
  }, [compareHotspotsA, zoomLevel, selectedHotspot, selectedCountryId]);

  const activeCompareHotspotsB = useMemo(() => {
    if (zoomLevel === "planet" && !selectedHotspot && !selectedCountryId) {
      return [];
    }
    return compareHotspotsB;
  }, [compareHotspotsB, zoomLevel, selectedHotspot, selectedCountryId]);

  // Single click & Double click gesture handler
  const handleGlobeClick = (coords: { lat: number; lng: number }) => {
    const currentTime = Date.now();
    const diff = currentTime - lastClickTime.current;
    lastClickTime.current = currentTime;
    
    if (diff < 300) {
      // Double click gesture: zoom in close to coordinate point
      const ref = activeMode === "compare" ? globeRefA : globeRef;
      if (ref.current) {
        ref.current.pointOfView({
          lat: coords.lat,
          lng: coords.lng,
          altitude: 0.9
        }, 1000);
      }
    } else {
      // Single click: clear active selections
      onCountrySelect(null);
      onHotspotSelect(null);
    }
  };

  const handlePolygonClick = (feat: any) => {
    const currentTime = Date.now();
    const diff = currentTime - lastClickTime.current;
    lastClickTime.current = currentTime;
    const code = getCountryCode(feat);
    
    if (diff < 300) {
      // Double click gesture: zoom in close to country centroid
      const center = getFeatureCenter(feat);
      const lat = center.lat;
      const lng = center.lon;
      
      const ref = activeMode === "compare" ? globeRefA : globeRef;
      if (ref.current) {
        ref.current.pointOfView({
          lat,
          lng,
          altitude: 0.8
        }, 1000);
      }
    } else {
      // Single click: Select country and fly to standard zoom altitude
      onCountrySelect(code);
    }
  };

  // 1. DUAL SYNCHRONIZED GLOBES (Compare Mode)
  if (activeMode === "compare") {
    return (
      <div 
        className="globe-container"
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          background: "#010104"
        }}
      >
        {/* Dataset A Globe */}
        <div style={{ flex: 1, height: "100%", position: "relative" }}>
          <div 
            style={{
              position: "absolute",
              top: "92px",
              left: "40px",
              color: "var(--accent-gold)",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 600,
              zIndex: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(0,0,0,0.45)",
              padding: "6px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(207,168,100,0.15)",
              backdropFilter: "blur(6px)"
            }}
          >
            {compareData?.titleA}
          </div>
          <Globe
            ref={globeRefA}
            width={dimensions.width / 2}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={globeImage || undefined}
            globeMaterial={customGlobeMaterial}
            bumpImageUrl={isHolographic || isMobile ? undefined : "https://unpkg.com/three-globe/example/img/earth-topology.png"}
            showAtmosphere={!isMobile}
            atmosphereColor={atmosphereColor}
            atmosphereAltitude={0.15}
            
            // Country Polygon Highlighting & tooltips
            polygonsData={countriesGeoJson?.features || []}
            polygonCapColor={getHexColorA}
            polygonStrokeColor={getStrokeColorA}
            polygonSideColor={() => "rgba(255, 255, 255, 0.04)"}
            polygonAltitude={(feat: any) => getCountryCode(feat) === selectedCountryId ? 0.015 : 0.001}
            polygonLabel={getTooltipHTMLA}
            onPolygonClick={handlePolygonClick}
            onGlobeClick={handleGlobeClick}
            
            // Animated Logistic Trade Corridors
            arcsData={compareData?.payloadA.corridors || []}
            arcStartLat="latFrom"
            arcStartLng="lonFrom"
            arcEndLat="latTo"
            arcEndLng="lonTo"
            arcColor={() => "rgba(207, 168, 100, 0.65)"}
            arcDashLength={0.35}
            arcDashGap={0.25}
            arcDashAnimateTime={2000}
            arcStroke={1.5}
            
            // 3D Pillars
            pointsData={activeCompareHotspotsA}
            pointLat="lat"
            pointLng="lon"
            pointColor={() => "#cfa864"}
            pointAltitude={(d: any) => (d.production / maxValA) * 0.28}
            pointRadius={0.035}
          />
        </div>

        {/* Dataset B Globe */}
        <div style={{ flex: 1, height: "100%", position: "relative", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div 
            style={{
              position: "absolute",
              top: "92px",
              left: "40px",
              color: "#ffffff",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 600,
              zIndex: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(0,0,0,0.45)",
              padding: "6px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(6px)"
            }}
          >
            {compareData?.titleB}
          </div>
          <Globe
            ref={globeRefB}
            width={dimensions.width / 2}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={globeImage || undefined}
            globeMaterial={customGlobeMaterial}
            bumpImageUrl={isHolographic || isMobile ? undefined : "https://unpkg.com/three-globe/example/img/earth-topology.png"}
            showAtmosphere={!isMobile}
            atmosphereColor={atmosphereColor}
            atmosphereAltitude={0.15}
            
            // Country Polygon Highlighting & tooltips
            polygonsData={countriesGeoJson?.features || []}
            polygonCapColor={getHexColorB}
            polygonStrokeColor={getStrokeColorB}
            polygonSideColor={() => "rgba(255, 255, 255, 0.04)"}
            polygonAltitude={(feat: any) => getCountryCode(feat) === selectedCountryId ? 0.015 : 0.001}
            polygonLabel={getTooltipHTMLB}
            onPolygonClick={handlePolygonClick}
            onGlobeClick={handleGlobeClick}
            
            // Animated Logistic Trade Corridors
            arcsData={compareData?.payloadB.corridors || []}
            arcStartLat="latFrom"
            arcStartLng="lonFrom"
            arcEndLat="latTo"
            arcEndLng="lonTo"
            arcColor={() => "rgba(255, 255, 255, 0.6)"}
            arcDashLength={0.35}
            arcDashGap={0.25}
            arcDashAnimateTime={2000}
            arcStroke={1.5}
            
            // 3D Pillars
            pointsData={activeCompareHotspotsB}
            pointLat="lat"
            pointLng="lon"
            pointColor={() => "#ffffff"}
            pointAltitude={(d: any) => (d.production / maxValB) * 0.28}
            pointRadius={0.035}
          />
        </div>
      </div>
    );
  }

  // 2. SINGLE INTERACTIVE WEBGL GLOBE (Standard, Network, Split, and Future modes)
  return (
    <div 
      className="globe-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        background: "#010104"
      }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={globeImage || undefined}
        globeMaterial={customGlobeMaterial}
        bumpImageUrl={isHolographic || isMobile ? undefined : "https://unpkg.com/three-globe/example/img/earth-topology.png"}
        showAtmosphere={!isMobile}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={isHolographic ? 0.2 : 0.14}
        
        // Country Polygon Highlight, borders & interactive labels
        polygonsData={countriesGeoJson?.features || []}
        polygonCapColor={getHexColor}
        polygonStrokeColor={getStrokeColor}
        polygonSideColor={() => (isHolographic ? "rgba(0, 243, 255, 0.15)" : "rgba(255, 255, 255, 0.05)")}
        polygonAltitude={(feat: any) => {
          const code = getCountryCode(feat);
          if (code === selectedCountryId) return 0.015;
          if (code === hoveredCountryId) return 0.008;
          return 0.001;
        }}
        polygonLabel={getTooltipHTML}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={(feat: any) => {
          const code = feat ? getCountryCode(feat) : null;
          setHoveredCountryId(code);
        }}
        onGlobeClick={handleGlobeClick}
        
        // City Labels (Progressive zoom disclosure)
        labelsData={zoomLevel === "city" ? GLOBAL_CITIES : []}
        labelLat="lat"
        labelLng="lon"
        labelText="name"
        labelColor={() => "rgba(255, 255, 255, 0.75)"}
        labelSize={0.45}
        labelDotRadius={0.12}
        labelResolution={2}
        
        // Animated Trade Corridors
        arcsData={zoomLevel !== "city" ? corridorsData : []}
        arcStartLat="latFrom"
        arcStartLng="lonFrom"
        arcEndLat="latTo"
        arcEndLng="lonTo"
        arcColor={(d: any) => {
          if (isHolographic) {
            return ["rgba(0, 243, 255, 0.35)", "rgba(0, 243, 255, 0.85)"];
          }
          return d.type === "energy"
            ? ["rgba(235, 208, 155, 0.3)", "rgba(235, 208, 155, 0.85)"]
            : ["rgba(56, 189, 248, 0.25)", "rgba(56, 189, 248, 0.85)"];
        }}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1600}
        arcStroke={1.5}

        // 3D Regional Hotspot Columns
        pointsData={activePoints}
        pointLat="lat"
        pointLng="lon"
        pointColor={(d: any) => {
          const isSelected = selectedHotspot?.id === d.id;
          const isHovered = hoveredHotspot?.id === d.id;
          if (isHolographic) {
            return isSelected ? "#ffffff" : isHovered ? "#00f3ff" : "rgba(0, 243, 255, 0.8)";
          }
          return isSelected ? "#ebd09b" : isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
        }}
        pointAltitude={(d: any) => {
          let val = d.production;
          switch (heatmapMode) {
            case "production": val = d.production; break;
            case "demand": val = d.demand; break;
            case "growth": val = d.growth; break;
            case "exports": val = d.exports; break;
            case "imports": val = d.imports; break;
            case "opportunity": val = d.opportunity; break;
          }
          const ratio = maxVal > 0 ? (val / maxVal) : 0;
          const baseHeight = 0.05 + ratio * 0.28;
          
          const isSelected = selectedHotspot?.id === d.id;
          const isHovered = hoveredHotspot?.id === d.id;
          return isSelected ? baseHeight * 1.3 : isHovered ? baseHeight * 1.15 : baseHeight;
        }}
        pointRadius={(d: any) => {
          const isSelected = selectedHotspot?.id === d.id;
          return isSelected ? 0.05 : 0.032;
        }}
        onPointClick={(d: any) => onHotspotSelect(d)}
        onPointHover={(d: any) => {
          setHoveredHotspot(d);
          document.body.style.cursor = d ? "pointer" : "default";
        }}

        // Dynamic HTML HUD overlays floating next to coordinates
        htmlElementsData={activeHtmlData}
        htmlLat="lat"
        htmlLng="lon"
        htmlElement={(d: any) => {
          const isSelected = d.isSelected;
          const isHovered = d.isHovered;
          const div = document.createElement("div");
          div.style.pointerEvents = "auto";

          let rawVal = d.production;
          switch (heatmapMode) {
            case "production": rawVal = d.production; break;
            case "demand": rawVal = d.demand; break;
            case "growth": rawVal = d.growth; break;
            case "exports": rawVal = d.exports; break;
            case "imports": rawVal = d.imports; break;
            case "opportunity": rawVal = d.opportunity; break;
          }

          if (isSelected) {
            div.className = "spatial-card";
            div.style.zIndex = "1000";
            div.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9px; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">
                  ${d.category}
                </span>
                <button class="spatial-card-close-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 12px; padding: 2px;">✕</button>
              </div>
              <h3 style="margin: 4px 0; font-family: var(--font-sans); color: #ffffff;">${d.name}</h3>
              <div class="subtle-line"></div>
              ${d.narrative ? `
                <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.45; font-weight: 300; margin: 6px 0 10px 0;">
                  ${d.narrative}
                </p>
                <div class="subtle-line" style="margin-bottom: 8px;"></div>
              ` : ""}
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Output Capacity</span>
                <span class="spatial-card-metric-val">${d.production} ${d.metricUnit}</span>
              </div>
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Demand Intensity</span>
                <span class="spatial-card-metric-val">${d.demand} / 100</span>
              </div>
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Exports</span>
                <span class="spatial-card-metric-val">$${d.exports}M</span>
              </div>
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Imports</span>
                <span class="spatial-card-metric-val">$${d.imports}M</span>
              </div>
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Annual Growth</span>
                <span class="spatial-card-metric-val">${d.growth}%</span>
              </div>
              <div class="spatial-card-metric">
                <span class="spatial-card-metric-label">Opportunity Rating</span>
                <span class="spatial-card-metric-val" style="color: #00ffcc;">${d.opportunity} / 100</span>
              </div>
            `;
            setTimeout(() => {
              const btn = div.querySelector(".spatial-card-close-btn");
              if (btn) {
                btn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  onHotspotSelect(null);
                });
              }
            }, 0);
          } else if (isHovered) {
            div.className = "spatial-label";
            div.innerHTML = `
              <span>${d.name}</span>
              <span style="color: var(--accent-gold); font-weight: bold; border-left: 1px solid rgba(255, 255, 255, 0.15); padding-left: 6px; margin-left: 6px;">
                ${rawVal} ${d.metricUnit.split(" ")[0]}
              </span>
            `;
          } else {
            div.className = "spatial-label-compact";
            div.innerHTML = `<span>${d.name}</span>`;
          }

          return div;
        }}
      />
    </div>
  );
};

export default GlobeScene;
