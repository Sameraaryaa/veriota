"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

type Alert = {
  type: string;
  detail: Record<string, any>;
};

type Vehicle = {
  vehicle_id: string;
  current_version: string;
  algorithm: string;
  status: "QUANTUM_SAFE" | "TAMPERED" | "ROLLBACK_BLOCKED" | "LEGACY_RSA";
  alerts: Alert[];
  last_updated?: string;
};

const STATUS_CONFIG: Record<string, any> = {
  QUANTUM_SAFE: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-950/20",
    text: "text-emerald-400",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    icon: CheckCircle2,
    anim: false
  },
  TAMPERED: {
    border: "border-red-500",
    bg: "bg-red-950/40",
    text: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    icon: AlertOctagon,
    anim: true
  },
  ROLLBACK_BLOCKED: {
    border: "border-amber-500",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    icon: ShieldAlert,
    anim: true
  },
  LEGACY_RSA: {
    border: "border-slate-600",
    bg: "bg-slate-900/30",
    text: "text-slate-400",
    glow: "",
    icon: Server,
    anim: false
  },
};

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [modalOpen, setModalOpen] = useState(false);
  const config = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG["LEGACY_RSA"];
  const Icon = config.icon;

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => { if (vehicle.alerts?.length > 0) setModalOpen(true); }}
        className={`relative p-3 rounded border backdrop-blur-md transition-colors cursor-default
          ${config.border} ${config.bg} ${config.glow} 
          ${vehicle.alerts?.length > 0 ? "cursor-pointer hover:bg-opacity-80" : ""}
        `}
      >
        {config.anim && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.bg.replace('/40', '')}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${config.border.replace('border-', 'bg-')}`}></span>
          </span>
        )}

        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${config.text}`} />
          <span className="font-mono font-bold text-sm text-slate-200">{vehicle.vehicle_id}</span>
        </div>

        <div className="text-[10px] font-mono text-slate-400 flex justify-between">
          <span>FW:</span>
          <span className="text-emerald-300 font-bold tracking-wider">{vehicle.current_version}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-0.5">
          <span>SIG:</span>
          <span className="text-emerald-500 truncate w-16 text-right" title={vehicle.algorithm}>{vehicle.algorithm}</span>
        </div>
        {vehicle.last_updated && (
          <div className="text-[9px] font-mono text-slate-500 flex justify-between mt-0.5">
            <span>UPD:</span>
            <span className="text-slate-400 truncate" title={vehicle.last_updated}>
              {(() => {
                try { return new Date(vehicle.last_updated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); }
                catch { return '—'; }
              })()}
            </span>
          </div>
        )}

        {vehicle.alerts?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10 text-center">
            <span className={`text-[9px] font-bold font-mono tracking-widest uppercase ${config.text} bg-black/30 px-2 py-0.5 rounded`}>
              Inspect Logs
            </span>
          </div>
        )}
      </motion.div>

      {/* Threat Analysis Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border-2 border-red-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl shadow-red-900/20"
            >
              <div className="flex justify-between items-center mb-6 border-b border-red-900/50 pb-4">
                <div className="flex items-center gap-3">
                  <AlertOctagon className="text-red-500 w-8 h-8" />
                  <div>
                    <h2 className="text-xl font-bold font-mono text-red-500 uppercase tracking-widest">Threat Intercept Report</h2>
                    <p className="text-xs font-mono text-slate-400">Target Node: {vehicle.vehicle_id}</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white font-mono text-sm px-3 py-1 border border-slate-700 rounded">CLOSE</button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-300 scrollbar-thin scrollbar-thumb-red-900">
                {vehicle.alerts.map((alert, i) => {
                  const d = alert.detail || {};
                  const chunks = d.tampered_chunks || [];
                  const isRollback = alert.type === "ROLLBACK_BLOCKED";

                  return (
                    <div key={i} className={`border rounded-lg overflow-hidden ${isRollback ? "border-amber-900/50 bg-amber-950/10" : "border-red-900/30 bg-red-950/10"}`}>
                      {/* Alert Header */}
                      <div className={`px-4 py-2 border-b font-bold uppercase tracking-widest text-[10px] flex items-center justify-between ${isRollback ? "text-amber-400 border-amber-900/50 bg-amber-950/30" : "text-red-400 border-red-900/50 bg-red-950/30"}`}>
                        <span>{alert.type === "TAMPERED" ? "⚠ FIRMWARE TAMPER DETECTED" : alert.type === "ROLLBACK_BLOCKED" ? "🔒 ROLLBACK ATTEMPT BLOCKED" : `⚡ ${alert.type}`}</span>
                        {d.detected_at && <span className="text-slate-500 font-normal text-[8px]">{new Date(d.detected_at).toLocaleString()}</span>}
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Metadata rows */}
                        {d.signature_valid !== undefined && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between bg-black/30 px-3 py-1.5 rounded">
                              <span className="text-slate-500">Signature</span>
                              <span className={d.signature_valid ? "text-emerald-400" : "text-red-400"}>{d.signature_valid ? "✔ Valid" : "✘ Invalid"}</span>
                            </div>
                            <div className="flex justify-between bg-black/30 px-3 py-1.5 rounded">
                              <span className="text-slate-500">Chunks Modified</span>
                              <span className="text-red-400 font-bold">{d.chunk_count_tampered ?? chunks.length}</span>
                            </div>
                          </div>
                        )}

                        {/* Merkle root comparison */}
                        {d.merkle_root_expected && (
                          <div className="bg-black/30 rounded p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 w-20 shrink-0">Expected:</span>
                              <span className="text-emerald-400 break-all">{d.merkle_root_expected}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 w-20 shrink-0">Computed:</span>
                              <span className="text-red-400 break-all">{d.merkle_root_computed}</span>
                            </div>
                          </div>
                        )}

                        {/* Rollback details */}
                        {isRollback && d.attempted_version && (
                          <div className="bg-black/30 rounded p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Attempted Version</span>
                              <span className="text-amber-400 font-bold">v{d.attempted_version}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Current Version</span>
                              <span className="text-emerald-400 font-bold">v{d.current_version}</span>
                            </div>
                            <div className="text-amber-300/70 text-[9px] mt-1 italic">Monotonic version enforcement: downgrade refused even with valid signature</div>
                          </div>
                        )}

                        {/* Tampered chunks — expandable list */}
                        {chunks.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[9px] text-red-400/70 uppercase tracking-widest">Tampered Regions ({chunks.length}):</div>
                            {chunks.map((c: any, ci: number) => (
                              <div key={ci} className="bg-red-950/20 border border-red-900/30 rounded p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-red-400 font-bold">Chunk #{c.chunk_index}</span>
                                  <span className="text-slate-500 text-[9px]">Bytes {c.byte_start?.toLocaleString()} – {c.byte_end?.toLocaleString()}</span>
                                </div>
                                {c.trusted_hash && (
                                  <div className="grid grid-cols-[60px_1fr] gap-1 text-[9px]">
                                    <span className="text-slate-600">Trusted:</span>
                                    <span className="text-emerald-500/60 break-all">{c.trusted_hash}</span>
                                    <span className="text-slate-600">Got:</span>
                                    <span className="text-red-400/80 break-all">{c.computed_hash}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Firmware hash */}
                        {d.firmware_hash_received && (
                          <div className="flex items-center gap-2 text-[9px] bg-black/20 rounded px-3 py-1.5">
                            <span className="text-slate-500">Received FW Hash:</span>
                            <span className="text-slate-400 break-all">{d.firmware_hash_received.substring(0, 32)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
