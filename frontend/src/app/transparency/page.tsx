"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function TransparencyPage() {
  const router = useRouter();
  const [logData, setLogData] = useState<any>(null);
  const [root, setRoot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [logRes, rootRes] = await Promise.all([
          fetch(`${API_URL}/api/transparency/log`).then(r => r.json()),
          fetch(`${API_URL}/api/transparency/root`).then(r => r.json()),
        ]);
        setLogData(logRes);
        setRoot(rootRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const verifyInclusion = async (firmwareHash: string) => {
    setVerifying(firmwareHash);
    setProofResult(null);
    try {
      const res = await fetch(`${API_URL}/api/transparency/verify/${firmwareHash}`);
      const data = await res.json();
      setProofResult(data);
    } catch {
      setProofResult({ status: "ERROR", message: "Verification failed" });
    }
    setVerifying(null);
  };

  const entries = logData?.log || [];

  return (
    <main className="min-h-screen bg-[#040608] text-slate-200 font-mono selection:bg-purple-500/20">
      {/* Top bar */}
      <div className="border-b border-slate-800/60 bg-[#060a0e]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors tracking-wider uppercase">
              ← Dashboard
            </button>
            <div className="w-px h-4 bg-slate-800" />
            <span className="text-[10px] text-slate-500 tracking-[3px] uppercase">Firmware Transparency Log</span>
          </div>
          <div className="flex items-center gap-3">
            {logData && (
              <span className={`text-[9px] flex items-center gap-1.5 ${logData.chain_valid ? 'text-emerald-600' : 'text-red-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${logData.chain_valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {logData.chain_valid ? 'CHAIN INTACT' : 'CHAIN BROKEN'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-32 text-slate-700 text-[10px] tracking-widest uppercase">
            Loading...
          </div>
        )}

        {/* Root + Genesis */}
        {root && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/40 p-5">
              <div className="text-[9px] text-purple-600 tracking-[3px] uppercase mb-2">Current Root Hash</div>
              <div className="text-[10px] text-purple-400 break-all leading-relaxed">{root.root_hash}</div>
              <div className="mt-3 flex items-center gap-3 text-[9px] text-slate-700">
                <span>{root.total_entries} entries</span>
                {root.last_version && (
                  <>
                    <span className="text-slate-800">·</span>
                    <span>Latest: v{root.last_version}</span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/40 p-5">
              <div className="text-[9px] text-amber-700 tracking-[3px] uppercase mb-2">Genesis Block (π-Seeded)</div>
              <div className="text-[10px] text-amber-500/80 break-all leading-relaxed">{root.genesis_hash}</div>
              <div className="mt-3 text-[9px] text-slate-700">
                SHA256(&quot;VeriOTA Transparency Log v1.0 | π=3.14159...&quot;)
              </div>
            </div>
          </div>
        )}

        {/* Chain Visualization */}
        {entries.length > 0 && (
          <div className="mb-6">
            <div className="text-[9px] text-slate-600 tracking-[3px] uppercase mb-3">Hash Chain</div>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-0 min-w-min">
                {/* Genesis */}
                <div className="flex-shrink-0 px-3 py-2 rounded border border-amber-900/30 bg-amber-950/10">
                  <div className="text-[7px] text-amber-700 uppercase tracking-wider">π Genesis</div>
                  <div className="text-[9px] text-amber-600/70 mt-0.5">{root?.genesis_hash?.slice(0, 12)}</div>
                </div>
                {entries.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center">
                    <div className="w-6 h-px bg-slate-800" />
                    <div className="flex-shrink-0 px-3 py-2 rounded border border-purple-900/20 bg-purple-950/10 hover:border-purple-800/40 transition-colors">
                      <div className="text-[7px] text-purple-700 uppercase tracking-wider">#{entry.sequence}</div>
                      <div className="text-[9px] text-purple-500/70 mt-0.5">{entry.entry_hash?.slice(0, 12)}</div>
                      <div className="text-[7px] text-slate-700 mt-0.5">v{entry.version}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Log Table */}
        {entries.length > 0 && (
          <div className="rounded-lg border border-slate-800/40 overflow-hidden">
            <div className="grid grid-cols-6 bg-[#080b0f] border-b border-slate-800/40 text-[8px] text-slate-700 uppercase tracking-wider">
              <div className="px-4 py-2.5">Seq</div>
              <div className="px-4 py-2.5">Version</div>
              <div className="px-4 py-2.5">Firmware Hash</div>
              <div className="px-4 py-2.5">Timestamp</div>
              <div className="px-4 py-2.5">Entry Hash</div>
              <div className="px-4 py-2.5">Verify</div>
            </div>
            {entries.map((entry: any, i: number) => (
              <div key={i} className={`grid grid-cols-6 border-b border-slate-900/30 text-[10px] hover:bg-slate-900/20 transition-colors ${i % 2 === 0 ? 'bg-slate-950/30' : ''}`}>
                <div className="px-4 py-2.5 text-purple-500">{entry.sequence}</div>
                <div className="px-4 py-2.5 text-slate-300">v{entry.version}</div>
                <div className="px-4 py-2.5 text-slate-500">{entry.firmware_hash?.slice(0, 20)}...</div>
                <div className="px-4 py-2.5 text-slate-700">{entry.timestamp?.slice(0, 19)}</div>
                <div className="px-4 py-2.5 text-purple-600">{entry.entry_hash?.slice(0, 20)}...</div>
                <div className="px-4 py-2.5">
                  <button
                    onClick={() => verifyInclusion(entry.firmware_hash)}
                    disabled={verifying === entry.firmware_hash}
                    className="text-[8px] px-2 py-1 rounded border border-slate-800 text-slate-600 hover:text-purple-400 hover:border-purple-800 transition-colors disabled:opacity-40 uppercase tracking-wider"
                  >
                    {verifying === entry.firmware_hash ? "···" : "Prove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && !loading && (
          <div className="text-center py-24">
            <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-2">Log Empty</div>
            <div className="text-[9px] text-slate-800">Sign firmware via /sign to populate the transparency log</div>
          </div>
        )}

        {/* Proof Modal */}
        {proofResult && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setProofResult(null)}
          >
            <div
              className="bg-[#0a0c10] border border-slate-800/60 rounded-lg p-6 max-w-md w-full max-h-[70vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-purple-500 tracking-[3px] uppercase">Inclusion Proof</span>
                <button onClick={() => setProofResult(null)} className="text-slate-700 hover:text-slate-400 text-sm transition-colors">×</button>
              </div>
              <div className={`p-3 rounded border mb-4 ${proofResult.in_transparency_log ? 'border-emerald-900/40 bg-emerald-950/10' : 'border-red-900/40 bg-red-950/10'}`}>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${proofResult.in_transparency_log ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={proofResult.in_transparency_log ? 'text-emerald-500' : 'text-red-400'}>
                    {proofResult.message}
                  </span>
                </div>
              </div>
              {proofResult.inclusion_proof && (
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-700 uppercase tracking-wider mb-2">Chain Path</div>
                  {proofResult.inclusion_proof.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[9px]">
                      <span className="text-purple-700 w-4">#{step.sequence}</span>
                      <span className="text-slate-800">→</span>
                      <span className="text-purple-500/70">{step.entry_hash?.slice(0, 32)}...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
