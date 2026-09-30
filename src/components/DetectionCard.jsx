import React from 'react';
import { Target, ShieldCheck, Radio } from 'lucide-react';


export function DetectionCard({
  detected = false,
  distance = null,
  angle = null,
  detectionThreshold = 50,
}) {
  const isNear = detected && distance !== null && distance <= 25;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 shadow-xl overflow-hidden ${
        detected
          ? 'bg-gradient-to-b from-rose-950/30 to-slate-900/90 border-rose-500/40 shadow-rose-950/20'
          : 'bg-slate-900/90 border-slate-800 shadow-black/40'
      }`}
    >
      {/* Background ambient glow when object detected */}
      {detected && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            OBJECT STATUS
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide ${
            detected
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {detected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
              <span>{isNear ? 'NEAR OBJECT' : 'CONFIRMED'}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </>
          )}
        </div>
      </div>

      {/* Primary Status Banner */}
      <div className="my-4">
        {detected ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/20">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight flex items-center gap-1.5">
                🎯 OBJECT DETECTED
              </div>
              <p className="text-xs text-rose-300/80 font-medium">
                Ultrasonic echo returned within threshold (&lt;{detectionThreshold}cm)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-300 tracking-tight">
                NO OBJECT DETECTED
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Scanning area path is clear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Key Telemetry Parameters */}
      <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5">
        
        {/* Distance Field */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Distance
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold font-mono ${
              detected ? 'text-rose-300' : 'text-slate-400'
            }`}
          >
            {detected && distance !== null ? `${distance}` : '--'}
            <span className="text-xs font-normal text-slate-400 ml-1">cm</span>
          </span>
        </div>

        {/* Angle Field */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Angle
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold font-mono ${
              detected && angle !== null ? 'text-cyan-300' : 'text-slate-400'
            }`}
          >
            {detected && angle !== null ? `${angle}°` : '--°'}
          </span>
        </div>

        {/* Status Field */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Status
          </span>
          <span
            className={`text-sm sm:text-base font-bold font-mono mt-1 ${
              detected ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {detected ? 'CONFIRMED' : 'CLEAR'}
          </span>
        </div>

      </div>
    </div>
  );
}

export default DetectionCard;
