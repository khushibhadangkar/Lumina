import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, X, Volume2, VolumeX, FastForward } from "lucide-react";
import type { CinematicJourney } from "../../services/narrativeEngine";

interface DocumentaryHUDProps {
  journey: CinematicJourney;
  activeSceneStep: number;
  onSceneStepChange: (step: number) => void;
  onExitJourney: () => void;
}

// Terms that should glow gold
const HIGHLIGHT_TERMS = [
  "Semiconductors", "Lithium", "AI", "Engineers", "Startups", "Data Centers", "Trade Routes",
  "Silicon Valley", "Bangalore", "London", "Dublin", "Hsinchu", "Taiwan", "China", "United States", "Germany", "Japan", "South Korea",
  "TSMC", "DeepMind", "Gansu", "Bhadla", "California", "Singapore", "Sydney",
];

// Helper to highlight terms
const parseNarrativeWithHighlights = (text: string) => {
  let highlighted = text;
  
  // Highlight numbers, percentages, and currencies
  highlighted = highlighted.replace(/(\d+%(?: [A-Za-z]+)?|\$\d+[MBB]?|\d+GW|\d+k? Tons(?: LCE)?)/g, '<span style="color: var(--accent-gold); font-weight: 500;">$1</span>');
  
  // Highlight specific terms
  HIGHLIGHT_TERMS.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span style="color: var(--accent-gold); font-weight: 500;">$1</span>');
  });

  return highlighted;
};

