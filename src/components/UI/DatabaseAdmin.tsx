import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Database, Cloud, RefreshCw, Upload, Terminal } from "lucide-react";
import { db, supabaseAdapter } from "../../services/db";

interface DatabaseAdminProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const DatabaseAdmin: React.FC<DatabaseAdminProps> = ({ onClose, onRefreshData }) => {
  const [dbStatus, setDbStatus] = useState<"local" | "supabase">("local");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  
  // Table row counts
  const [counts, setCounts] = useState<Record<string, number>>({
    countries: 0,
    topics: 0,
    metrics: 0,
    routes: 0
  });

  // CSV Ingestion Form states
  const [ingestType, setIngestType] = useState<"topic" | "schema">("topic");
  const [customTopicName, setCustomTopicName] = useState("");
  const [customTopicSlug, setCustomTopicSlug] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load current connection status and credentials
  useEffect(() => {
    const creds = supabaseAdapter.getCredentials();
    if (supabaseAdapter.isConfigured()) {
      setDbStatus("supabase");
      setSupabaseUrl(creds.url);
      setSupabaseKey(creds.key);
    }
    syncCounts();
  }, []);

  const syncCounts = async () => {
    try {
      const dbCounts = await db.getCounts();
      setCounts(dbCounts);
    } catch (err) {
      console.error("Failed to sync row counts", err);
    }
  };

