"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import VehicleCard from "./components/VehicleCard";
import FleetSummaryBar from "./components/FleetSummaryBar";
import DemoControlPanel from "./components/DemoControlPanel";
import LiveThreatFeed, { LogEntry } from "./components/LiveThreatFeed";
import { Shield, ShieldCheck, Activity, Cpu, Info } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cryptoInfo, setCryptoInfo] = useState<any>(null);
  const prevVehiclesRef = useRef<any[]>([]);
  const [showPiTooltip, setShowPiTooltip] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    quantum_safe: 0,
    tampered: 0,
    rollback_blocked: 0,
    legacy_rsa: 0,
  });
  const [loading, setLoading] = useState(true);

  // Helper to add logs to the terminal
  const addLog = (message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().split("T")[1].slice(0, -1),
        message,
        type,
      },
    ].slice(-100)); // Keep last 100 logs
  };

  useEffect(() => {
    setMounted(true);
    addLog("System initialized. VeriOTA SOC Uplink established.", "system");
    addLog("Connecting to Backend Fast-Track API (Bypassing Firebase)...", "info");

    // Fetch crypto info
    fetch(`${API_URL}/crypto/info`)
      .then(r => r.json())
      .then(data => setCryptoInfo(data))
      .catch(() => {});

    let pollInterval = 5000; // 5s default — balances reactivity vs Firestore quota
    let errorCount = 0;

    const fetchFleet = async () => {
      try {
        const res = await fetch(`${API_URL}/fleet`);
        if (!res.ok) throw new Error("Backend connection refused");
        
        const json = await res.json();
        const data = json.vehicles || [];
        errorCount = 0; // Reset on success
        
        // Detect new compromises by comparing with prevVehiclesRef
        data.forEach((v: any) => {
          const prev = prevVehiclesRef.current.find(old => old.vehicle_id === v.vehicle_id);
          
          if (v.status === "TAMPERED" && (!prev || prev.status !== "TAMPERED")) {
            addLog(`CRITICAL: Tamper detected on ${v.vehicle_id}. Merkle integrity check FAILED.`, "attack");
          }
          if (v.status === "ROLLBACK_BLOCKED" && (!prev || prev.status !== "ROLLBACK_BLOCKED")) {
            addLog(`SECURITY: Rollback attempt intercepted for ${v.vehicle_id}. Version ledger blocked downgrade.`, "blocked");
          }
        });

        // Update ref and states
        prevVehiclesRef.current = data;
        setVehicles(data);
        setSummary(json.fleet_summary || { total: 0, quantum_safe: 0, tampered: 0, rollback_blocked: 0, legacy_rsa: 0 });
        
        setLoading((prevLoading) => {
          if (prevLoading) addLog("Uplink synchronized. Fleet data streaming live.", "system");
          return false;
        });

      } catch (error: any) {
        errorCount++;
        if (errorCount <= 2) {
          addLog(`Uplink Error: ${error.message}`, "attack");
        }
        setLoading(false);
      }
    };

    fetchFleet();
    const interval = setInterval(fetchFleet, pollInterval);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#020804] text-emerald-50 p-4 md:p-6 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-center justify-between border-b border-emerald-900/40 pb-4 mb-4 gap-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none -z-10" />
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-emerald-500" />
            <div className="absolute inset-0 blur-md bg-emerald-500/30 rounded-full mix-blend-screen" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-emerald-50 uppercase flex items-center gap-2">
              Veri<span className="text-emerald-500">OTA</span> 
              <span className="text-[10px] font-mono tracking-normal bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">PRO-SOC_v2</span>
            </h1>
            <p className="text-[11px] font-mono text-emerald-600 uppercase tracking-widest mt-1">
              FIPS-204 M-LWE Cryptographic Matrix
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={async () => {
              addLog("Restoring fleet database...", "system");
              await fetch(`${API_URL}/api/demo/reset`, { method: 'POST' });
              addLog("All nodes restored to QUANTUM_SAFE baseline.", "info");
            }}
            className="px-3 py-1.5 border border-emerald-800 rounded bg-emerald-950/40 text-emerald-500 font-mono text-[9px] hover:bg-emerald-900/40 hover:text-emerald-400 transition-colors tracking-wider uppercase"
          >
            Restore Fleet
          </button>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase">
              <Activity className="w-3 h-3 animate-pulse" />
              STATUS: {loading ? "CONNECTING" : "LIVE SECURE"}
            </div>
            <div className="text-[9px] text-emerald-700 font-mono mt-1">
              {mounted ? new Date().toISOString() : "UPLINK ESTABLISHING"} • UTC
            </div>
          </div>
        </div>
      </header>

      {/* Crypto Info Strip */}
      {cryptoInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-900/30 relative"
        >
          <span className="text-[9px] font-mono bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
            {cryptoInfo.algorithm}
          </span>
          <span className="text-[9px] font-mono bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
            {cryptoInfo.nist_standard}
          </span>
          <span className="text-[9px] font-mono bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded border border-orange-800">
            π-Seeded
          </span>
          <span className="text-[9px] font-mono bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
            ✓ Quantum-Safe
          </span>
          <span className="text-[9px] font-mono text-slate-600 mx-1">|</span>
          <span className="text-[9px] font-mono text-slate-500">
            L{cryptoInfo.security_level} • {cryptoInfo.quantum_security_bits}-bit quantum • {cryptoInfo.signature_bytes}B sig
          </span>
          <div className="relative ml-auto">
            <button
              onMouseEnter={() => setShowPiTooltip(true)}
              onMouseLeave={() => setShowPiTooltip(false)}
              className="text-emerald-600 hover:text-emerald-400 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showPiTooltip && (
              <div className="absolute right-0 top-6 w-72 p-3 bg-slate-950 border border-emerald-900/50 rounded-lg shadow-xl z-50">
                <p className="text-[9px] font-mono text-emerald-400 mb-1">π-Seeded Domain Separation</p>
                <p className="text-[8px] font-mono text-slate-400 leading-relaxed">
                  {cryptoInfo.why_pi}
                </p>
                <p className="text-[8px] font-mono text-orange-400 mt-2">
                  π = {cryptoInfo.pi_digits?.slice(0, 30)}...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 3-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Wing: Controls & Summary (~3 cols) */}
        <div className="lg:col-span-3 lg:col-start-1 flex flex-col gap-6">
          <div className="bg-emerald-950/20 backdrop-blur-md rounded-xl border border-emerald-900/30 p-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 to-emerald-500" />
            <FleetSummaryBar summary={summary} />
          </div>
          <DemoControlPanel 
            onLog={(msg, type) => addLog(msg, type as any)} 
          />
        </div>

        {/* Center Console: Node Network (~6 cols) */}
        <div className="lg:col-span-6 lg:col-start-4 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-mono font-bold text-emerald-500 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Active SDV Nodes ({vehicles.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {vehicles.map((v) => (
              <VehicleCard key={v.vehicle_id} vehicle={v} />
            ))}
          </div>
          
          {vehicles.length === 0 && !loading && (
            <div className="h-64 flex flex-col items-center justify-center border border-emerald-900/50 rounded-xl border-dashed bg-emerald-950/20">
              <Cpu className="text-emerald-900 w-12 h-12 mb-3" />
              <p className="text-emerald-700 font-mono text-xs uppercase tracking-widest">Network Empty</p>
            </div>
          )}
        </div>

        {/* Right Wing: Live Terminal (~3 cols) */}
        <div className="lg:col-span-3 lg:col-start-10 h-[600px] lg:h-[calc(100vh-140px)] sticky top-6">
          <LiveThreatFeed logs={logs} />
        </div>

      </div>
    </main>
  );
}
