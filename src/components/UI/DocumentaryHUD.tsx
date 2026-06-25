import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from "lucide-react";
import type { CinematicJourney } from "../../services/narrativeEngine";

interface DocumentaryHUDProps {
  journey: CinematicJourney;
  activeSceneStep: number;
  onSceneStepChange: (step: number) => void;
  onExitJourney: () => void;
}

export const DocumentaryHUD: React.FC<DocumentaryHUDProps> = ({
  journey,
  activeSceneStep,
  onSceneStepChange,
  onExitJourney,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [typedText, setTypedText] = useState("");
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const currentScene = journey.scenes[activeSceneStep];
  const totalSteps = journey.scenes.length;

  // Typewriter effect logic
  useEffect(() => {
    if (!currentScene) return;
    
    let index = 0;
    setTypedText("");
    
    const text = currentScene.narrative;
    const interval = setInterval(() => {
      index++;
      setTypedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 12); // Fast typing speed (12ms per char)

    return () => clearInterval(interval);
  }, [activeSceneStep, currentScene]);

  // Autoplay progression logic
  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (isPlaying) {
      // Auto advance to next scene after 11 seconds (gives ample time to read)
      autoAdvanceTimer.current = setTimeout(() => {
        if (activeSceneStep < totalSteps - 1) {
          onSceneStepChange(activeSceneStep + 1);
        } else {
          setIsPlaying(false); // End of documentary
        }
      }, 11000);
    }

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [isPlaying, activeSceneStep, onSceneStepChange, totalSteps]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleSound = () => setSoundEnabled(!soundEnabled);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "840px",
        zIndex: 1000,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* 1. Chapter Progress Bar (Netflix documentary style) */}
      <div 
        style={{ 
          display: "flex", 
          gap: "6px", 
          width: "100%", 
          padding: "0 4px" 
        }}
      >
        {journey.scenes.map((scene, idx) => {
          const isCurrent = idx === activeSceneStep;
          const isPassed = idx < activeSceneStep;
          
          return (
            <div 
              key={idx}
              onClick={() => onSceneStepChange(idx)}
              style={{
                flex: 1,
                height: "3px",
                backgroundColor: isPassed 
                  ? "var(--accent-gold)" 
                  : isCurrent 
                  ? "rgba(255, 255, 255, 0.6)" 
                  : "rgba(255, 255, 255, 0.15)",
                borderRadius: "2px",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.4s ease",
              }}
              title={scene.title}
            >
              {/* Active animated loading strip */}
              {isCurrent && isPlaying && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 11, ease: "linear" }}
                  key={activeSceneStep}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    backgroundColor: "var(--accent-gold)",
                    borderRadius: "2px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Main Narrative & Subtitle Panel */}
      <div
        className="glass-panel"
        style={{
          width: "100%",
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          border: "1px solid rgba(207, 168, 100, 0.2)",
          backgroundColor: "rgba(6, 6, 8, 0.88)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.75)",
          borderRadius: "24px",
        }}
      >
        {/* Top bar of HUD: Title and Sound indicators */}
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <span 
            style={{ 
              fontSize: "10px", 
              fontWeight: 600, 
              color: "var(--accent-gold)", 
              letterSpacing: "0.15em", 
              textTransform: "uppercase" 
            }}
          >
            {journey.name} // {currentScene?.title}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Animated Soundwave Indicator */}
            {isPlaying && soundEnabled && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "10px" }}>
                {[1.4, 0.6, 1.8, 1.0, 1.5, 0.8].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["2px", `${h * 8}px`, "2px"] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "2px", backgroundColor: "var(--accent-gold)" }}
                  />
                ))}
              </div>
            )}
            
            <button
              onClick={toggleSound}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                outline: "none",
              }}
              title={soundEnabled ? "Mute voiceover narration" : "Enable voiceover narration"}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>
        </div>

        {/* Narrative text with Typewriter animation */}
        <div style={{ minHeight: "68px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.65",
              color: "#ffffff",
              fontWeight: 300,
              textAlign: "center",
              letterSpacing: "0.01em",
              margin: 0,
            }}
          >
            {typedText}
          </p>
        </div>

        {/* Subtle separator */}
        <div className="subtle-line" />

        {/* Bottom Playback Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Exit Button */}
          <button
            onClick={onExitJourney}
            style={{
              background: "rgba(255, 60, 60, 0.12)",
              border: "1px solid rgba(255, 60, 60, 0.2)",
              color: "#ff7777",
              fontSize: "10.5px",
              padding: "5px 12px",
              borderRadius: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              outline: "none",
              transition: "all 0.2s",
            }}
          >
            <X size={11} />
            <span>Exit Journey</span>
          </button>

          {/* Navigation Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => onSceneStepChange(Math.max(0, activeSceneStep - 1))}
              disabled={activeSceneStep === 0}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: activeSceneStep === 0 ? "rgba(255,255,255,0.2)" : "#ffffff",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: activeSceneStep === 0 ? "not-allowed" : "pointer",
                outline: "none",
              }}
            >
              <ChevronLeft size={14} />
            </button>

            {/* Play/Pause Center Trigger */}
            <button
              onClick={togglePlay}
              style={{
                background: "var(--accent-gold)",
                border: "none",
                color: "#000000",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 0 15px rgba(207, 168, 100, 0.45)",
                transition: "all 0.2s",
              }}
            >
              {isPlaying ? <Pause size={15} fill="#000000" /> : <Play size={15} fill="#000000" />}
            </button>

            <button
              onClick={() => {
                if (activeSceneStep < totalSteps - 1) {
                  onSceneStepChange(activeSceneStep + 1);
                } else {
                  onExitJourney();
                }
              }}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Chapter step indicator */}
          <span 
            style={{ 
              fontSize: "11px", 
              color: "var(--text-secondary)", 
              fontFamily: "monospace" 
            }}
          >
            SCENE {activeSceneStep + 1} / {totalSteps}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentaryHUD;
