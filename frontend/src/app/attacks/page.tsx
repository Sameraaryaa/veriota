'use client';
import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type LogEntry = { time: string; text: string; type: 'info' | 'success' | 'error' | 'warning' };

export default function AttacksPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [targetVehicle, setTargetVehicle] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/fleet`)
      .then(r => r.json())
      .then(data => {
        const vList = data.vehicles || [];
        setVehicles(vList);
        if (vList.length > 0) setTargetVehicle(vList[0].vehicle_id);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, text, type }]);
  };

  const clearLogs = () => setLogs([]);

  const runAttack = async (endpoint: string, label: string, id: string) => {
    if (running) return;
    setRunning(true);
    setActiveAttack(id);
    clearLogs();
    addLog(`[INIT] ${label}`, 'warning');
    addLog(`[TARGET] ${targetVehicle}`, 'info');

    try {
      const res = await fetch(`${API}${endpoint}`, { method: 'POST' });
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
            for (const line of lines) {
              try {
                const data = JSON.parse(line.slice(5));
                const type = data.status === 'error' ? 'error'
                  : data.status === 'complete' ? 'success'
                    : data.status === 'blocked' ? 'warning'
                      : 'info';
                addLog(data.message || data.step || JSON.stringify(data), type);
              } catch { addLog(line.slice(5), 'info'); }
            }
          }
        }
      } else {
        const data = await res.json();
        addLog(JSON.stringify(data, null, 2), res.ok ? 'success' : 'error');
      }
    } catch (err: any) {
      addLog(`[FATAL] Connection refused: ${err.message}`, 'error');
    }
    setRunning(false);
    setActiveAttack(null);
  };

  const resetFleet = async () => {
    setRunning(true);
    setActiveAttack('reset');
    clearLogs();
    addLog('[SYS] Fleet purge initiated...', 'info');
    try {
      await fetch(`${API}/api/demo/reset`, { method: 'POST' });
      addLog('[SYS] All nodes restored to QUANTUM_SAFE baseline', 'success');
      const res = await fetch(`${API}/fleet`);
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (err: any) {
      addLog(`[ERR] ${err.message}`, 'error');
    }
    setRunning(false);
    setActiveAttack(null);
  };

  const statusDot = (s: string) => {
    if (s === 'TAMPERED') return 'bg-red-500 shadow-red-500/50 shadow-sm';
    if (s === 'ROLLBACK_BLOCKED') return 'bg-amber-500 shadow-amber-500/50 shadow-sm';
    return 'bg-emerald-500 shadow-emerald-500/50 shadow-sm';
  };

  const statusLabel = (s: string) => {
    if (s === 'TAMPERED') return 'COMPROMISED';
    if (s === 'ROLLBACK_BLOCKED') return 'BLOCKED';
    return 'SECURED';
  };

  const attacks = [
    {
      id: 'tamper',
      endpoint: `/api/demo/tamper?vehicle=${encodeURIComponent(targetVehicle)}`,
      label: 'Firmware Injection',
      severity: 'CRITICAL',
      severityColor: 'text-red-500 border-red-800 bg-red-950/30',
      borderColor: 'border-red-900/40 hover:border-red-700/50',
      accentBar: 'bg-red-500',
      technique: 'T1195.002',
      tactic: 'Supply Chain',
      desc: 'Mutate firmware binary at offset 200,000. Triggers Merkle tree mismatch at Layer 2.',
      effect: 'LAYER 2 REJECT',
    },
    {
      id: 'rollback',
      endpoint: `/api/demo/rollback?vehicle=${encodeURIComponent(targetVehicle)}`,
      label: 'Version Downgrade',
      severity: 'HIGH',
      severityColor: 'text-amber-500 border-amber-800 bg-amber-950/30',
      borderColor: 'border-amber-900/40 hover:border-amber-700/50',
      accentBar: 'bg-amber-500',
      technique: 'T1562.001',
      tactic: 'Defense Evasion',
      desc: 'Flash legacy v1.0.0 over patched v2.1.4. Monotonic ledger detects version regression.',
      effect: 'LAYER 3 REJECT',
    },
    {
      id: 'hndl',
      endpoint: '/api/demo/hndl',
      label: 'HNDL Harvest',
      severity: 'RECON',
      severityColor: 'text-sky-500 border-sky-800 bg-sky-950/30',
      borderColor: 'border-sky-900/40 hover:border-sky-700/50',
      accentBar: 'bg-sky-500',
      technique: 'T1557',
      tactic: 'Collection',
      desc: 'Harvest Now, Decrypt Later. Benchmark RSA-2048 vs ML-DSA-65 quantum resilience.',
      effect: 'INTEL REPORT',
    },
    {
      id: 'transparency',
      endpoint: '/api/demo/transparency-bypass',
      label: 'Consortium Quorum Bypass',
      severity: 'CRITICAL',
      severityColor: 'text-fuchsia-500 border-fuchsia-800 bg-fuchsia-950/30',
      borderColor: 'border-fuchsia-900/40 hover:border-fuchsia-700/50',
      accentBar: 'bg-fuchsia-500',
      technique: 'T1588.004',
      tactic: 'State-Sponsored',
      desc: 'Compromise 2-of-3 Authority Keys. L1-L3 pass Quorum. Immutability layer caches anomaly.',
      effect: 'LAYER 4 REJECT',
    },
  ];

  return (
    <main className="min-h-screen bg-[#040608] text-slate-200 font-mono selection:bg-red-500/20">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800/60 bg-[#060a0e]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 tracking-[4px] uppercase font-semibold">RED TEAM OPS</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <span className="text-[10px] text-slate-600 tracking-[2px] uppercase">VeriOTA Adversary Simulation Environment</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-slate-700 tracking-wider">
              {running ? (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                  OPERATION ACTIVE
                </span>
              ) : (
                <span className="text-slate-600">STANDBY</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── TARGET SELECTOR ──────────────────────────────────────── */}
        <div className="mb-6">
          <div className="text-[9px] text-slate-600 tracking-[3px] uppercase mb-3">Target Designation</div>
          <div className="flex flex-wrap gap-2 items-center">
            {vehicles.map((v: any) => {
              const selected = targetVehicle === v.vehicle_id && !showCustom;
              return (
                <button
                  key={v.vehicle_id}
                  onClick={() => { setTargetVehicle(v.vehicle_id); setShowCustom(false); }}
                  disabled={running}
                  className={`relative px-3 py-2 rounded border text-[10px] transition-all disabled:opacity-40 ${selected
                      ? 'border-red-700/60 bg-red-950/20 text-red-400'
                      : 'border-slate-800/60 bg-slate-900/20 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                    }`}
                >
                  {selected && <div className="absolute inset-x-0 top-0 h-px bg-red-500" />}
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(v.status)}`} />
                    <span>{v.vehicle_id}</span>
                  </div>
                  <div className="text-[8px] text-slate-700 mt-0.5 text-left">
                    v{v.current_version} · {statusLabel(v.status)}
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => setShowCustom(!showCustom)}
              disabled={running}
              className={`px-3 py-2 rounded border text-[10px] transition-all disabled:opacity-40 ${showCustom
                  ? 'border-slate-600 bg-slate-900/40 text-slate-300'
                  : 'border-dashed border-slate-800 text-slate-700 hover:text-slate-400 hover:border-slate-700'
                }`}
            >
              + Custom ID
            </button>
            {showCustom && (
              <input
                type="text"
                value={targetVehicle}
                onChange={(e) => setTargetVehicle(e.target.value.toUpperCase())}
                className="px-3 py-2 rounded border border-slate-700/60 bg-slate-950/60 text-slate-200 text-[10px] w-44 focus:outline-none focus:border-red-700 transition-colors uppercase placeholder:text-slate-700"
                placeholder="VEHICLE-ID"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* ── MAIN GRID ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ATTACK MODULES — 2 cols */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-[9px] text-slate-600 tracking-[3px] uppercase mb-1">Exploit Modules</div>

            {attacks.map((atk) => (
              <button
                key={atk.id}
                onClick={() => runAttack(atk.endpoint, atk.label, atk.id)}
                disabled={running || (!targetVehicle && atk.id !== 'hndl' && atk.id !== 'transparency')}
                className={`w-full text-left rounded-lg border ${atk.borderColor} bg-slate-950/40 transition-all disabled:opacity-30 group relative overflow-hidden`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${atk.accentBar} ${activeAttack === atk.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'} transition-opacity`} />
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-200 tracking-wide">{atk.label}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded border ${atk.severityColor} uppercase tracking-wider`}>{atk.severity}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed mb-2">{atk.desc}</p>
                  <div className="flex items-center gap-3 text-[8px] text-slate-700">
                    <span>MITRE {atk.technique}</span>
                    <span className="text-slate-800">·</span>
                    <span>{atk.tactic}</span>
                    <span className="text-slate-800">·</span>
                    <span className="text-slate-500">{atk.effect}</span>
                  </div>
                </div>
                {activeAttack === atk.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/10 pointer-events-none">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                )}
              </button>
            ))}

            {/* Actions Row */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={resetFleet}
                disabled={running}
                className="flex-1 px-3 py-2.5 rounded-lg border border-emerald-900/40 bg-slate-950/40 text-emerald-600 text-[9px] tracking-wider uppercase hover:border-emerald-700/50 hover:text-emerald-500 transition-all disabled:opacity-30"
              >
                Restore Fleet
              </button>
              <button
                onClick={clearLogs}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-800/40 bg-slate-950/40 text-slate-600 text-[9px] tracking-wider uppercase hover:border-slate-700 hover:text-slate-500 transition-all"
              >
                Clear Terminal
              </button>
            </div>
          </div>

          {/* TERMINAL OUTPUT — 3 cols */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] text-slate-600 tracking-[3px] uppercase">Operation Output</div>
              <div className="flex items-center gap-2">
                {running && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                <span className="text-[8px] text-slate-700">{logs.length} lines</span>
              </div>
            </div>
            <div className="flex-1 min-h-[520px] max-h-[680px] rounded-lg border border-slate-800/40 bg-[#0a0c0f] overflow-hidden flex flex-col">
              {/* Terminal chrome */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800/30 bg-slate-950/60 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                <span className="text-[8px] text-slate-700 ml-2">adversary@veriota-redteam ~ </span>
              </div>
              {/* Log content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-px">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800">
                    <div className="text-[10px] tracking-widest uppercase mb-2">Terminal Ready</div>
                    <div className="text-[8px] text-slate-800">Select a target and execute an exploit module</div>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-[10px] leading-relaxed">
                      <span className="text-slate-700 flex-shrink-0 select-none">{log.time}</span>
                      <span className={
                        log.type === 'error' ? 'text-red-400' :
                          log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'warning' ? 'text-amber-400' :
                              'text-slate-500'
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER NOTE ──────────────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-slate-900/60">
          <p className="text-[8px] text-slate-800 tracking-wider text-center">
            Open the SOC Dashboard in a second window to observe real-time detection and response during active operations.
          </p>
        </div>
      </div>
    </main>
  );
}
