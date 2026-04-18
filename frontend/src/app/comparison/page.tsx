"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Cpu, Zap, AlertTriangle, CheckCircle, Clock, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface AlgoRow {
  property: string;
  rsa: string;
  dilithium: string;
  highlight?: "rsa" | "dilithium" | "neutral";
}

export default function ComparisonPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streamOutput, setStreamOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Stream the RSA comparison script and parse output
    const runComparison = async () => {
      setLoading(true);
      setStreamOutput([]);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/demo/hndl`, { method: "POST" });
        if (!res.ok || !res.body) throw new Error("Backend unavailable");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const lines: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() || "";

          for (const line of parts) {
            if (line.startsWith("data: ")) {
              const text = line.slice(6).trim();
              if (text && text !== "__STREAM_END__" && !text.startsWith("EXIT_CODE:")) {
                lines.push(text);
                setStreamOutput([...lines]);
              }
            }
          }
        }

        // Parse key numbers from script output
        const parsed: any = { raw: lines };
        for (const line of lines) {
          const m = line.match(/Public Key Size\s+(\d+) bytes\s+(\d+) bytes/i);
          if (m) { parsed.rsaPubKey = parseInt(m[1]); parsed.dilPubKey = parseInt(m[2]); }
          const m2 = line.match(/Signature Size\s+(\d+) bytes\s+(\d+) bytes/i);
          if (m2) { parsed.rsaSig = parseInt(m2[1]); parsed.dilSig = parseInt(m2[2]); }
          const m3 = line.match(/Sign Time\s+([\d.]+) ms\s+([\d.]+) ms/i);
          if (m3) { parsed.rsaSignMs = m3[1]; parsed.dilSignMs = m3[2]; }
          const m4 = line.match(/Verify Time\s+([\d.]+) ms\s+([\d.]+) ms/i);
          if (m4) { parsed.rsaVerifyMs = m4[1]; parsed.dilVerifyMs = m4[2]; }
        }
        setData(parsed);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, []);

  const ROWS: AlgoRow[] = [
    { property: "Hard Problem", rsa: "Integer Factorization", dilithium: "Module-LWE / MSIS", highlight: "dilithium" },
    { property: "Quantum Safe?", rsa: "❌ NO — Broken by Shor's", dilithium: "✅ YES — No known attack", highlight: "dilithium" },
    { property: "Classical Security", rsa: "~112 bits", dilithium: "~140 bits", highlight: "dilithium" },
    { property: "Quantum Security", rsa: "💀 BROKEN", dilithium: "~128+ bits (conjectured)", highlight: "dilithium" },
    { property: "NIST Status (2026)", rsa: "Legacy — DEPRECATED", dilithium: "FIPS 204 (Aug 2024) ✅", highlight: "dilithium" },
    { property: "Public Key Size", rsa: data?.rsaPubKey ? `${data.rsaPubKey} bytes` : "256 bytes", dilithium: data?.dilPubKey ? `${data.dilPubKey} bytes` : "1952 bytes", highlight: "neutral" },
    { property: "Signature Size", rsa: data?.rsaSig ? `${data.rsaSig} bytes` : "256 bytes", dilithium: data?.dilSig ? `${data.dilSig} bytes` : "3293 bytes", highlight: "neutral" },
    { property: "Sign Time", rsa: data?.rsaSignMs ? `${data.rsaSignMs} ms` : "~1.0 ms", dilithium: data?.dilSignMs ? `${data.dilSignMs} ms` : "~1.0 ms", highlight: "neutral" },
    { property: "Verify Time", rsa: data?.rsaVerifyMs ? `${data.rsaVerifyMs} ms` : "~0.05 ms", dilithium: data?.dilVerifyMs ? `${data.dilVerifyMs} ms` : "~0.7 ms", highlight: "neutral" },
    { property: "Automotive OTA Use", rsa: "Uptane default (legacy)", dilithium: "VeriOTA — This System", highlight: "dilithium" },
  ];

  return (
    <main className="min-h-screen bg-[#020804] text-emerald-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push("/")} className="text-emerald-600 hover:text-emerald-400 font-mono text-xs flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> BACK TO SOC DASHBOARD
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-widest uppercase mb-2">
            <span className="text-slate-400">RSA-2048</span>
            <span className="text-emerald-700 mx-4">vs</span>
            <span className="text-emerald-400">ML-DSA-65</span>
          </h1>
          <p className="text-emerald-700 font-mono text-xs uppercase tracking-widest">
            NIST FIPS 204 — Live Benchmark on Identical 10MB Automotive Firmware
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-mono text-xs animate-pulse">
              <Clock className="w-3 h-3" />
              Running live benchmark via liboqs + cryptography Python libs...
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 font-mono text-xs">
              ⚠ Error: {error}. Is the backend running at {API_URL}?
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-900/30 overflow-hidden mb-8"
        >
          {/* Column headers */}
          <div className="grid grid-cols-3 bg-slate-950 border-b border-emerald-900/30">
            <div className="p-4 font-mono text-xs text-slate-500 uppercase tracking-widest">Property</div>
            <div className="p-4 font-mono text-sm font-bold text-red-400 uppercase tracking-widest border-l border-emerald-900/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> RSA-2048
              <span className="text-[9px] bg-red-900/40 text-red-400 px-2 py-0.5 rounded border border-red-800 ml-1">QUANTUM VULNERABLE</span>
            </div>
            <div className="p-4 font-mono text-sm font-bold text-emerald-400 uppercase tracking-widest border-l border-emerald-900/20 flex items-center gap-2">
              <Shield className="w-4 h-4" /> ML-DSA-65
              <span className="text-[9px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 ml-1">QUANTUM SAFE</span>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <motion.div
              key={row.property}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-3 border-b border-emerald-900/10 ${i % 2 === 0 ? "bg-slate-950/60" : "bg-slate-950/30"}`}
            >
              <div className="p-3 font-mono text-xs text-slate-400">{row.property}</div>
              <div className={`p-3 font-mono text-xs border-l border-emerald-900/20 ${row.highlight === "rsa" ? "text-emerald-400 font-bold" : row.rsa.includes("BROKEN") || row.rsa.includes("NO") || row.rsa.includes("DEPRECATED") ? "text-red-400" : "text-slate-300"}`}>
                {row.rsa}
              </div>
              <div className={`p-3 font-mono text-xs border-l border-emerald-900/20 ${row.highlight === "dilithium" ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
                {loading && (row.property.includes("Size") || row.property.includes("Time")) ? (
                  <span className="animate-pulse text-emerald-700">measuring...</span>
                ) : row.dilithium}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Verdict */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h3 className="text-red-400 font-mono font-bold uppercase text-sm tracking-widest">RSA-2048 Today</h3>
            </div>
            <p className="text-slate-400 font-mono text-xs leading-relaxed">
              Shor's Algorithm breaks RSA by factoring the 2048-bit modulus N = p × q.
              Requires ~4,098 logical qubits. Current quantum computers: ~1,000-2,000 noisy qubits.
              Timeline to break RSA-2048: 10–20 years. HNDL attacks collecting traffic <em>today</em>.
            </p>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-emerald-500 w-6 h-6" />
              <h3 className="text-emerald-400 font-mono font-bold uppercase text-sm tracking-widest">ML-DSA-65 (VeriOTA)</h3>
            </div>
            <p className="text-slate-400 font-mono text-xs leading-relaxed">
              Security based on Module-LWE — no known quantum algorithm provides exponential speedup.
              Grover's gives only √N speedup vs exponential for Shor's. 128-bit quantum security.
              NIST FIPS 204 finalized August 2024. The <em>correct</em> choice for any system with a 15+ year lifecycle.
            </p>
          </div>
        </div>

        {/* Live Script Output */}
        {streamOutput.length > 0 && (
          <div className="bg-black/60 rounded-xl border border-emerald-900/30 p-4">
            <div className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              Live Benchmark Output (rsa_comparison.py)
            </div>
            <pre className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {streamOutput.join("\n")}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
