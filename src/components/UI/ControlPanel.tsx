import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Split, 
  GitCompare, 
  Clock, 
  Eye 
} from "lucide-react";

interface ControlPanelProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
  timelineVal: number;
  onTimelineChange: (val: number) => void;
  comparePreset: string;
  onComparePresetChange: (preset: string) => void;
  
  // Story mode variables
  activeStoryId: string | null;
  activeStoryStep: number;
  onStoryStepChange: (step: number) => void;
  onExitStory: () => void;
  activeStoryName?: string;
  totalSteps?: number;
}

interface ModeButton {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const MODES: ModeButton[] = [
  { id: "network", name: "Network Map", icon: Globe, description: "Display thin route flows" },
  { id: "split", name: "Split Globe", icon: Split, description: "Split Earth hemispheres" },
  { id: "compare", name: "Compare Mode", icon: GitCompare, description: "Synchronized dual views" },
  { id: "future", name: "Projection", icon: Eye, description: "Render forecast layers" },
  { id: "timeline", name: "Timeline Mode", icon: Clock, description: "Toggle chronological controls" }
];

const COMPARISONS = [
  { id: "coffee-tea", label: "Coffee vs Tea" },
  { id: "solar-wind", label: "Solar vs Wind" },
  { id: "ai-software", label: "AI vs Software Engineers" }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeMode,
  onModeChange,
  timelineVal,
  onTimelineChange,
  comparePreset,
  onComparePresetChange,
  
  activeStoryId,
  activeStoryStep,
  onStoryStepChange,
  onExitStory,
  activeStoryName = "Active Story",
  totalSteps = 1,
}) => {
  const handleModeClick = (modeId: string) => {
    if (activeMode === modeId) {
      onModeChange(""); // Deactivate mode
    } else {
      onModeChange(modeId);
    }
  };

  return (
    <motion.div
      className="control-wrapper"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      style={{
        position: "absolute",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "680px",
        zIndex: 100,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "0 16px",
      }}
    >
      {activeStoryId ? (
        /* ================= STORY NAVIGATION DECK ================= */
        <div
          className="glass-panel"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 18px",
            width: "100%",
            borderRadius: "32px",
            border: "1px solid rgba(207, 168, 100, 0.25)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            gap: "10px",
          }}
        >
          <button
            onClick={() => onStoryStepChange(Math.max(0, activeStoryStep - 1))}
            disabled={activeStoryStep === 0}
            style={{
              background: "transparent",
              border: "none",
              cursor: activeStoryStep === 0 ? "not-allowed" : "pointer",
              padding: "6px 14px",
              color: activeStoryStep === 0 ? "var(--text-secondary)" : "#ffffff",
              fontSize: "11px",
              opacity: activeStoryStep === 0 ? 0.3 : 1,
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              outline: "none",
              transition: "all 0.2s ease",
            }}
          >
            ← Back
          </button>

          <span style={{ fontSize: "11px", color: "var(--accent-gold)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {activeStoryName} • Step {activeStoryStep + 1} of {totalSteps}
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                if (activeStoryStep < totalSteps - 1) {
                  onStoryStepChange(activeStoryStep + 1);
                } else {
                  onExitStory();
                }
              }}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
                padding: "6px 16px",
                borderRadius: "20px",
                color: "#ffffff",
                fontSize: "11px",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s ease",
              }}
            >
              {activeStoryStep === totalSteps - 1 ? "Finish" : "Next →"}
            </button>

            <button
              onClick={onExitStory}
              style={{
                background: "rgba(255, 60, 60, 0.1)",
                border: "1px solid rgba(255, 60, 60, 0.25)",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "20px",
                color: "#ff8888",
                fontSize: "11px",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s ease",
              }}
            >
              Exit
            </button>
          </div>
        </div>
      ) : (
        /* ================= REGULAR CONTROLS ================= */
        <>
          {/* 1. Compare Presets Bar */}
          <AnimatePresence>
            {activeMode === "compare" && (
              <motion.div
                initial={{ opacity: 0, y: 15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 15, height: 0 }}
                className="glass-panel"
                style={{
                  padding: "10px 18px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 15px 30px rgba(0, 0, 0, 0.35)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  Compare Presets:
                </span>

                <div className="compare-presets" style={{ display: "flex", gap: "6px" }}>
                  {COMPARISONS.map(item => {
                    const isPresetSelected = comparePreset === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onComparePresetChange(item.id)}
                        style={{
                          background: isPresetSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                          border: isPresetSelected ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
                          color: isPresetSelected ? "#ffffff" : "var(--text-secondary)",
                          borderRadius: "20px",
                          padding: "4px 12px",
                          fontSize: "10.5px",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          transition: "all 0.2s ease",
                          outline: "none",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Timeline scrubbing console */}
          {activeMode === "timeline" && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 15 }}
              className="glass-panel"
              style={{
                padding: "14px 22px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.35)",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 400 }}>
                  Chronological Slider: AD {2026 + Math.floor(timelineVal)}
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Active Interpolation
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", width: "30px" }}>
                  2026
                </span>
                
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={timelineVal}
                  onChange={(e) => onTimelineChange(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "#ffffff",
                    background: "rgba(255, 255, 255, 0.08)",
                    outline: "none",
                    height: "2px",
                    borderRadius: "1px",
                    cursor: "pointer",
                  }}
                />

                <span style={{ fontSize: "10px", color: "var(--text-secondary)", width: "30px", textAlign: "right" }}>
                  2076
                </span>
              </div>

              {/* Timeline markings */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  paddingLeft: "36px", 
                  paddingRight: "36px",
                  marginTop: "2px"
                }}
              >
                {[2026, 2036, 2046, 2056, 2066, 2076].map((year) => {
                  const currentYear = 2026 + Math.floor(timelineVal);
                  const isPassed = currentYear >= year;
                  
                  return (
                    <div key={year} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div 
                        style={{ 
                          width: "1px", 
                          height: "3px", 
                          backgroundColor: isPassed ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
                          transition: "background-color 0.2s ease"
                        }} 
                      />
                      <span 
                        style={{ 
                          fontSize: "8.5px", 
                          fontWeight: 300,
                          color: isPassed ? "var(--text-primary)" : "var(--text-secondary)",
                          transition: "color 0.2s ease"
                        }}
                      >
                        {year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 3. Main Control Deck Buttons Panel (Apple style capsule) */}
          <div
            className="glass-panel control-modes"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 8px",
              width: "100%",
              borderRadius: "32px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              gap: "4px",
            }}
          >
            {MODES.map((mode) => {
              const isActive = activeMode === mode.id;
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeClick(mode.id)}
                  style={{
                    flex: 1,
                    background: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "20px",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    outline: "none",
                  }}
                  title={mode.description}
                >
                  <div 
                    style={{ 
                      color: isActive ? "#ffffff" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.3s ease"
                    }}
                  >
                    <Icon size={14} />
                  </div>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "#ffffff" : "var(--text-secondary)",
                      letterSpacing: "0.02em",
                      transition: "color 0.3s ease"
                    }}
                  >
                    {mode.name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ControlPanel;