  const handleConnectSupabase = async () => {
    setIsLoading(true);
    setLogs(prev => [...prev, "Connecting to remote Supabase server..."]);
    try {
      if (supabaseUrl.trim() === "" || supabaseKey.trim() === "") {
        // Clear Supabase configurations
        supabaseAdapter.updateCredentials("", "");
        setDbStatus("local");
        localStorage.removeItem("VITE_SUPABASE_URL");
        localStorage.removeItem("VITE_SUPABASE_ANON_KEY");
        setLogs(prev => [...prev, "Cleared credentials. Fallback to Local IndexedDB database."]);
      } else {
        supabaseAdapter.updateCredentials(supabaseUrl, supabaseKey);
        setDbStatus("supabase");
        localStorage.setItem("VITE_SUPABASE_URL", supabaseUrl);
        localStorage.setItem("VITE_SUPABASE_ANON_KEY", supabaseKey);
        setLogs(prev => [...prev, "Supabase connection active. Synchronizing data..."]);
      }
      await syncCounts();
      onRefreshData();
    } catch (err: any) {
      setLogs(prev => [...prev, `Supabase connection failed: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngest = async () => {
    if (csvContent.trim() === "") {
      setLogs(prev => [...prev, "Error: CSV content is empty."]);
      return;
    }

    setIsLoading(true);
    setLogs(prev => [...prev, "Initializing CSV parser..."]);

    try {
      const res = await db.ingestCSV(
        csvContent,
        ingestType === "topic" ? customTopicName : undefined,
        ingestType === "topic" ? customTopicSlug : undefined
      );

      setLogs(prev => [...prev, ...res.logs]);
      
      if (res.success) {
        setLogs(prev => [...prev, "Ingestion successful! Refreshing UI and active map layers..."]);
        await syncCounts();
        onRefreshData();
      } else {
        setLogs(prev => [...prev, "Ingestion aborted due to errors."]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `Parser Error: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm("Are you sure you want to wipe local tables and perform a clean DB seeding?")) return;
    setIsLoading(true);
    setLogs(prev => [...prev, "Initiating database purge and re-seed..."]);
    try {
      const seedLogs = await db.seed(true);
      setLogs(prev => [...prev, ...seedLogs]);
      await syncCounts();
      onRefreshData();
    } catch (err: any) {
      setLogs(prev => [...prev, `Seed error: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setCsvContent(event.target.result as string);
          setLogs(prev => [...prev, `Loaded file: ${file.name} (${file.size} bytes)`]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setCsvContent(event.target.result as string);
          setLogs(prev => [...prev, `Loaded file: ${file.name} (${file.size} bytes)`]);
        }
      };
      reader.readAsText(file);
    }
  };

  const getExampleCsv = () => {
    if (ingestType === "topic") {
      return `country_code,production,demand,growth,exports,imports,opportunity,summary
BR,45,20,3.2,1800,0,55,Santos Port production expansion
US,0,98,4.5,0,4500,20,New York terminal logistics hubs
IN,12,65,7.8,400,200,85,Bangalore regional production nodes`;
    } else {
      return `table,id,name/title,iso_code/market_size,latitude/growth_rate,longitude/trade_volume,region/source
countries,CA,Canada,CAN,56.1304,-106.3468,North America
topics,hydrogen,Hydrogen Grid,$14.2 Billion,12.5% CAGR,120 GW Capacity,IEA Hydro Core
country_metrics,CA,hydrogen,12,45,6.2,20,1800,90,Vancouver fuel cell logistics pipeline`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel"
      style={{
        position: "absolute",
        right: "32px",
        top: "100px",
        width: "390px",
        maxHeight: "calc(100vh - 160px)",
        overflowY: "auto",
        zIndex: 900,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "22px",
        boxSizing: "border-box",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "18px" }}>
        <div>
          <span style={{ fontSize: "8.5px", fontWeight: 600, color: "var(--accent-gold)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Admin Console
          </span>
          <h3 style={{ fontSize: "20px", fontWeight: 300, color: "#ffffff", margin: "2px 0 0 0" }}>
            Database Control
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
            transition: "all 0.2s"
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Database Connection widget */}
      <div 
        style={{ 
          background: "rgba(255,255,255,0.01)", 
          border: "1px solid rgba(255,255,255,0.04)", 
          borderRadius: "12px", 
          padding: "12px 14px",
          marginBottom: "18px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px", marginBottom: "12px" }}>
          {dbStatus === "supabase" ? (
            <Cloud size={16} style={{ color: "#38bdf8" }} />
          ) : (
            <Database size={16} style={{ color: "var(--accent-gold)" }} />
          )}
          <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", color: "#ffffff" }}>
            DB STATUS: {dbStatus === "supabase" ? "Supabase PostgreSQL Connected" : "Local IndexedDB Database"}
          </span>
        </div>

        {/* Database Status statistics row */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "12px" }}>
          <div>Countries: <span style={{ color: "#ffffff", fontWeight: 500 }}>{counts.countries}</span></div>
          <div>Topics: <span style={{ color: "#ffffff", fontWeight: 500 }}>{counts.topics}</span></div>
          <div>Metrics: <span style={{ color: "#ffffff", fontWeight: 500 }}>{counts.metrics}</span></div>
          <div>Routes: <span style={{ color: "#ffffff", fontWeight: 500 }}>{counts.routes}</span></div>
        </div>

        <div className="subtle-line" style={{ margin: "10px 0" }} />

        {/* Supabase settings inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Supabase Credentials</span>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="Supabase API URL"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "10.5px",
              color: "#ffffff",
              outline: "none"
            }}
          />
          <input
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="Supabase Anon Key"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "10.5px",
              color: "#ffffff",
              outline: "none"
            }}
          />
          <button
            onClick={handleConnectSupabase}
            disabled={isLoading}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              padding: "6px",
              borderRadius: "6px",
              fontSize: "10.5px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Update Server Connection
          </button>
        </div>
      </div>

      {/* CSV Ingestion Dropzone & inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
          Data Ingestion (CSV upload)
        </span>
        
        {/* Switch type */}
        <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
          <button
            onClick={() => setIngestType("topic")}
            style={{
              flex: 1,
              background: ingestType === "topic" ? "rgba(255,255,255,0.05)" : "transparent",
              border: "none",
              color: ingestType === "topic" ? "#ffffff" : "var(--text-secondary)",
              padding: "6px",
              fontSize: "10px",
              cursor: "pointer"
            }}
          >
            Topic Metrics
          </button>
          <button
            onClick={() => setIngestType("schema")}
            style={{
              flex: 1,
              background: ingestType === "schema" ? "rgba(255,255,255,0.05)" : "transparent",
              border: "none",
              color: ingestType === "schema" ? "#ffffff" : "var(--text-secondary)",
              padding: "6px",
              fontSize: "10px",
              cursor: "pointer"
            }}
          >
            Relational Schema
          </button>
        </div>

        {ingestType === "topic" && (
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              value={customTopicName}
              onChange={(e) => setCustomTopicName(e.target.value)}
              placeholder="Topic Name (e.g. Hydrogen)"
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "10.5px",
                color: "#ffffff",
                outline: "none"
              }}
            />
            <input
              type="text"
              value={customTopicSlug}
              onChange={(e) => setCustomTopicSlug(e.target.value)}
              placeholder="Topic Slug (e.g. hydrogen)"
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "10.5px",
                color: "#ffffff",
                outline: "none"
              }}
            />
          </div>
        )}

        {/* Drag & Drop File Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive ? "1px dashed var(--accent-gold)" : "1px dashed rgba(255,255,255,0.12)",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            background: dragActive ? "rgba(207, 168, 100, 0.04)" : "rgba(0,0,0,0.15)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onClick={() => document.getElementById("csv-file-picker")?.click()}
        >
          <input
            type="file"
            id="csv-file-picker"
            accept=".csv"
            onChange={handleFileInput}
            style={{ display: "none" }}
          />
          <Upload size={20} style={{ color: "var(--text-secondary)", marginBottom: "6px" }} />
          <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Drag and drop your dataset CSV file here or <span style={{ color: "var(--accent-gold)" }}>browse</span>
          </p>
        </div>

        {/* Text Area fallback */}
        <textarea
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder={`Or paste CSV contents here...\nExample format:\n${getExampleCsv()}`}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            padding: "10px",
            fontSize: "10px",
            fontFamily: "monospace",
            color: "#ffffff",
            height: "90px",
            resize: "none",
            outline: "none"
          }}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleIngest}
            disabled={isLoading}
            style={{
              flex: 2,
              background: "var(--accent-gold)",
              border: "none",
              color: "#000000",
              padding: "8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Ingest Dataset
          </button>
          
          <button
            onClick={handleReseed}
            disabled={isLoading}
            title="Reseed standard local datasets"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-secondary)",
              padding: "8px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            <RefreshCw size={11} />
            <span>Reset DB</span>
          </button>
        </div>
      </div>

      {/* Terminal log panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <Terminal size={12} />
          <span style={{ fontSize: "9px", textTransform: "uppercase" }}>Ingestion Console Output</span>
        </div>
        
        <div
          style={{
            background: "#000000",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "10px",
            height: "110px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "9.5px",
            color: "#38bdf8",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: "rgba(255,255,255,0.25)" }}>Console ready. Awaiting ingestion...</span>
          ) : (
            logs.map((log, idx) => {
              const isError = log.includes("Error:") || log.includes("failed");
              const isSuccess = log.includes("✦") || log.includes("successful");
              return (
                <span 
                  key={idx} 
                  style={{ 
                    color: isError ? "#ff8888" : isSuccess ? "#10b981" : "#38bdf8" 
                  }}
                >
                  {log}
                </span>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DatabaseAdmin;
