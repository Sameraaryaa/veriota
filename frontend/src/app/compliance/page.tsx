"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Shield, ShieldCheck, ShieldAlert, ArrowLeft, CheckCircle, AlertTriangle,
  Cpu, Lock, Zap, Globe, FileText, Target, Activity, Brain, Clock
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function CompliancePage() {
  const router = useRouter();
  const [compliance, setCompliance] = useState<any>(null);
  const [threatModel, setThreatModel] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"compliance" | "threats" | "benchmarks" | "qday" | "layers">("layers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, t, b] = await Promise.all([
          fetch(`${API_URL}/api/compliance`).then(r => r.json()),
          fetch(`${API_URL}/api/threat-model`).then(r => r.json()),
          fetch(`${API_URL}/api/benchmarks/pqm4`).then(r => r.json()),
        ]);
        setCompliance(c);
        setThreatModel(t);
        setBenchmarks(b);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { id: "layers" as const, label: "4-LAYER DEFENSE", icon: Shield },
    { id: "compliance" as const, label: "REGULATORY", icon: FileText },
    { id: "threats" as const, label: "TARA THREATS", icon: Target },
    { id: "benchmarks" as const, label: "PQM4 BENCHMARKS", icon: Cpu },
    { id: "qday" as const, label: "Q-DAY INTEL", icon: Brain },
  ];

  const riskColor = (level: string) => {
    if (level === "EXTREME") return "text-red-400 bg-red-950/40 border-red-800";
    if (level === "HIGH") return "text-amber-400 bg-amber-950/40 border-amber-800";
    if (level === "MEDIUM") return "text-yellow-400 bg-yellow-950/40 border-yellow-800";
    return "text-emerald-400 bg-emerald-950/40 border-emerald-800";
  };

  return (
    <main className="min-h-screen bg-[#020804] text-emerald-50 p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/")} className="text-emerald-600 hover:text-emerald-400 font-mono text-xs flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> SOC DASHBOARD
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase mb-2">
            <span className="text-emerald-400">Compliance</span> & <span className="text-cyan-400">Threat Intelligence</span>
          </h1>
          <p className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest">
            UNECE WP.29 R155/R156 • ISO/SAE 21434 • ISO 24089 • NIST FIPS 204 • TARA Methodology
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest border transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-900/30 border-emerald-700 text-emerald-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-emerald-700 font-mono text-xs animate-pulse gap-2">
            <Activity className="w-4 h-4" /> Loading intelligence data...
          </div>
        )}

        {/* ── TAB: Regulatory Compliance ───────────────────────────── */}
        {activeTab === "compliance" && compliance && (
          <div className="space-y-4">
            {compliance.compliance_framework?.map((std: any, i: number) => (
              <motion.div
                key={std.standard}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-950/60 border border-emerald-900/30 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-mono font-bold text-sm text-emerald-400 tracking-wider">{std.standard}</h3>
                      <span className="text-[8px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 uppercase">{std.status}</span>
                    </div>
                    <p className="text-slate-400 font-mono text-xs">{std.full_name}</p>
                  </div>
                  {std.mandatory_since && (
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-800">
                      MANDATORY since {std.mandatory_since}
                    </span>
                  )}
                  {std.finalized && (
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800">
                      Finalized {std.finalized}
                    </span>
                  )}
                </div>
                {std.key_requirement && (
                  <p className="text-slate-500 font-mono text-[10px] mb-3 italic border-l-2 border-emerald-900 pl-3">
                    "{std.key_requirement}"
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {std.veriota_implementation?.map((impl: string, j: number) => (
                    <div key={j} className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                      <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                      {impl}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── TAB: TARA Threat Model ──────────────────────────────── */}
        {activeTab === "threats" && threatModel && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-emerald-900/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Methodology: {threatModel.methodology}</span>
              </div>
              <p className="font-mono text-[10px] text-slate-500">Standard: {threatModel.standard} • Asset: {threatModel.asset}</p>
            </div>

            {/* Defense Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {Object.values(threatModel.defense_summary || {}).map((layer: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4"
                >
                  <div className="text-[9px] font-mono text-emerald-700 uppercase tracking-widest mb-1">LAYER {i + 1}</div>
                  <h4 className="font-mono text-xs text-emerald-400 font-bold mb-2">{layer.name}</h4>
                  {layer.math_basis && <p className="text-[9px] font-mono text-slate-500">Math: {layer.math_basis}</p>}
                  {layer.complexity && <p className="text-[9px] font-mono text-slate-500">Complexity: {layer.complexity}</p>}
                  {layer.mechanism && <p className="text-[9px] font-mono text-slate-500">Mechanism: {layer.mechanism}</p>}
                  {layer.chunk_size && <p className="text-[9px] font-mono text-slate-500">Chunk: {layer.chunk_size}</p>}
                  {layer.standard && <p className="text-[9px] font-mono text-cyan-600">{layer.standard}</p>}
                </motion.div>
              ))}
            </div>

            {/* Threats */}
            {threatModel.threats?.map((t: any, i: number) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-[10px] text-slate-600">{t.id}</span>
                    <h4 className="font-mono text-xs text-slate-200 font-bold">{t.name}</h4>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded border uppercase ${riskColor(t.risk_level)}`}>
                    {t.risk_level} RISK
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mb-3 leading-relaxed">{t.description}</p>
                <div className="bg-emerald-950/20 border border-emerald-900/20 rounded-lg p-3 mb-3">
                  <div className="text-[9px] font-mono text-emerald-700 uppercase tracking-widest mb-1">VeriOTA Mitigation</div>
                  <p className="text-[10px] font-mono text-emerald-400 leading-relaxed">{t.veriota_mitigation}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.defense_layers?.map((layer: string, j: number) => (
                    <span key={j} className="text-[8px] font-mono bg-emerald-900/30 text-emerald-500 px-2 py-0.5 rounded border border-emerald-800">
                      {layer}
                    </span>
                  ))}
                  <span className="text-[8px] font-mono text-slate-600 px-2 py-0.5">
                    Severity: {t.severity} • Likelihood: {t.likelihood}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── TAB: PQM4 Benchmarks ────────────────────────────────── */}
        {activeTab === "benchmarks" && benchmarks && (
          <div className="space-y-6">
            {/* MCU Info */}
            <div className="bg-slate-950/60 border border-cyan-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Target Hardware</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "MCU", value: benchmarks.target_mcu?.name },
                  { label: "Architecture", value: benchmarks.target_mcu?.architecture },
                  { label: "Clock", value: `${benchmarks.target_mcu?.clock_speed_mhz} MHz` },
                  { label: "Flash", value: `${benchmarks.target_mcu?.flash_kb} KB` },
                  { label: "SRAM", value: `${benchmarks.target_mcu?.sram_kb} KB` },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-[8px] font-mono text-slate-600 uppercase">{item.label}</div>
                    <div className="text-xs font-mono text-cyan-300 font-bold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmark Table */}
            <div className="rounded-xl border border-emerald-900/30 overflow-hidden">
              <div className="grid grid-cols-4 bg-slate-950 border-b border-emerald-900/30">
                <div className="p-3 font-mono text-[10px] text-slate-500 uppercase">Metric</div>
                <div className="p-3 font-mono text-[10px] text-red-400 uppercase border-l border-slate-800">RSA-2048</div>
                <div className="p-3 font-mono text-[10px] text-yellow-400 uppercase border-l border-slate-800">ML-DSA-65 (Clean)</div>
                <div className="p-3 font-mono text-[10px] text-emerald-400 uppercase border-l border-slate-800">ML-DSA-65 (m4f)</div>
              </div>
              {[
                { metric: "Verify Cycles", key: "verify_cycles", format: (v: any) => `${(v / 1_000_000).toFixed(1)}M` },
                { metric: "Verify Time", key: "verify_time_ms", format: (v: any) => `${v} ms` },
                { metric: "Sign Cycles", key: "sign_cycles", format: (v: any) => `${(v / 1_000_000).toFixed(1)}M` },
                { metric: "Sign Time", key: "sign_time_ms", format: (v: any) => `${v} ms` },
                { metric: "Signature Size", key: "signature_bytes", format: (v: any) => `${v} bytes` },
                { metric: "Public Key Size", key: "public_key_bytes", format: (v: any) => `${v} bytes` },
                { metric: "Stack Usage", key: "stack_usage_bytes", format: (v: any) => `${v} bytes` },
                { metric: "Quantum Safe?", key: "quantum_safe", format: (v: any) => v ? "✅ YES" : "❌ NO" },
              ].map((row, i) => {
                const algos = benchmarks.algorithms || {};
                const rsa = algos["RSA-2048"] || {};
                const clean = algos["ML-DSA-65 (clean)"] || {};
                const m4f = algos["ML-DSA-65 (m4f optimized)"] || {};
                return (
                  <div key={row.metric} className={`grid grid-cols-4 border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-950/60" : "bg-slate-950/30"}`}>
                    <div className="p-3 font-mono text-[10px] text-slate-400">{row.metric}</div>
                    <div className={`p-3 font-mono text-[10px] border-l border-slate-800 ${row.key === "quantum_safe" && !rsa[row.key] ? "text-red-400" : "text-slate-300"}`}>
                      {rsa[row.key] !== undefined ? row.format(rsa[row.key]) : "—"}
                    </div>
                    <div className="p-3 font-mono text-[10px] text-slate-300 border-l border-slate-800">
                      {clean[row.key] !== undefined ? row.format(clean[row.key]) : "—"}
                    </div>
                    <div className={`p-3 font-mono text-[10px] border-l border-slate-800 ${row.key === "quantum_safe" && m4f[row.key] ? "text-emerald-400" : "text-emerald-300 font-bold"}`}>
                      {m4f[row.key] !== undefined ? row.format(m4f[row.key]) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analysis */}
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
              <h3 className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Analysis
              </h3>
              <div className="space-y-2">
                {Object.entries(benchmarks.analysis || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-[10px] font-mono text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Q-Day Intelligence ─────────────────────────────── */}
        {activeTab === "qday" && benchmarks && (
          <div className="space-y-6">
            <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-red-500" />
                <h2 className="font-mono text-lg text-red-400 font-bold uppercase tracking-widest">Q-Day Threat Intelligence</h2>
              </div>
              <p className="text-slate-400 font-mono text-xs leading-relaxed mb-4">
                Q-Day is the hypothetical date when a Cryptographically Relevant Quantum Computer (CRQC) becomes
                powerful enough to run Shor&apos;s Algorithm and break RSA-2048 and ECDSA in polynomial time.
                Current intelligence suggests this timeline has compressed significantly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  {
                    org: "Google",
                    detail: benchmarks.q_day_intelligence?.google_pqc_deadline,
                    icon: "🔴",
                    severity: "border-red-800 bg-red-950/30",
                  },
                  {
                    org: "IBM Starling",
                    detail: benchmarks.q_day_intelligence?.ibm_starling_target,
                    icon: "🔴",
                    severity: "border-red-800 bg-red-950/30",
                  },
                  {
                    org: "NIST Federal",
                    detail: benchmarks.q_day_intelligence?.nist_federal_migration,
                    icon: "🟡",
                    severity: "border-amber-800 bg-amber-950/30",
                  },
                  {
                    org: "Qubit Trend",
                    detail: benchmarks.q_day_intelligence?.qubit_requirement_trend,
                    icon: "⚡",
                    severity: "border-cyan-800 bg-cyan-950/30",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`border rounded-xl p-4 ${item.severity}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <h4 className="font-mono text-xs text-slate-200 font-bold uppercase">{item.org}</h4>
                    </div>
                    <p className="font-mono text-[10px] text-slate-300 leading-relaxed">{item.detail}</p>
                  </motion.div>
                ))}
              </div>

              {/* HNDL Explainer */}
              <div className="bg-black/40 border border-red-900/30 rounded-xl p-5">
                <h3 className="font-mono text-sm text-red-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Harvest Now, Decrypt Later (HNDL)
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {[
                    { step: "1", label: "INTERCEPT", desc: "Nation-state passively records OTA firmware packages", color: "text-red-400 border-red-800" },
                    { step: "→", label: "", desc: "", color: "text-slate-600" },
                    { step: "2", label: "STORE", desc: "Encrypted packages archived (storage is cheap)", color: "text-amber-400 border-amber-800" },
                    { step: "→", label: "", desc: "", color: "text-slate-600" },
                    { step: "3", label: "Q-DAY", desc: "CRQC runs Shor's → RSA signatures broken", color: "text-red-400 border-red-800" },
                    { step: "→", label: "", desc: "", color: "text-slate-600" },
                    { step: "4", label: "EXPLOIT", desc: "Reverse-engineer firmware, craft weaponized updates", color: "text-red-400 border-red-800" },
                  ].filter(s => s.label || s.step === "→").map((s, i) => (
                    s.step === "→" ? (
                      <div key={i} className="text-slate-600 font-mono text-lg hidden md:block">→</div>
                    ) : (
                      <div key={i} className={`border rounded-lg p-3 text-center flex-1 ${s.color} bg-black/30`}>
                        <div className="text-lg font-bold font-mono">{s.step}</div>
                        <div className="text-[9px] font-mono uppercase tracking-widest mt-1">{s.label}</div>
                        <div className="text-[8px] font-mono text-slate-400 mt-1">{s.desc}</div>
                      </div>
                    )
                  ))}
                </div>
                <div className="mt-4 bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-emerald-400">
                    <strong>VeriOTA Defense:</strong> ML-DSA-65 signatures based on Module-LWE remain unbreakable post-Q-Day. 
                    Intercepted packages stay cryptographically sealed regardless of quantum capability.
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-[9px] font-mono text-red-400 bg-red-950/40 px-2 py-1 rounded border border-red-800">
                    HNDL STATUS: {benchmarks.q_day_intelligence?.hndl_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: 4-Layer Defense ─────────────────────────────────── */}
        {activeTab === "layers" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="font-mono text-lg font-bold text-emerald-400 uppercase tracking-widest">Defense-in-Depth Architecture</h2>
              <p className="font-mono text-[9px] text-slate-500 mt-1">All 4 layers must pass for firmware installation approval</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: 1, name: "M-of-N Consortium Quorum", desc: "Decentralized Trust Model. Firmware requires ML-DSA-65 signatures from 2 out of 3 Authorities (OEM, Regulator, Auditor). Eliminates single-point-of-failure.", color: "orange", border: "border-orange-800", bg: "bg-orange-950/20", text: "text-orange-400", badge: "bg-orange-900/40 text-orange-400 border-orange-800", nist: "FIPS 204" },
                { num: 2, name: "π-Merkle Trees", desc: "4KB chunk fingerprinting with π-seeded domain separation. Locates exact tampered bytes in O(log N). Nothing-Up-My-Sleeve hash derivation.", color: "teal", border: "border-teal-800", bg: "bg-teal-950/20", text: "text-teal-400", badge: "bg-teal-900/40 text-teal-400 border-teal-800", nist: "SHA-256" },
                { num: 3, name: "Monotonic Ledger", desc: "Semantic version enforcement. No vehicle can be downgraded to a vulnerable firmware version. Prevents replay and rollback attacks.", color: "blue", border: "border-blue-800", bg: "bg-blue-950/20", text: "text-blue-400", badge: "bg-blue-900/40 text-blue-400 border-blue-800", nist: "SemVer" },
                { num: 4, name: "Transparency Log", desc: "Append-only hash chain with π-seeded genesis. Stolen OEM signing keys are useless — firmware not in the log is rejected. RFC 6962 inspired.", color: "purple", border: "border-purple-800", bg: "bg-purple-950/20", text: "text-purple-400", badge: "bg-purple-900/40 text-purple-400 border-purple-800", nist: "RFC 6962" },
              ].map((layer, i) => (
                <motion.div
                  key={layer.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`${layer.bg} border ${layer.border} rounded-xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${layer.color}-500 to-transparent opacity-50`} />
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl font-black font-mono ${layer.text} opacity-30`}>0{layer.num}</span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${layer.badge} uppercase`}>✓ ACTIVE</span>
                  </div>
                  <h3 className={`font-mono text-sm font-bold ${layer.text} mb-2 tracking-wider`}>{layer.name}</h3>
                  <p className="font-mono text-[9px] text-slate-400 leading-relaxed mb-3">{layer.desc}</p>
                  <div className={`text-[8px] font-mono ${layer.text} opacity-60`}>{layer.nist}</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-950/60 border border-emerald-900/30 rounded-xl p-5 mt-6">
              <h3 className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-3">Attack Scenario Matrix</h3>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <div className="grid grid-cols-5 bg-slate-950 text-[8px] font-mono text-slate-500 uppercase border-b border-slate-800">
                  <div className="p-2">Scenario</div>
                  <div className="p-2 text-center">L1 PQC</div>
                  <div className="p-2 text-center">L2 Merkle</div>
                  <div className="p-2 text-center">L3 Ledger</div>
                  <div className="p-2 text-center">L4 Log</div>
                </div>
                {[
                  { name: "Firmware Tamper", l1: true, l2: false, l3: true, l4: true },
                  { name: "Version Rollback", l1: true, l2: true, l3: false, l4: true },
                  { name: "State-Sponsored Quorum Hacker", l1: true, l2: true, l3: true, l4: false },
                  { name: "Quantum Shor's Brute Force", l1: true, l2: true, l3: true, l4: true },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-5 text-[9px] font-mono border-b border-slate-800/50 ${i % 2 === 0 ? 'bg-slate-950/60' : 'bg-slate-950/30'}`}>
                    <div className="p-2 text-slate-300">{row.name}</div>
                    <div className={`p-2 text-center ${row.l1 ? 'text-emerald-500' : 'text-red-500'}`}>{row.l1 ? '✓' : '✗ CAUGHT'}</div>
                    <div className={`p-2 text-center ${row.l2 ? 'text-emerald-500' : 'text-red-500'}`}>{row.l2 ? '✓' : '✗ CAUGHT'}</div>
                    <div className={`p-2 text-center ${row.l3 ? 'text-emerald-500' : 'text-red-500'}`}>{row.l3 ? '✓' : '✗ CAUGHT'}</div>
                    <div className={`p-2 text-center ${row.l4 ? 'text-emerald-500' : 'text-red-500'}`}>{row.l4 ? '✓' : '✗ CAUGHT'}</div>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[8px] text-slate-600 mt-3">Every attack scenario is caught by at least one layer. No single point of failure.</p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
