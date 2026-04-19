import { Shield, Cpu, RefreshCw, Key, Network, Activity } from "lucide-react";

/**
 * Dashboard quick-links panel and PQC Operations triggers.
 */
export default function DemoControlPanel({
  onLog,
  isMigrationMode = false,
  setMigrationMode
}: {
  onLog?: (msg: string, type: string) => void;
  isMigrationMode?: boolean;
  setMigrationMode?: (mode: boolean) => void;
}) {
  const resetFleet = async () => {
    if (onLog) onLog("Restoring entire fleet to baseline...", "system");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      await fetch(`${API_URL}/api/demo/reset`, { method: 'POST' });
      if (onLog) onLog("✔ SUCCESS: All nodes restored to QUANTUM_SAFE baseline.", "info");
    } catch (e: any) {
      if (onLog) onLog(`✘ RESET FAILED: ${e.message}`, "error");
    }
  };

  const triggerKeyRotation = async () => {
    if (onLog) onLog("Initiating Post-Quantum Key Rotation...", "system");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${API_URL}/api/key-rotation/rotate`, { method: 'POST' });
      const data = await res.json();
      if (onLog) onLog(`🔑 KEY ROTATED (${data.algorithm}): Old: ${data.old_fingerprint} | New: ${data.new_fingerprint}`, "info");
    } catch (e: any) {
      if (onLog) onLog(`✘ KEY ROTATION FAILED: ${e.message}`, "error");
    }
  };

  const simulateDeltaUpdate = async () => {
    if (onLog) onLog("Simulating ML-DSA-65 Delta Firmware Patch...", "system");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${API_URL}/api/delta/simulate`, { method: 'POST' });
      const data = await res.json();
      if (onLog) {
        onLog(`📦 DELTA PATCH SENT: ${data.changed_modules} modified ECU chunks.`, "info");
        onLog(`⚡ BANDWIDTH SAVED: ${data.bandwidth_saved_pct}% (10MB vs 500MB).`, "info");
      }
    } catch (e: any) {
      if (onLog) onLog(`✘ DELTA UPDATE FAILED: ${e.message}`, "error");
    }
  };

  const launchWireshark = async () => {
    if (onLog) onLog("Triggering backend to launch Wireshark (port 8001)...", "system");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      await fetch(`${API_URL}/api/demo/wireshark`, { method: 'POST' });
    } catch (e: any) {
      if (onLog) onLog(`✘ WIRESHARK LAUNCH ERROR: Check backend console.`, "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* PQC Migration Operations */}
      <div className="bg-emerald-950/20 backdrop-blur-md rounded-xl border border-emerald-900/30 p-3">
        <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>Advanced Security Ops</span>
          {setMigrationMode && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className={`text-[9px] ${!isMigrationMode ? 'text-emerald-400' : 'text-slate-500'}`}>Pure PQC</span>
              <div
                className={`relative w-8 h-4 rounded-full transition-colors ${isMigrationMode ? 'bg-indigo-600' : 'bg-emerald-800'}`}
                onClick={(e) => { e.preventDefault(); setMigrationMode(!isMigrationMode); }}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isMigrationMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className={`text-[9px] ${isMigrationMode ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>Hybrid (Migrate)</span>
            </label>
          )}
        </h3>
        <div className="space-y-2">
          <button onClick={triggerKeyRotation} className="w-full flex items-center justify-between bg-black/40 hover:bg-emerald-900/30 border border-emerald-900/50 p-2 rounded transition-colors text-left group">
            <span className="flex items-center gap-2 text-[10px] font-mono text-emerald-400"><Key className="w-3 h-3" /> Rotate Master Key</span>
            <span className="text-[8px] font-mono text-emerald-700 uppercase group-hover:text-emerald-500">Trigger</span>
          </button>
          <button onClick={simulateDeltaUpdate} className="w-full flex items-center justify-between bg-black/40 hover:bg-cyan-900/30 border border-cyan-900/50 p-2 rounded transition-colors text-left group">
            <span className="flex items-center gap-2 text-[10px] font-mono text-cyan-400"><RefreshCw className="w-3 h-3" /> Simulate Delta OTA</span>
            <span className="text-[8px] font-mono text-cyan-700 uppercase group-hover:text-cyan-500">10MB Patch</span>
          </button>
          <button onClick={launchWireshark} className="w-full flex items-center justify-between bg-black/40 hover:bg-blue-900/30 border border-blue-900/50 p-2 rounded transition-colors text-left group">
            <span className="flex items-center gap-2 text-[10px] font-mono text-blue-400"><Activity className="w-3 h-3" /> Launch Wireshark Cap</span>
            <span className="text-[8px] font-mono text-blue-700 uppercase group-hover:text-blue-500">port 8001</span>
          </button>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href="/attacks"
          className="flex items-center justify-center gap-2 bg-red-950/30 border border-red-700/50 hover:bg-red-900/40 hover:border-red-500 transition-all p-3 rounded-lg text-red-400 font-mono text-[9px] uppercase tracking-widest"
        >
          ⚔️ Cyber Warfare Sim
        </a>
        <a
          href="/comparison"
          className="flex items-center justify-center gap-2 bg-blue-950/30 border border-blue-700/50 hover:bg-blue-900/40 hover:border-blue-500 transition-all p-3 rounded-lg text-blue-400 font-mono text-[9px] uppercase tracking-widest"
        >
          <Cpu className="w-3 h-3" />
          Algo Compare
        </a>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <a
          href="/ecu-sim.html"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-2 bg-emerald-950/30 border border-emerald-700/50 hover:bg-emerald-900/40 hover:border-emerald-500 transition-all p-2.5 rounded-lg text-emerald-400 font-mono text-[9px] uppercase tracking-widest"
        >
          🧠 3D ECU Simulator
        </a>
        <a
          href="/fleet-mesh.html"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-2 bg-indigo-950/30 border border-indigo-700/50 hover:bg-indigo-900/40 hover:border-indigo-500 transition-all p-2.5 rounded-lg text-indigo-400 font-mono text-[9px] uppercase tracking-widest"
        >
          🗺️ Fleet Network Mesh
        </a>
        <a
          href="/compliance"
          className="flex items-center justify-center gap-2 bg-cyan-950/30 border border-cyan-700/50 hover:bg-cyan-900/40 hover:border-cyan-500 transition-all p-2.5 rounded-lg text-cyan-400 font-mono text-[9px] uppercase tracking-widest"
        >
          <Shield className="w-3 h-3 text-cyan-500" />
          Compliance & Threat Intel
        </a>
      </div>

      {/* Hint */}
      <div className="text-center font-mono text-[7px] text-slate-700 tracking-widest uppercase pt-1">
        HOVER LEFT EDGE FOR FULL NAVIGATION SIDEBAR
      </div>
    </div>
  );
}
