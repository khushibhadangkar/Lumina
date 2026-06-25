import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ShieldAlert } from "lucide-react";
import type { IntelligencePayload } from "../../services/dataEngine";

interface DataOverlayProps {
  searchQuery: string;
  activeMode: string;
  selectedHotspot: any;
  onCloseHotspot: () => void;
  hoveredHotspot: any;
  intelPayload: IntelligencePayload | null;
  heatmapMode: string;
  onHeatmapModeChange: (mode: string) => void;
  compareData: {
    titleA: string;
    titleB: string;
    payloadA: IntelligencePayload;
    payloadB: IntelligencePayload;
  } | null;
}

export const DataOverlay: React.FC<DataOverlayProps> = ({
  searchQuery: _searchQuery,
  activeMode,
  selectedHotspot: _selectedHotspot,
  onCloseHotspot: _onCloseHotspot,
  hoveredHotspot,
  intelPayload,
  heatmapMode,
  onHeatmapModeChange,
  compareData,
}) => {
  const [rotationVelocity, setRotationVelocity] = useState("465.1");
  const [axialTilt] = useState("23.44°");
  const [solarDist, setSolarDist] = useState("1.0167");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [telemetryExpanded, setTelemetryExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationVelocity((465.101 + Math.random() * 0.005).toFixed(4));
      setSolarDist((1.0167 + Math.random() * 0.00004).toFixed(6));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!intelPayload) return null;

  const isCompare = activeMode === "compare" && compareData !== null;
  const overview = intelPayload.overview;

  return (
    <div
      className="overlay-wrapper"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      {/* ================= HEADER TELEMETRY BOARD ================= */}
      <div className="overlay-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pointerEvents: "auto" }}>
        <div>
          <h2 className="documentary-title" style={{ fontSize: isMobile ? "12px" : "14px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            LUMINA // INTEL CORE
          </h2>
          <p style={{ fontSize: "9px", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "4px" }}>
            Source: {isCompare ? compareData.payloadA.overview.source : overview.source}
          </p>

          {/* Floating Heatmap Selector (Horizontal pill list under header) */}
          {!isCompare && !isMobile && (
            <div style={{ display: "flex", gap: "6px", marginTop: "14px" }}>
              {["production", "demand", "growth", "exports", "imports", "opportunity"].map(mode => {
                const isSelected = heatmapMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => onHeatmapModeChange(mode)}
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.01)",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.04)",
                      color: isSelected ? "#ffffff" : "var(--text-secondary)",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Global physical parameters */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          {isMobile && (
            <button
              onClick={() => setTelemetryExpanded(!telemetryExpanded)}
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-secondary)",
                fontSize: "9px",
                padding: "4px 10px",
                borderRadius: "12px",
                cursor: "pointer",
                textTransform: "uppercase",
                backdropFilter: "blur(4px)"
              }}
            >
              {telemetryExpanded ? "Hide Telemetry -" : "Telemetry +"}
            </button>
          )}

          {(!isMobile || telemetryExpanded) && (
            <div 
              className="overlay-telemetry"
              style={{
                display: "flex",
                gap: "24px",
                fontSize: "10px",
                color: "var(--text-primary)",
                background: "rgba(0, 0, 0, 0.25)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.04)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontWeight: 300,
              }}
            >
              <div>
                <span style={{ color: "var(--text-secondary)" }}>ROTATION: </span>
                <span>{rotationVelocity} m/s</span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>AXIAL TILT: </span>
                <span>{axialTilt}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>SOLAR DIST: </span>
                <span>{solarDist} AU</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= COMPACT FLOATING COMPARE SUMMARY ================= */}
      {isCompare && (
        <div 
          className="glass-panel compare-summary" 
          style={{
            position: "absolute",
            left: "32px",
            top: "100px",
            width: "300px",
            padding: "18px",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 10
          }}
        >
          <h4 style={{ fontSize: "11px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Compare: {compareData.titleA} vs {compareData.titleB}
          </h4>
          <div className="subtle-line" />
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Market Size</span>
            <span>{compareData.payloadA.overview.marketSize} / {compareData.payloadB.overview.marketSize}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Growth Rate</span>
            <span style={{ color: "var(--accent-gold)" }}>{compareData.payloadA.overview.growthRate} / {compareData.payloadB.overview.growthRate}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Primary Producer</span>
            <span>{compareData.payloadA.overview.producers[0]} / {compareData.payloadB.overview.producers[0]}</span>
          </div>
          
          <div className="subtle-line" />
          <div style={{ display: "flex", alignItems: "start", gap: "6px", fontSize: "9px", color: "var(--text-secondary)" }}>
            <ShieldAlert size={12} style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "1px" }} />
            <span>Dual-globes synchronized. Left highlights {compareData.titleA}, right highlights {compareData.titleB}.</span>
          </div>
        </div>
      )}

      {/* ================= BOTTOM CONSOLE STATUS BAR ================= */}
      <div className="overlay-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "9px", color: "var(--text-secondary)", pointerEvents: "auto" }}>
        <span>LUMINA GLOBAL INTELLIGENCE DECK // COMPLY WGS-84</span>
        
        <AnimatePresence>
          {hoveredHotspot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "30px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px"
              }}
            >
              <Compass size={11} className="pulse-glow" style={{ color: "var(--accent-gold)" }} /> 
              <span>Inspect details for {hoveredHotspot.name}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <span>WGS-84 OBLATE SPHEROID MESH</span>
      </div>
    </div>
  );
};

export default DataOverlay;
