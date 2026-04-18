type Summary = {
  total: number;
  quantum_safe: number;
  tampered: number;
  rollback_blocked: number;
  legacy_rsa: number;
};

export default function FleetSummaryBar({ summary }: { summary: Summary }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest pl-1">Network Capacity</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "TOTAL NODES", value: summary.total, color: "text-emerald-50", border: "border-emerald-800", bg: "bg-emerald-950/40" },
          { label: "PQC SAFE", value: summary.quantum_safe, color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-900/30", glow: "shadow-[0_0_10px_rgba(16,185,129,0.2)]" },
          { label: "TAMPER DETECT", value: summary.tampered, color: "text-red-500", border: "border-red-900", bg: "bg-red-950/30" },
          { label: "RL-BLK", value: summary.rollback_blocked, color: "text-amber-500", border: "border-amber-900", bg: "bg-amber-950/30" },
          { label: "LEGACY RSA", value: summary.legacy_rsa, color: "text-slate-500", border: "border-slate-800", bg: "bg-slate-900/30" },
        ].map((item) => (
          <div 
            key={item.label} 
            className={`p-3 rounded-lg border ${item.border} ${item.bg} ${item.glow || ""} flex flex-col justify-center items-center text-center transition-all`}
          >
            <div className={`text-2xl font-black font-mono ${item.color}`}>{item.value}</div>
            <div className={`text-[9px] font-mono font-bold tracking-widest mt-1 opacity-80 ${item.color}`}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
