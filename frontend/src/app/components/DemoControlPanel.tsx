"use client";
import { Shield, Cpu } from "lucide-react";

/**
 * Dashboard quick-links panel. Attack controls have been moved to /attacks page.
 * This panel now provides navigation only.
 */
export default function DemoControlPanel({ onLog }: { onLog?: (msg: string, type: string) => void }) {
  return (
    <div className="space-y-3">
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
