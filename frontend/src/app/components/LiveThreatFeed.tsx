"use client";
import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, ShieldAlert, Cpu, AlertTriangle } from "lucide-react";

export type LogEntry = {
  id: string;
  timestamp: string;
  message: string;
  type: "system" | "attack" | "blocked" | "info";
};

export default function LiveThreatFeed({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-emerald-900/40 relative overflow-hidden">
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="flex items-center gap-2 p-3 border-b border-emerald-900/30 bg-emerald-950/20 backdrop-blur-sm">
        <Terminal className="text-emerald-500 w-4 h-4" />
        <h3 className="font-mono text-xs text-emerald-400 font-semibold tracking-widest uppercase">Live Threat Intel</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">STREAM ACTIVE</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-[11px] md:text-xs overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            let colorClass = "text-emerald-600";
            let Icon = Shield;
            
            if (log.type === "attack") {
              colorClass = "text-red-400 font-bold";
              Icon = AlertTriangle;
            } else if (log.type === "blocked") {
              colorClass = "text-amber-400";
              Icon = ShieldAlert;
            } else if (log.type === "system") {
              colorClass = "text-emerald-400";
              Icon = Cpu;
            }

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 border-b border-white/5 pb-1"
              >
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={colorClass}>
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-emerald-900/50 text-center mt-10">
            Awaiting intercept data...
          </div>
        )}
      </div>
    </div>
  );
}