export const DocumentaryHUD: React.FC<DocumentaryHUDProps> = ({
  journey,
  activeSceneStep,
  onSceneStepChange,
  onExitJourney,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const currentScene = journey.scenes[activeSceneStep];
  const totalSteps = journey.scenes.length;

  // Ambient Audio Generator
  useEffect(() => {
    if (soundEnabled && isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!oscillatorRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Deep cinematic drone
        osc.type = 'sine';
        // Base freq on timeline to make future scenes sound higher/different
        const baseFreq = 55 + (currentScene?.timelineVal || 0) * 0.5;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        
        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
      } else {
        // Just update frequency if already running
        const baseFreq = 55 + (currentScene?.timelineVal || 0) * 0.5;
        oscillatorRef.current.frequency.setTargetAtTime(baseFreq, audioCtxRef.current.currentTime, 1);
      }
    } else {
      // Fade out and stop
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
          }
        }, 1000);
      }
    }

    return () => {
      // Audio stops only when component unmounts or state changes
    };
  }, [soundEnabled, isPlaying, activeSceneStep, currentScene]);

  // Clean up audio on unmount explicitly
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch(e) {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

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
    }, 15 / speedMultiplier);

    return () => clearInterval(interval);
  }, [activeSceneStep, currentScene, speedMultiplier]);

  // Autoplay progression logic with Hover Pause
  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    // Only auto-advance if playing and NOT hovering
    if (isPlaying && !isHovering) {
      // Base time is 12 seconds, adjustable by speed
      const duration = (12000) / speedMultiplier;
      autoAdvanceTimer.current = setTimeout(() => {
        if (activeSceneStep < totalSteps - 1) {
          onSceneStepChange(activeSceneStep + 1);
        } else {
          setIsPlaying(false); // End of documentary
        }
      }, duration);
    }

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [isPlaying, isHovering, activeSceneStep, onSceneStepChange, totalSteps, speedMultiplier]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleSound = () => setSoundEnabled(!soundEnabled);
  const toggleSpeed = () => setSpeedMultiplier(prev => prev === 1 ? 1.5 : 1);

  const formattedText = useMemo(() => parseNarrativeWithHighlights(typedText), [typedText]);

  return (
    <motion.div
      className="documentary-hud-fullscreen-wrapper"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: "24px",
      }}
    >
      <div style={{
        width: "88%",
        maxWidth: "800px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "auto",
      }}>
      {/* 1. Chapter Progress Bar (Netflix documentary style) */}
      <div style={{ display: "flex", gap: "6px", width: "100%", padding: "0 4px" }}>
        {journey.scenes.map((scene, idx) => {
          const isCurrent = idx === activeSceneStep;
          const isPassed = idx < activeSceneStep;
          
          return (
            <div 
              key={idx}
              onClick={() => onSceneStepChange(idx)}
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: isPassed 
                  ? "var(--accent-gold)" 
                  : isCurrent 
                  ? "rgba(255, 255, 255, 0.4)" 
                  : "rgba(255, 255, 255, 0.15)",
                borderRadius: "2px",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.4s ease",
              }}
              title={scene.title}
            >
              {/* Active animated loading strip (Pauses on hover) */}
              {isCurrent && isPlaying && !isHovering && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: (12 / speedMultiplier), 
                    ease: "linear",
                  }}
                  key={activeSceneStep}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    backgroundColor: "var(--accent-gold)",
                    borderRadius: "2px",
                    boxShadow: "0 0 8px rgba(207, 168, 100, 0.5)"
                  }}
                />
              )}
              {isCurrent && (isHovering || !isPlaying) && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "100%",
                    backgroundColor: "var(--accent-gold)",
                    opacity: 0.5,
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
        className="glass-panel documentary-hud-panel"
        style={{
          width: "100%",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          border: isHovering ? "1px solid rgba(207, 168, 100, 0.4)" : "1px solid rgba(207, 168, 100, 0.2)",
          backgroundColor: "rgba(6, 6, 8, 0.88)",
          boxShadow: isHovering ? "0 30px 60px rgba(0, 0, 0, 0.85)" : "0 25px 50px rgba(0, 0, 0, 0.75)",
          borderRadius: "16px",
          transition: "all 0.3s ease"
        }}
      >
        {/* Top bar of HUD: Title and Indicators */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--accent-gold)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {journey.name} <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 6px" }}>//</span> {currentScene?.title}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Auto-pause indicator */}
            <AnimatePresence>
              {isHovering && isPlaying && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "6px" }}
                >
                  Paused (Hover)
                </motion.span>
              )}
            </AnimatePresence>

            {isPlaying && soundEnabled && !isHovering && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "8px" }}>
                {[1.4, 0.6, 1.8, 1.0, 1.5, 0.8].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["2px", `${h * 6}px`, "2px"] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "2px", backgroundColor: "var(--accent-gold)" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Narrative text with Typewriter animation and Blinking Cursor */}
        <div style={{ minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <p
            style={{
              fontSize: "13.5px",
              lineHeight: "1.55",
              color: "#ffffff",
              fontWeight: 300,
              textAlign: "center",
              letterSpacing: "0.015em",
              margin: 0,
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: formattedText }} />
            {typedText.length < (currentScene?.narrative.length || 0) && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ marginLeft: "2px", color: "var(--accent-gold)", fontWeight: 500 }}
              >
                |
              </motion.span>
            )}
          </p>
        </div>

        <div className="subtle-line" />

        {/* Bottom Playback Controls - RE-ARCHITECTED FOR PERFECT CENTERING USING GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          
          {/* Left: Exit Button */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={onExitJourney}
              style={{
                background: "rgba(255, 60, 60, 0.12)",
                border: "1px solid rgba(255, 60, 60, 0.2)",
                color: "#ff7777",
                fontSize: "9.5px",
                padding: "5px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                outline: "none",
                transition: "all 0.2s",
              }}
            >
              <X size={11} />
              <span>Exit Journey</span>
            </button>
          </div>

          {/* Absolute Center: Navigation & Scene Indicator stacked perfectly */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            {/* Nav Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => onSceneStepChange(Math.max(0, activeSceneStep - 1))}
                disabled={activeSceneStep === 0}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: activeSceneStep === 0 ? "rgba(255,255,255,0.2)" : "#ffffff",
                  borderRadius: "50%",
                  width: "26px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: activeSceneStep === 0 ? "not-allowed" : "pointer",
                  outline: "none",
                  transition: "all 0.2s",
                }}
              >
                <ChevronLeft size={13} />
              </button>

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
                  transform: isHovering ? "scale(1.05)" : "scale(1)"
                }}
              >
                {isPlaying ? <Pause size={16} fill="#000000" /> : <Play size={16} fill="#000000" />}
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
                  width: "26px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s",
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
            
            {/* Story Path Story Text Centered! */}
            <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
              SCENE {activeSceneStep + 1} / {totalSteps}
            </span>
          </div>

          {/* Right: Auxiliary Controls (Sound & Speed) */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
            <button
              onClick={toggleSpeed}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: speedMultiplier > 1 ? "var(--accent-gold)" : "var(--text-secondary)",
                borderRadius: "20px",
                padding: "4px 8px",
                fontSize: "9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                outline: "none",
                transition: "all 0.2s",
              }}
              title="Toggle Speed"
            >
              <FastForward size={10} />
              <span>{speedMultiplier}x</span>
            </button>
            <button
              onClick={toggleSound}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: soundEnabled ? "#ffffff" : "var(--text-secondary)",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s",
              }}
              title={soundEnabled ? "Mute ambient audio" : "Enable ambient audio"}
            >
              {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
            </button>
          </div>

        </div>
      </div>
      </div>
    </motion.div>
  );
};

export default DocumentaryHUD;
