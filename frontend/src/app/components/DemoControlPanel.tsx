"use client";
import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, AlertTriangle, Fingerprint, Cpu, Shield } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface DemoLog {
  text: string;
  type: "output" | "error" | "done";
}

export default function DemoControlPanel({ onLog }: { onLog?: (msg: string, type: string) => void }) {
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const [streamLogs, setStreamLogs] = useState<DemoLog[]>([]);
  const streamRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamLogs]);

  const addStreamLog = (text: string, type: DemoLog["type"] = "output") => {
    setStreamLogs(prev => [...prev.slice(-80), { text, type }]);
  };

  const triggerAttack = async (type: string, label: string) => {
    if (runningCmd) return;
    setRunningCmd(type);
    setStreamLogs([]);

    const initMessages: Record<string, string> = {
      tamper:   "ATTACK VECTOR: Injecting tampered firmware into update stream (byte 200,000 flipped)...",
      rollback: "ATTACK VECTOR: Replaying signed-but-vulnerable v1.0.0 firmware to patched vehicle...",
      hndl:     "SIMULATION: Benchmarking RSA-2048 vs ML-DSA-65 (FIPS 204) on same firmware payload...",
      reset:    "SYSTEM: Purging fleet attack state... Restoring 20-vehicle genesis configuration...",
    };
    if (onLog) onLog(initMessages[type] || `Executing ${type}...`, type === "reset" ? "system" : "attack");

    // Close any existing SSE connection
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }

    try {
      const res = await fetch(`${API_URL}/api/demo/${type}`, { method: "POST" });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "No response body");
        if (onLog) onLog(`EXECUTION ERROR: ${errText}`, "attack");
        setRunningCmd(null);
        return;
      }

      // Stream the response body line by line (SSE)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";  // keep incomplete line

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const text = line.slice(6).trim();
            if (!text || text === "__STREAM_END__") continue;

            if (text.startsWith("EXIT_CODE:")) {
              const code = text.split(":")[1];
              const success = code === "0";
              addStreamLog(success ? "✔ Process complete (exit 0)" : `✘ Process exited with code ${code}`, success ? "done" : "error");
              if (onLog) {
                if (success && type === "tamper") onLog("TAMPER CONFIRMED: Merkle verification FAILED. Firestore alert written. Dashboard should show RED.", "attack");
                if (success && type === "rollback") onLog("ROLLBACK BLOCKED: Version ledger enforcement active. Dashboard should show AMBER.", "blocked");
                if (success && type === "hndl") onLog("COMPARISON COMPLETE: ML-DSA-65 signatures cannot be broken by Shor's Algorithm. RSA-2048 cannot.", "system");
                if (success && type === "reset") onLog("FLEET RESET: 20 vehicles restored to QUANTUM_SAFE. Dashboard should show all GREEN.", "system");
              }
            } else if (text.startsWith("STDERR:") || text.startsWith("FATAL:")) {
              addStreamLog(text, "error");
              if (onLog) onLog(text, "attack");
            } else {
              addStreamLog(text, "output");
              // Parse key results and push to parent terminal
              if (text.includes("STATUS") && onLog) onLog(text, "info");
              if (text.includes("Chunk #") && onLog) onLog(text, "attack");
              if (text.includes("ROLLBACK") && onLog) onLog(text, "blocked");
            }
          }
        }
      }
    } catch (err: any) {
      const msg = `CRITICAL: Cannot connect to backend at ${API_URL}. Is it running?`;
      addStreamLog(msg, "error");
      if (onLog) onLog(msg, "attack");
    } finally {
      setRunningCmd(null);
    }
  };

  const BUTTONS = [
    {
      id: "tamper",
      label: "LAUNCH TAMPER ATTACK",
      sub: "Flip byte 200,000 → Merkle fail → Dashboard RED",
      icon: AlertTriangle,
      color: "red",
    },
    {
      id: "rollback",
      label: "FORCE VERSION ROLLBACK",
      sub: "Replay v1.0.0 to patched v2.1.4 vehicle → AMBER",
      icon: RotateCcw,
      color: "amber",
    },
    {
      id: "hndl",
      label: "HNDL / ALGO COMPARISON",
      sub: "RSA-2048 vs ML-DSA-65 live benchmark",
      icon: Fingerprint,
      color: "blue",
    },
  ];

  const colorMap: Record<string, string> = {
    red:   "border-red-900/50 hover:border-red-500 bg-red-950/20 hover:bg-red-900/30 text-red-400",
    amber: "border-amber-900/50 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400",
    blue:  "border-blue-900/50 hover:border-blue-500 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400",
  };
  const iconColorMap: Record<string, string> = {
    red: "text-red-500", amber: "text-amber-500", blue: "text-blue-500",
  };

  return (
    <div className="bg-slate-950/80 rounded-xl border border-emerald-900/30 p-4 flex flex-col gap-4">
      <h2 className="text-xs font-mono font-bold text-emerald-500 uppercase flex items-center gap-2 tracking-widest border-b border-emerald-900/50 pb-2">
        <Shield className="w-4 h-4" />
        Cyber Warfare Simulator
      </h2>

      {/* Attack Buttons */}
      <div className="flex flex-col gap-2">
        {BUTTONS.map(btn => {
          const Icon = btn.icon;
          const isRunning = runningCmd === btn.id;
          return (
            <button
              key={btn.id}
              id={`btn-demo-${btn.id}`}
              onClick={() => triggerAttack(btn.id, btn.label)}
              disabled={!!runningCmd}
              className={`group relative flex items-center gap-3 border transition-all p-3 rounded text-left disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[btn.color]}`}
            >
              {isRunning && (
                <span className="absolute inset-0 rounded overflow-hidden">
                  <span className="absolute inset-y-0 left-0 w-1 bg-current animate-pulse opacity-60" />
                </span>
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorMap[btn.color]}`} />
              <div>
                <div className="font-mono text-xs font-bold tracking-widest">
                  {isRunning ? `⟳ RUNNING: ${btn.label}` : btn.label}
                </div>
                <div className="font-mono text-[9px] mt-0.5 opacity-60 uppercase">{btn.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stream Output Panel */}
      {streamLogs.length > 0 && (
        <div className="bg-black/60 rounded border border-emerald-900/30 p-2 max-h-48 overflow-y-auto font-mono text-[9px] space-y-0.5">
          <div className="text-emerald-700 uppercase tracking-widest mb-1 text-[8px]">▶ Script Output</div>
          {streamLogs.map((log, i) => (
            <div
              key={i}
              className={
                log.type === "error" ? "text-red-400" :
                log.type === "done"  ? "text-emerald-400 font-bold" :
                "text-slate-300"
              }
            >
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Reset + ECU Sim */}
      <div className="flex gap-2">
        <button
          id="btn-demo-reset"
          onClick={() => triggerAttack("reset", "Reset Fleet")}
          disabled={!!runningCmd}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-900/20 border border-emerald-900 hover:bg-emerald-800/40 transition-all p-2 rounded text-emerald-400 font-mono text-[9px] uppercase tracking-widest disabled:opacity-40"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Fleet
        </button>
        <a
          href="/comparison"
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-900/20 border border-blue-900 hover:bg-blue-800/40 transition-all p-2 rounded text-blue-400 font-mono text-[9px] uppercase tracking-widest"
        >
          <Cpu className="w-3 h-3" />
          Algo Compare
        </a>
      </div>

      {/* ECU 3D Simulator Link */}
      <a
        href="/ecu-sim.html"
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 bg-emerald-950/30 border border-emerald-700/50 hover:bg-emerald-900/40 hover:border-emerald-500 transition-all p-2.5 rounded text-emerald-400 font-mono text-[9px] uppercase tracking-widest"
      >
        <Cpu className="w-3 h-3 text-emerald-500" />
        🧠 Launch 3D ECU Simulator
      </a>
      <a
        href="/compliance"
        className="flex items-center justify-center gap-2 bg-cyan-950/30 border border-cyan-700/50 hover:bg-cyan-900/40 hover:border-cyan-500 transition-all p-2.5 rounded text-cyan-400 font-mono text-[9px] uppercase tracking-widest"
      >
        <Shield className="w-3 h-3 text-cyan-500" />
        📋 Compliance & Threat Intel
      </a>
    </div>
  );
}
