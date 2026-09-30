import React from 'react';
import { Ruler, Gauge, Activity, Wifi, Cpu } from 'lucide-react';
import { ConnectionStatus } from '../services/esp32Service';


export function SensorCards({
  distance = null,
  angle = 90,
  detected = false,
  connectionStatus = ConnectionStatus.DISCONNECTED,
  mode = 'demo',
}) {
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isConnecting =
    connectionStatus === ConnectionStatus.CONNECTING ||
    connectionStatus === ConnectionStatus.RECONNECTING;

  // Format connection label
  let connectionLabel = 'Offline';
  let connectionColor = 'text-rose-400';
  let connectionBg = 'border-rose-800/40 bg-rose-950/20';

  if (mode === 'demo') {
    connectionLabel = 'Demo Mode';
    connectionColor = 'text-purple-400';
    connectionBg = 'border-purple-800/40 bg-purple-950/20';
  } else if (isConnected) {
    connectionLabel = 'Online';
    connectionColor = 'text-emerald-400';
    connectionBg = 'border-emerald-800/40 bg-emerald-950/20';
  } else if (isConnecting) {
    connectionLabel = 'Connecting';
    connectionColor = 'text-amber-400';
    connectionBg = 'border-amber-800/40 bg-amber-950/20';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      
      {/* 1. Distance Card */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Distance</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Ruler className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-black font-mono tracking-tight text-white">
            {distance !== null ? distance : '--'}
          </span>
          <span className="text-sm font-medium text-slate-400">cm</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, ((distance || 0) / 100) * 100))}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-1 font-mono">
          HC-SR04 Echo Flight Time
        </span>
      </div>

      {/* 2. Servo Angle Card */}
      <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Servo Angle</span>
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-black font-mono tracking-tight text-white">
            {angle}
          </span>
          <span className="text-sm font-medium text-slate-400">deg</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-blue-400 h-full rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, (angle / 180) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>0° (Left)</span>
          <span>90°</span>
          <span>180° (Right)</span>
        </div>
      </div>

      {/* 3. Detection Status Card */}
      <div className={`flex flex-col justify-between border rounded-2xl p-4 shadow-lg shadow-black/30 transition-colors ${
        detected ? 'bg-rose-950/20 border-rose-800/40' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Detection Status</span>
          <div className={`p-2 rounded-xl border ${
            detected
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className={`text-2xl font-black tracking-tight ${
            detected ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {detected ? 'Detected' : 'Clear'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`h-2 w-2 rounded-full ${
            detected ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'
          }`} />
          <span className="text-[11px] text-slate-400 font-mono">
            {detected ? 'Target in field' : 'Path uninhibited'}
          </span>
        </div>
      </div>

      {/* 4. ESP32 Connection Card */}
      <div className={`flex flex-col justify-between border rounded-2xl p-4 shadow-lg shadow-black/30 transition-colors ${connectionBg}`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">ESP32 Connection</span>
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
            {mode === 'demo' ? <Cpu className="w-4 h-4 text-purple-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className={`text-2xl font-black tracking-tight ${connectionColor}`}>
            {connectionLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`h-2 w-2 rounded-full ${
            mode === 'demo'
              ? 'bg-purple-400'
              : isConnected
              ? 'bg-emerald-400'
              : 'bg-rose-400'
          }`} />
          <span className="text-[11px] text-slate-400 font-mono">
            {mode === 'demo' ? 'Simulated Telemetry' : isConnected ? 'WebSocket Active' : 'Disconnected'}
          </span>
        </div>
      </div>

    </div>
  );
}

export default SensorCards;
