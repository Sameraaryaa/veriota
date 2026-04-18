/* Enhancement 3: HNDL Attack Visualizer */
"use client";
import { useState } from "react";

const TIMELINE = [
  { year: "2026", rsa: "RSA-signed OTA traffic being collected today by nation-state actors.", dilithium: "Dilithium3-signed traffic collected. Lattice signatures stored.", threat: true },
  { year: "2028", rsa: "More OTA packages collected. Fleet grows. RSA signing continues.", dilithium: "Fleet continues receiving PQC-protected updates. No exposure.", threat: false },
  { year: "2034", rsa: "Quantum computer: 4,098 logical qubits. Shor's runs on RSA-2048.", dilithium: "Quantum computer attempts Shor's on lattice. No speedup. Fails.", threat: true },
  { year: "2035", rsa: "RSA private key recovered. Attacker can forge any firmware. ⚠ FLEET COMPROMISED.", dilithium: "Private key NOT recoverable. Dilithium signatures are secure. ✅ FLEET PROTECTED.", threat: true },
];

export default function HNDLVisualizer() {
  const [active, setActive] = useState(false);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">📡 HNDL Attack Simulator</h2>
          <p className="text-xs text-slate-500 mt-0.5">Harvest Now, Decrypt Later — the present quantum threat</p>
        </div>
        <button
          id="hndl-simulate-btn"
          onClick={() => setActive(true)}
          className="bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          Run Simulation
        </button>
      </div>

      {active && (
        <div className="space-y-3">
          {TIMELINE.map((entry, i) => (
            <div
              key={i}
              className="grid grid-cols-[60px_1fr_1fr] gap-3 items-start text-xs"
              style={{ animation: `fadeIn 0.3s ease ${i * 0.15}s both` }}
            >
              <div className="bg-slate-800 rounded-lg p-2 text-center font-mono font-bold text-yellow-400">
                {entry.year}
              </div>
              <div className={`rounded-lg p-2.5 ${entry.threat ? "bg-red-950/50 border border-red-800/40 text-red-300" : "bg-slate-800/50 text-slate-400"}`}>
                <span className="font-semibold text-red-500 text-[10px] block mb-1">RSA-2048 (Uptane)</span>
                {entry.rsa}
              </div>
              <div className="rounded-lg p-2.5 bg-emerald-950/40 border border-emerald-800/30 text-emerald-300">
                <span className="font-semibold text-emerald-500 text-[10px] block mb-1">Dilithium3 (VeriOTA)</span>
                {entry.dilithium}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-600 pt-2 text-center">
            HNDL attacks are active today. Quantum computers don&apos;t need to exist yet to collect the data.
          </p>
        </div>
      )}

      {!active && (
        <div className="text-center py-8 text-slate-600 text-sm">
          Click &quot;Run Simulation&quot; to see how a harvest-now-decrypt-later attack unfolds over time →
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
