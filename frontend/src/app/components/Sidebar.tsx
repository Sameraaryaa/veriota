'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',           label: 'SOC Dashboard',        icon: '🛡️', desc: 'Fleet monitoring & vehicle status' },
  { href: '/attacks',    label: 'Cyber Warfare Sim',    icon: '⚔️', desc: 'Launch tamper & rollback attacks' },
  { href: '/comparison', label: 'Algorithm Compare',    icon: '⚡', desc: 'RSA-2048 vs ML-DSA-65 benchmark' },
  { href: '/compliance', label: 'Compliance & Intel',   icon: '📋', desc: 'UNECE R155/R156, ISO 21434, TARA' },
  { href: '/transparency', label: 'Transparency Log',  icon: '🔗', desc: 'π-seeded append-only hash chain' },
  { href: '/ecu-sim.html',   label: '3D ECU Simulator', icon: '🧠', desc: 'Interactive firmware flash simulation', external: true },
  { href: '/fleet-mesh.html', label: 'Fleet Network Mesh', icon: '🗺️', desc: 'India map with real-time node status', external: true },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Trigger — thin bar on left edge */}
      <div
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        className="fixed left-0 top-0 h-full w-3 z-50 cursor-pointer"
        style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.05) 100%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-1 w-1 h-12 rounded bg-emerald-500/60" />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        onMouseLeave={() => setOpen(false)}
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="h-full bg-[#0a0f0d]/95 backdrop-blur-xl border-r border-emerald-800/30 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-emerald-900/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-sm">
                🛡️
              </div>
              <div>
                <div className="text-emerald-400 font-mono text-sm font-bold tracking-wider">
                  VERI<span className="text-emerald-300">OTA</span>
                </div>
                <div className="text-emerald-800 font-mono text-[8px] tracking-widest">
                  POST-QUANTUM SOC
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="text-emerald-800 font-mono text-[8px] tracking-[3px] uppercase px-3 py-2">
              Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Component = item.external ? 'a' : Link;
              const extraProps = item.external
                ? { target: '_blank' as const, rel: 'noopener' }
                : {};

              return (
                <Component
                  key={item.href}
                  href={item.href}
                  {...extraProps}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-emerald-900/40 border border-emerald-700/50'
                      : 'hover:bg-emerald-950/40 border border-transparent hover:border-emerald-800/30'
                  }`}
                >
                  <span className="text-base mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-[10px] tracking-wider uppercase ${
                      isActive ? 'text-emerald-400' : 'text-emerald-500 group-hover:text-emerald-400'
                    }`}>
                      {item.label}
                    </div>
                    <div className="text-emerald-900 font-mono text-[8px] mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 animate-pulse" />
                  )}
                </Component>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-900/40">
            <div className="text-emerald-900 font-mono text-[7px] tracking-widest text-center">
              ML-DSA-65 • FIPS 204 • 4-LAYER DEFENSE
            </div>
            <div className="text-emerald-950 font-mono text-[7px] tracking-widest text-center mt-1">
              HOVER LEFT EDGE TO OPEN
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
