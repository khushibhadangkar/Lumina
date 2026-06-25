import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { HotspotData } from "../../services/dataEngine";

interface HotspotsProps {
  hotspotsData: HotspotData[];
  heatmapMode: string; // "production" | "demand" | "growth" | "exports" | "imports" | "opportunity"
  onSelect: (hotspot: HotspotData & { pos: THREE.Vector3 }) => void;
  selectedHotspot: any;
  hoveredHotspot: any;
  setHoveredHotspot: (hotspot: any) => void;
  sharedRotationY: React.MutableRefObject<number>;
  themeColor?: "gold" | "white" | "silver";
}

// 3D Spherical projection coordinate mapping helper
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

export const Hotspots: React.FC<HotspotsProps> = ({
  hotspotsData,
  heatmapMode,
  onSelect,
  selectedHotspot,
  hoveredHotspot,
  setHoveredHotspot,
  sharedRotationY,
  themeColor,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [zoomLevel, setZoomLevel] = useState<"planet" | "country" | "city">("planet");
  const lastLevel = useRef<string>("");

  // 1. Process the incoming dynamic hotspots: project coordinates and set orientations
  const processedHotspots = useMemo(() => {
    const radius = 2.0;
    const upVector = new THREE.Vector3(0, 1, 0);

    return hotspotsData.map(h => {
      const pos = latLonToVector3(h.lat, h.lon, radius);
      const outwardNormal = pos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, outwardNormal);
      
      return {
        ...h,
        pos,
        quaternion
      };
    });
  }, [hotspotsData]);

  // 2. Sync rotation with Earth & measure camera distance for progressive disclosure
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = sharedRotationY.current;
    }
    
    const dist = state.camera.position.length();
    let currentLevel: "planet" | "country" | "city" = "planet";
    if (dist > 7.5) {
      currentLevel = "planet";
    } else if (dist > 4.5) {
      currentLevel = "country";
    } else {
      currentLevel = "city";
    }
    
    if (lastLevel.current !== currentLevel) {
      lastLevel.current = currentLevel;
      setZoomLevel(currentLevel);
    }
  });

  // 3. Find the maximum value in current mode to normalize heights elegantly
  const maxVal = useMemo(() => {
    if (processedHotspots.length === 0) return 1;
    return Math.max(...processedHotspots.map(h => {
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
  }, [processedHotspots, heatmapMode]);

  return (
    <group ref={groupRef}>
      {processedHotspots.map((hotspot) => {
        const isSelected = selectedHotspot?.id === hotspot.id;
        const isHovered = hoveredHotspot?.id === hotspot.id;

        // Extract value based on selected heatmap criteria
        let rawVal = hotspot.production;
        switch (heatmapMode) {
          case "production": rawVal = hotspot.production; break;
          case "demand": rawVal = hotspot.demand; break;
          case "growth": rawVal = hotspot.growth; break;
          case "exports": rawVal = hotspot.exports; break;
          case "imports": rawVal = hotspot.imports; break;
          case "opportunity": rawVal = hotspot.opportunity; break;
        }

        // Normalize height representation: minimum height 0.08, maximum 0.28
        const normalizedRatio = maxVal > 0 ? (rawVal / maxVal) : 0;
        const baseHeight = 0.08 + normalizedRatio * 0.20;
        const height = isSelected ? baseHeight * 1.3 : isHovered ? baseHeight * 1.15 : baseHeight;

        // Custom theme shading based on globe comparison overlays
        let markerColor = isSelected ? "#cfa864" : isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.55)";
        let pillarColor = isSelected ? "rgba(207, 168, 100, 0.45)" : isHovered ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.06)";

        if (themeColor === "gold") {
          markerColor = isSelected ? "#ffffff" : isHovered ? "#ffe0a0" : "rgba(207, 168, 100, 0.65)";
          pillarColor = isSelected ? "rgba(255, 255, 255, 0.45)" : isHovered ? "rgba(207, 168, 100, 0.35)" : "rgba(207, 168, 100, 0.10)";
        } else if (themeColor === "silver") {
          markerColor = isSelected ? "#cfa864" : isHovered ? "#ffffff" : "rgba(180, 190, 210, 0.65)";
          pillarColor = isSelected ? "rgba(207, 168, 100, 0.45)" : isHovered ? "rgba(255, 255, 255, 0.3)" : "rgba(180, 190, 210, 0.10)";
        }

        // Determine which type of label to render based on progressive disclosure
        const shouldShowDetailed = isSelected || isHovered || zoomLevel === "city";
        const shouldShowCompact = zoomLevel === "country" && !shouldShowDetailed;
        const shouldHide = zoomLevel === "planet" && !isSelected && !isHovered;

        return (
          <group
            key={hotspot.id}
            position={hotspot.pos}
            quaternion={hotspot.quaternion}
          >
            {/* Flat target ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.024, 0.032, 16]} />
              <meshBasicMaterial color={markerColor} transparent opacity={0.65} />
            </mesh>

            {/* Faint document map ripple */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[2.0, 2.0, 1.0]}>
              <ringGeometry args={[0.02, 0.04, 16]} />
              <meshBasicMaterial 
                color={markerColor} 
                transparent 
                opacity={isHovered || isSelected ? 0.1 : 0.02} 
              />
            </mesh>

            {/* Rising indicator pin */}
            <mesh 
              position={[0, height / 2, 0]} 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hotspot);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredHotspot(hotspot);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredHotspot(null);
                document.body.style.cursor = "default";
              }}
            >
              <cylinderGeometry args={[0.003, 0.003, height, 8]} />
              <meshBasicMaterial 
                color={pillarColor} 
                transparent 
                opacity={0.8}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Pointer node core */}
            <mesh position={[0, height, 0]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial 
                color={markerColor} 
                transparent 
                opacity={0.9} 
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Projected HTML Overlays */}
            {!shouldHide && (
              <Html
                position={[0, height + 0.05, 0]}
                center
                distanceFactor={6}
                occlude
                style={{
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  pointerEvents: "auto",
                }}
              >
                {shouldShowDetailed ? (
                  <div className="spatial-card" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                        {hotspot.category}
                      </span>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onSelect(null as any); 
                        }}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "var(--text-secondary)", 
                          cursor: "pointer", 
                          fontSize: "12px",
                          padding: "2px"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <h3 style={{ margin: "4px 0" }}>{hotspot.name}</h3>
                    <div className="subtle-line" />
                    
                    {/* Render story narrative if available */}
                    {(hotspot as any).narrative && (
                      <>
                        <p style={{ 
                          fontSize: "11px", 
                          color: "var(--text-secondary)", 
                          lineHeight: "1.45", 
                          fontWeight: 300,
                          margin: "6px 0 10px 0"
                        }}>
                          {(hotspot as any).narrative}
                        </p>
                        <div className="subtle-line" style={{ marginBottom: "8px" }} />
                      </>
                    )}
                    
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Output Capacity</span>
                      <span className="spatial-card-metric-val">{hotspot.production} {hotspot.metricUnit}</span>
                    </div>
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Demand Intensity</span>
                      <span className="spatial-card-metric-val">{hotspot.demand} / 100</span>
                    </div>
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Exports</span>
                      <span className="spatial-card-metric-val">${hotspot.exports}M</span>
                    </div>
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Imports</span>
                      <span className="spatial-card-metric-val">${hotspot.imports}M</span>
                    </div>
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Annual Growth</span>
                      <span className="spatial-card-metric-val">{hotspot.growth}%</span>
                    </div>
                    <div className="spatial-card-metric">
                      <span className="spatial-card-metric-label">Opportunity Rating</span>
                      <span className="spatial-card-metric-val" style={{ color: "#00ffcc" }}>
                        {hotspot.opportunity} / 100
                      </span>
                    </div>
                  </div>
                ) : shouldShowCompact ? (
                  <div 
                    className="spatial-label"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(hotspot);
                    }}
                    onMouseEnter={() => setHoveredHotspot(hotspot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <span>{hotspot.name}</span>
                    <span style={{ 
                      color: "var(--accent-gold)", 
                      fontWeight: "bold", 
                      borderLeft: "1px solid rgba(255, 255, 255, 0.15)", 
                      paddingLeft: "6px" 
                    }}>
                      {rawVal} {hotspot.metricUnit.split(" ")[0]}
                    </span>
                  </div>
                ) : null}
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default Hotspots;
