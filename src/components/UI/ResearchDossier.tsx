import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Globe, TrendingUp, Cpu, Award, Sparkles, AlertCircle } from "lucide-react";
import { CountryIntelEngine } from "../../services/countryIntelEngine";
import type { CountryResearchProfile } from "../../services/countryIntelEngine";
import { generateIntelBrief } from "../../services/geminiService";
import type { BriefContext } from "../../services/geminiService";

interface ResearchDossierProps {
  countryId: string;
  searchQuery: string;
  onClose: () => void;
}

type TabType = "overview" | "metrics" | "trade" | "insights" | "topics" | "ai-brief";

export const ResearchDossier: React.FC<ResearchDossierProps> = ({ countryId, searchQuery, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dossier, setDossier] = useState<CountryResearchProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Brief state
  const [briefText, setBriefText] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefDone, setBriefDone] = useState(false);
  const [briefError, setBriefError] = useState("");
  const briefRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    CountryIntelEngine.getProfile(countryId, searchQuery).then((data) => {
      if (active) {
        setDossier(data);
        setIsLoading(false);
      }
    });
    // Reset AI brief when country or topic changes
    setBriefText("");
    setBriefDone(false);
    setBriefError("");
    setBriefLoading(false);

    return () => {
      active = false;
    };
  }, [countryId, searchQuery]);

  if (isLoading) {
    return (
      <div
        className="glass-panel dossier-panel"
        style={{
          position: "absolute",
          left: "32px",
          top: "100px",
          width: "370px",
          height: "300px",
          zIndex: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "20px",
          boxSizing: "border-box"
        }}
      >
        <span style={{ fontSize: "10px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Querying Intel Core...
        </span>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel dossier-panel"
      style={{
        position: "absolute",
        left: "32px",
        top: "100px",
        width: "370px",
        maxHeight: "calc(100vh - 160px)",
        overflowY: "auto",
        zIndex: 900,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        boxSizing: "border-box",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* Dossier Header */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          marginBottom: "16px"
        }}
      >
        <div>
          <span 
            style={{ 
              fontSize: "9px", 
              fontWeight: 600, 
              color: "var(--accent-gold)", 
              letterSpacing: "0.15em", 
              textTransform: "uppercase" 
            }}
          >
            Geospatial Intel Dossier // {dossier.id}
          </span>
          <h3 
            style={{ 
              fontSize: "22px", 
              fontWeight: 300, 
              color: "#ffffff", 
              margin: "2px 0 0 0" 
            }}
          >
            {dossier.name}
          </h3>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-secondary)",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <X size={13} />
        </button>
      </div>

      {/* Global Ranking Spotlight Panel */}
      {dossier.globalRanking !== "N/A" && (
        <div
          style={{
            background: "rgba(207, 168, 100, 0.06)",
            border: "1px solid rgba(207, 168, 100, 0.15)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <Award size={18} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "8px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Global Network Ranking
            </span>
            <span style={{ fontSize: "11.5px", color: "#ffffff", fontWeight: 400, marginTop: "1px" }}>
              {dossier.globalRanking}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Monospace Bloomberg style) */}
      <div 
        style={{ 
          display: "flex", 
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "16px",
          gap: "4px"
        }}
      >
        {(["overview", "metrics", "trade", "insights", "topics", "ai-brief"] as TabType[]).map(tab => {
          const isActive = activeTab === tab;
          const isAI = tab === "ai-brief";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${isAI ? "#a78bfa" : "var(--accent-gold)"}`
                  : "2px solid transparent",
                color: isActive
                  ? isAI ? "#a78bfa" : "#ffffff"
                  : "var(--text-secondary)",
                padding: "8px 0",
                fontSize: "9px",
                textTransform: "uppercase",
                fontFamily: "monospace",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s",
                fontWeight: isActive ? 600 : 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px"
              }}
            >
              {isAI && <Sparkles size={8} />}
              {tab === "ai-brief" ? "AI" : tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Geospatial Synopsis
              </span>
              <p style={{ fontSize: "11.5px", lineHeight: "1.6", color: "var(--text-primary)", fontWeight: 300 }}>
                {dossier.overview}
              </p>
            </div>

            <div className="subtle-line" />

            <div>
              <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Active Market Context
              </span>
              <p style={{ fontSize: "11.5px", lineHeight: "1.6", color: "var(--text-primary)", fontWeight: 300 }}>
                {searchQuery ? `This intelligence dossier is dynamically configured for the active topic search: "${searchQuery}". Review topic-specific ranks, trade partners, and metrics in the following tabs.` : `Search for a topic (e.g. "Coffee") to map active resource flows and trade networks directly onto this sovereign profile.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. KEY METRICS & GROWTH TAB */}
        {activeTab === "metrics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Growth Rate Highlight */}
            <div
              style={{
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                alignItems: "start",
                gap: "10px"
              }}
            >
              <TrendingUp size={16} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "8.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Growth Vector
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 300, lineHeight: "1.45", marginTop: "2px" }}>
                  {dossier.growth}
                </span>
              </div>
            </div>

            <div className="subtle-line" />

            <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block" }}>
              Key Dossier Metrics
            </span>
            
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginTop: "4px" }}>
              <tbody>
                {Object.entries(dossier.keyMetrics).map(([key, val]) => (
                  <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 0", color: "var(--text-secondary)", fontWeight: 300 }}>{key}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "var(--accent-gold)", fontWeight: 500 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* 3. TRADE PARTNERS TAB */}
        {activeTab === "trade" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block" }}>
              Trade Partners & Logistic Corridors
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dossier.tradePartners.map((rel, idx) => {
                const isExport = rel.includes("Export") || rel.startsWith("Exports");
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      background: "rgba(255,255,255,0.01)", 
                      border: "1px solid rgba(255,255,255,0.04)", 
                      borderRadius: "8px", 
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "start",
                      gap: "8px"
                    }}
                  >
                    {isExport ? (
                      <TrendingUp size={13} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                    ) : (
                      <Globe size={13} style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "2px" }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {isExport ? "LOGISTICS EXPORT CHANNELS" : "LOGISTICS IMPORT DEPENDENCY"}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 300, marginTop: "2px" }}>
                        {rel.replace("Exports: ", "").replace("Imports: ", "").replace("Export Link to ", "").replace("Import Link from ", "")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 4. AI GENERATED INSIGHTS TAB */}
        {activeTab === "insights" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block" }}>
              AI Generated Strategic Insights
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dossier.aiInsights.map((insight, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: "flex", 
                    gap: "10px", 
                    alignItems: "start",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid rgba(255,255,255,0.03)",
                    padding: "10px 12px",
                    borderRadius: "10px"
                  }}
                >
                  <Cpu size={14} style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.55", fontWeight: 300 }}>
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 5. RELATED TOPICS TAB */}
        {/* 6. AI INTELLIGENCE BRIEF TAB */}
        {activeTab === "ai-brief" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={13} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: "9px", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                Gemini AI Intelligence Brief
              </span>
            </div>

            {/* Context line */}
            <p style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 300, lineHeight: "1.5", margin: 0 }}>
              Live analysis grounded in Lumina's scored data for{" "}
              <span style={{ color: "#ffffff" }}>{dossier?.name}</span>{" × "}
              <span style={{ color: "var(--accent-gold)" }}>{searchQuery || "current topic"}</span>.
            </p>

            {/* Generate button */}
            {!briefLoading && !briefDone && !briefError && (
              <button
                onClick={async () => {
                  if (!dossier) return;
                  setBriefLoading(true);
                  setBriefText("");
                  setBriefError("");
                  setBriefDone(false);

                  // Build context from dossier data
                  const metrics = dossier.keyMetrics as Record<string, string>;
                  const ctx: BriefContext = {
                    countryName: dossier.name,
                    countryId: countryId,
                    topic: searchQuery || "global trade",
                    productionScore: parseFloat(metrics["Production Score"] || metrics["Production"] || "0") || 0,
                    demandScore: parseFloat(metrics["Demand Score"] || metrics["Demand"] || "0") || 0,
                    growthScore: parseFloat(metrics["Growth Score"] || metrics["Growth Rate"] || "0") || 0,
                    exportScore: parseFloat(metrics["Export Score"] || metrics["Exports"] || "0") || 0,
                    importScore: parseFloat(metrics["Import Score"] || metrics["Imports"] || "0") || 0,
                    opportunityScore: parseFloat(metrics["Opportunity Score"] || metrics["Opportunity"] || "0") || 0,
                    summary: dossier.overview || "",
                    insights: dossier.aiInsights || [],
                    tradePartners: dossier.tradePartners || [],
                    region: dossier.region || "",
                  };

                  await generateIntelBrief(
                    ctx,
                    (chunk) => {
                      setBriefText(prev => prev + chunk);
                      // Auto-scroll
                      if (briefRef.current) {
                        briefRef.current.scrollTop = briefRef.current.scrollHeight;
                      }
                    },
                    () => {
                      setBriefLoading(false);
                      setBriefDone(true);
                    },
                    (err) => {
                      setBriefLoading(false);
                      setBriefError(err);
                    }
                  );
                }}
                style={{
                  background: "rgba(167, 139, 250, 0.08)",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  color: "#a78bfa",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  outline: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s ease",
                  width: "100%",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(167, 139, 250, 0.15)";
                  e.currentTarget.style.borderColor = "#a78bfa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(167, 139, 250, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                }}
              >
                <Sparkles size={11} />
                Generate Intelligence Brief
              </button>
            )}

            {/* Loading pulse */}
            {briefLoading && briefText === "" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 0" }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#a78bfa",
                  animation: "pulse 1.2s ease-in-out infinite"
                }} />
                <span style={{ fontSize: "10px", color: "#a78bfa", fontFamily: "monospace" }}>
                  Querying Gemini Intelligence Core...
                </span>
              </div>
            )}

            {/* Streaming text output */}
            {briefText && (
              <div
                ref={briefRef}
                style={{
                  background: "rgba(167, 139, 250, 0.04)",
                  border: "1px solid rgba(167, 139, 250, 0.12)",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "11px",
                  lineHeight: "1.7",
                  color: "var(--text-primary)",
                  fontWeight: 300,
                  whiteSpace: "pre-wrap",
                  maxHeight: "320px",
                  overflowY: "auto",
                  position: "relative"
                }}
              >
                {briefText}
                {briefLoading && (
                  <span style={{
                    display: "inline-block",
                    width: "2px",
                    height: "12px",
                    background: "#a78bfa",
                    marginLeft: "2px",
                    verticalAlign: "middle",
                    animation: "blink 0.8s step-end infinite"
                  }} />
                )}
              </div>
            )}

            {/* Regenerate button */}
            {briefDone && (
              <button
                onClick={() => {
                  setBriefText("");
                  setBriefDone(false);
                  setBriefError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  outline: "none",
                  letterSpacing: "0.08em",
                  padding: "4px 0"
                }}
              >
                ↺ Regenerate Brief
              </button>
            )}

            {/* Error state */}
            {briefError && (
              <div style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "10px",
                padding: "12px"
              }}>
                <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "10px", color: "#ef4444", lineHeight: "1.5" }}>{briefError}</span>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "topics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block" }}>
              Geospatial Related Topics
            </span>
            
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 300, lineHeight: "1.5" }}>
              Click any of the high-relevance topics below to reload the global trade corridors, network flows, and regional hotspot pillars.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {dossier.relatedTopics.map((topic) => (
                <button
                  key={topic}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "6px 14px",
                    color: "var(--text-primary)",
                    fontSize: "10.5px",
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    outline: "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(207, 168, 100, 0.12)";
                    e.currentTarget.style.borderColor = "var(--accent-gold)";
                    e.currentTarget.style.color = "var(--accent-gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onClick={() => {
                    // We can select the topic directly!
                    // To do this, we can trigger the search event. Since we are inside ResearchDossier, 
                    // we can dispatch a custom event or let the user click search manually.
                    // Let's dispatch a custom event "changeTopic" or trigger search.
                    const event = new CustomEvent("changeTopic", { detail: topic });
                    window.dispatchEvent(event);
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="subtle-line" style={{ margin: "16px 0 8px 0" }} />
      
      {/* Dossier Footer Log */}
      <span 
        style={{ 
          fontSize: "8.5px", 
          color: "var(--text-secondary)", 
          textAlign: "center",
          fontFamily: "monospace" 
        }}
      >
        CLASSIFIED // PALANTIR GLOBAL TWIN INDEX
      </span>
    </motion.div>
  );
};

export default ResearchDossier;
