const COMPARISON_DATA = [
  { property: "Hard Problem",          rsa: "Integer Factorization",    dilithium: "Module-LWE / MSIS",      riskRsa: true },
  { property: "Quantum Safe?",         rsa: "❌ NO — Shor's breaks it", dilithium: "✅ YES — no known attack", riskRsa: true },
  { property: "Classical Security",    rsa: "~112 bits",                dilithium: "~140 bits",               riskRsa: false },
  { property: "Quantum Security",      rsa: "💀 BROKEN",               dilithium: "~128+ bits (conjectured)", riskRsa: true },
  { property: "Public Key Size",       rsa: "256 bytes",                dilithium: "1,952 bytes",              riskRsa: false },
  { property: "Signature Size",        rsa: "256 bytes",                dilithium: "3,293 bytes",              riskRsa: false },
  { property: "Sign Speed",            rsa: "~1.0 ms",                  dilithium: "~1.0 ms",                 riskRsa: false },
  { property: "Verify Speed",          rsa: "~0.05 ms",                 dilithium: "~0.7 ms",                 riskRsa: false },
  { property: "NIST Status",           rsa: "Legacy (deprecated)",      dilithium: "FIPS 204 (Aug 2024)",     riskRsa: true },
  { property: "Automotive OTA Usage",  rsa: "Uptane default",           dilithium: "VeriOTA (this system)",   riskRsa: true },
];

export default function AlgorithmComparison() {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50">
        <h2 className="text-lg font-bold text-white">⚖️ Algorithm Comparison: RSA-2048 vs CRYSTALS-Dilithium3</h2>
        <p className="text-xs text-slate-500 mt-1">
          Why every RSA-signed OTA system is vulnerable and VeriOTA is not
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 text-xs font-bold border-b border-slate-700/50">
        <div className="p-3 text-slate-400 uppercase tracking-widest">Property</div>
        <div className="p-3 text-red-400 uppercase tracking-widest bg-red-950/20 text-center">
          RSA-2048 ⚠ VULNERABLE
        </div>
        <div className="p-3 text-emerald-400 uppercase tracking-widest bg-emerald-950/20 text-center">
          Dilithium3 ✓ SAFE
        </div>
      </div>

      {/* Rows */}
      {COMPARISON_DATA.map((row, i) => (
        <div
          key={i}
          className={`grid grid-cols-3 text-sm border-b border-slate-800/50 last:border-0
            ${i % 2 === 0 ? "bg-slate-950/20" : "bg-transparent"}
          `}
        >
          <div className="p-3 text-slate-400 font-medium text-xs">{row.property}</div>
          <div className={`p-3 text-xs font-mono text-center ${row.riskRsa ? "text-red-400" : "text-slate-400"} bg-red-950/10`}>
            {row.rsa}
          </div>
          <div className="p-3 text-xs font-mono text-center text-emerald-400 bg-emerald-950/10">
            {row.dilithium}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div className="p-4 bg-blue-950/30 border-t border-blue-900/30">
        <p className="text-xs text-blue-300">
          <strong>HNDL Threat:</strong> Adversaries are recording RSA-signed OTA traffic <em>today</em> to decrypt with quantum computers in 2034+.
          VeriOTA&apos;s Dilithium3 signatures are immune — even stored signatures cannot be used to recover the private key.
        </p>
      </div>
    </div>
  );
}
