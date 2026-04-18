"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import VehicleCard from "./components/VehicleCard";
import FleetSummaryBar from "./components/FleetSummaryBar";
import DemoControlPanel from "./components/DemoControlPanel";
import LiveThreatFeed, { LogEntry } from "./components/LiveThreatFeed";
import { Shield, ShieldCheck, Activity, Cpu } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mounted, setMounted] = useState(false);
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

    let pollInterval = 5000; // 5s default — balances reactivity vs Firestore quota
    let errorCount = 0;

    const fetchFleet = async () => {
      try {
        const res = await fetch(`${API_URL}/fleet`);
        if (!res.ok) throw new Error("Backend connection refused");
        
        const json = await res.json();
        const data = json.vehicles || [];
        errorCount = 0; // Reset on success
        
        // Alert terminal logic
        data.forEach((v: any) => {
          if (v.status === "TAMPERED") {
            setVehicles(prevVehicles => {
              const existingTampered = prevVehicles.find(old => old.vehicle_id === v.vehicle_id && old.status === "TAMPERED");
              if (!existingTampered) {
                 addLog(`TAMPER DETECTED: Intrusive firmware injected targeting ${v.vehicle_id}. Merkle verification FAILED.`, "attack");
              }
              return prevVehicles;
            });
          }
          if (v.status === "ROLLBACK_BLOCKED") {
            setVehicles(prevVehicles => {
                 const existingRollback = prevVehicles.find(old => old.vehicle_id === v.vehicle_id && old.status === "ROLLBACK_BLOCKED");
                 if (!existingRollback) {
                    addLog(`ROLLBACK BLOCKED: Legacy version push intercepted for ${v.vehicle_id}. Semantic monotonic check FAILED.`, "blocked");
                 }
                 return prevVehicles;
            });
          }
        });

        // Use functional state updates where needed, otherwise just set them
        setVehicles(data);
        setSummary(json.fleet_summary || { total: 0, quantum_safe: 0, tampered: 0, rollback_blocked: 0, legacy_rsa: 0 });
        
        setLoading((prevLoading) => {
          if (prevLoading) addLog("Uplink synchronized. Fleet data streaming live (5s poll).", "system");
          return false;
        });

      } catch (error: any) {
        errorCount++;
        // Only log the first error, not every poll failure
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
      <header className="flex flex-col md:flex-row items-center justify-between border-b border-emerald-900/40 pb-4 mb-6 gap-4 relative">
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
        
        <div className="flex gap-4">
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
