'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type LogEntry = { time: string; text: string; type: 'info' | 'success' | 'error' | 'warning' };

export default function AttacksPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, text, type }]);
  };

  const clearLogs = () => setLogs([]);

  const runAttack = async (endpoint: string, label: string) => {
    if (running) return;
    setRunning(true);
    clearLogs();
    addLog(`Initiating ${label}...`, 'warning');

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
      addLog(`Connection failed: ${err.message}`, 'error');
    }
    setRunning(false);
  };

  const resetFleet = async () => {
    setRunning(true);
    clearLogs();
    addLog('Resetting fleet to clean state...', 'info');
    try {
      await fetch(`${API}/api/demo/reset`, { method: 'POST' });
      addLog('Fleet reset complete. All vehicles → QUANTUM_SAFE', 'success');
    } catch (err: any) {
      addLog(`Reset failed: ${err.message}`, 'error');
    }
    setRunning(false);
  };

  const logColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-mono text-2xl font-bold tracking-wider">
          <span className="text-red-500">⚔️</span>{' '}
          <span className="text-slate-300">CYBER</span>{' '}
          <span className="text-red-400">WARFARE</span>{' '}
          <span className="text-slate-300">SIMULATOR</span>
        </h1>
        <p className="font-mono text-[9px] text-slate-600 tracking-[4px] uppercase mt-1">
          LAUNCH ATTACKS AGAINST VERIOTA FLEET — OBSERVE SOC DASHBOARD RESPONSE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Controls */}
        <div className="space-y-4">
          <div className="font-mono text-[9px] text-slate-500 tracking-[3px] uppercase">
            EXPLOIT MODULES
          </div>

          {/* Tamper Attack */}
          <button
            onClick={() => runAttack('/api/demo/tamper', 'Firmware Tamper Attack')}
            disabled={running}
            className="w-full text-left p-4 rounded-xl border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 hover:border-red-700/60 transition-all disabled:opacity-30 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-900/30 border border-red-800/40 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                💉
              </div>
              <div>
                <div className="font-mono text-red-400 text-xs tracking-wider uppercase font-bold">
                  Launch Tamper Attack
                </div>
                <div className="font-mono text-red-900 text-[8px] tracking-wider mt-0.5">
                  FLIP BYTE 200,000 → MERKLE FAIL → DASHBOARD RED
                </div>
              </div>
            </div>
          </button>

          {/* Rollback Attack */}
          <button
            onClick={() => runAttack('/api/demo/rollback', 'Version Rollback Attack')}
            disabled={running}
            className="w-full text-left p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/60 transition-all disabled:opacity-30 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/30 border border-amber-800/40 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ⏪
              </div>
              <div>
                <div className="font-mono text-amber-400 text-xs tracking-wider uppercase font-bold">
                  Force Version Rollback
                </div>
                <div className="font-mono text-amber-900 text-[8px] tracking-wider mt-0.5">
                  REPLAY V1.0.0 TO PATCHED V2.1.4 → DASHBOARD AMBER
                </div>
              </div>
            </div>
          </button>

          {/* HNDL Comparison */}
          <button
            onClick={() => runAttack('/api/demo/hndl', 'HNDL / Algo Comparison')}
            disabled={running}
            className="w-full text-left p-4 rounded-xl border border-blue-900/50 bg-blue-950/20 hover:bg-blue-950/40 hover:border-blue-700/60 transition-all disabled:opacity-30 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-800/40 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                🔬
              </div>
              <div>
                <div className="font-mono text-blue-400 text-xs tracking-wider uppercase font-bold">
                  HNDL / Algo Comparison
                </div>
                <div className="font-mono text-blue-900 text-[8px] tracking-wider mt-0.5">
                  RSA-2048 VS ML-DSA-65 LIVE BENCHMARK
                </div>
              </div>
            </div>
          </button>

          {/* Reset */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={resetFleet}
              disabled={running}
              className="flex-1 p-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-700/60 transition-all disabled:opacity-30 font-mono text-emerald-500 text-[10px] tracking-wider uppercase"
            >
              🔄 Reset Fleet
            </button>
            <button
              onClick={clearLogs}
              className="flex-1 p-3 rounded-xl border border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/30 transition-all font-mono text-slate-500 text-[10px] tracking-wider uppercase"
            >
              🗑️ Clear Logs
            </button>
          </div>

          {/* Info box */}
          <div className="p-3 rounded-lg border border-slate-800/50 bg-slate-900/20">
            <div className="font-mono text-[8px] text-slate-600 tracking-wider leading-relaxed">
              💡 OPEN THE <span className="text-emerald-500">SOC DASHBOARD</span> AND{' '}
              <span className="text-indigo-400">FLEET MESH MAP</span> SIDE-BY-SIDE TO SEE
              REAL-TIME ATTACK DETECTION. USE THE SIDEBAR (HOVER LEFT EDGE) TO NAVIGATE.
            </div>
          </div>
        </div>

        {/* Attack Log Terminal */}
        <div className="flex flex-col">
          <div className="font-mono text-[9px] text-slate-500 tracking-[3px] uppercase mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ATTACK LOG TERMINAL
          </div>
          <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto rounded-xl border border-slate-800/50 bg-black/60 p-4 font-mono text-[10px] space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-slate-700 text-center py-12">
                <div className="text-2xl mb-2">⚔️</div>
                <div className="tracking-widest uppercase text-[8px]">
                  Ready to attack. Select an exploit module.
                </div>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`${logColor(log.type)} leading-relaxed`}>
                  <span className="text-slate-700">[{log.time}]</span>{' '}
                  {log.type === 'error' && <span className="text-red-500 font-bold">✗ </span>}
                  {log.type === 'success' && <span className="text-emerald-500 font-bold">✓ </span>}
                  {log.type === 'warning' && <span className="text-amber-500 font-bold">⚠ </span>}
                  {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
