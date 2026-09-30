import React from 'react';
import { ScanLine, Target, Minimize2, Calculator } from 'lucide-react';


export function StatisticsCards({
  stats = {
    totalScans: 0,
    objectsDetected: 0,
    minDistance: null,
    avgDistance: null,
  },
}) {
  const detectionRate =
    stats.totalScans > 0
      ? Math.round((stats.objectsDetected / stats.totalScans) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      
      {/* Total Scans */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ScanLine className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {stats.totalScans.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">pts</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Cumulative data points
        </span>
      </div>

      {/* Objects Detected */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Objects Detected</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-400">
            {stats.objectsDetected.toLocaleString()}
          </span>
          <span className="text-xs text-rose-400/80 font-mono">
            ({detectionRate}%)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Confirmed obstacle alerts
        </span>
      </div>

      {/* Minimum Distance */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Minimum Distance</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Minimize2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-300">
            {stats.minDistance !== null ? stats.minDistance : '--'}
          </span>
          <span className="text-xs text-slate-400">cm</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Closest proximity recorded
        </span>
      </div>

      {/* Average Distance */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Average Distance</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calculator className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-300">
            {stats.avgDistance !== null ? stats.avgDistance : '--'}
          </span>
          <span className="text-xs text-slate-400">cm</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Mean sensor distance
        </span>
      </div>

    </div>
  );
}

export default StatisticsCards;
