import React from 'react';
import { Play, ChevronLeft, ChevronRight, Sliders, Zap, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../services/esp32Service';


export function ServoControl({
  servoAngle = 90,
  scanMode = 'AUTO', // 'AUTO' | 'MANUAL' | 'STOP'
  scanSpeed = 50,
  connectionStatus = ConnectionStatus.DISCONNECTED,
  mode = 'demo',
  lastAck = null,
  actions,
}) {
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isHardwareLive = mode === 'live' && isConnected;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    actions.setAngle(val);
  };

  const stepAngle = (delta) => {
    const nextAngle = Math.max(0, Math.min(180, servoAngle + delta));
    actions.setAngle(nextAngle);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Servo Control
          </h2>
        </div>

        {/* Live vs Simulation indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {mode === 'demo' ? (
            <span className="flex items-center gap-1 text-purple-400 bg-purple-950/40 border border-purple-800/60 px-2 py-0.5 rounded">
              <Zap className="w-3 h-3" /> Simulation Mode
            </span>
          ) : isHardwareLive ? (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Hardware Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Hardware Offline (Demo Fallback)
            </span>
          )}
        </div>
      </div>

      {/* Servo Angle Interactive Display */}
      <div className="my-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Servo Angle
          </span>
          <span className="text-2xl font-black font-mono text-cyan-400">
            {servoAngle}°
          </span>
        </div>

        {/* Visual Slider */}
        <div className="relative flex items-center py-2">
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={servoAngle}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Ticks representation */}
        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-0.5">
          <span>0°</span>
          <span>45°</span>
          <span>90°</span>
          <span>135°</span>
          <span>180°</span>
        </div>
      </div>

      {/* Preset Angle Buttons */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {[0, 45, 90, 135, 180].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => actions.setAngle(preset)}
            className={`py-1 text-xs font-mono rounded-lg border transition-all ${
              servoAngle === preset
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm shadow-cyan-500/20'
                : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {preset}°
          </button>
        ))}
      </div>

      {/* Primary Control Buttons: [ ◀ ]  [ AUTO SCAN ]  [ ▶ ] */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Step Left */}
        <button
          type="button"
          onClick={() => stepAngle(-5)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors active:scale-95"
          title="Step 5° Left"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-400" />
          <span>5°</span>
        </button>

        {/* Auto Scan Toggle */}
        <button
          type="button"
          onClick={() => {
            if (scanMode === 'AUTO') {
              actions.stopScan();
            } else {
              actions.startScan();
            }
          }}
          className={`flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase border transition-all active:scale-95 ${
            scanMode === 'AUTO'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          {scanMode === 'AUTO' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>SCANNING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-cyan-400" />
              <span>AUTO SCAN</span>
            </>
          )}
        </button>

        {/* Step Right */}
        <button
          type="button"
          onClick={() => stepAngle(5)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors active:scale-95"
          title="Step 5° Right"
        >
          <span>5°</span>
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Mode Selector: AUTO | MANUAL | STOP */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={actions.startScan}
          className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
            scanMode === 'AUTO'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AUTO
        </button>
        <button
          type="button"
          onClick={() => {
            actions.stopScan();
          }}
          className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
            scanMode === 'MANUAL' || scanMode === 'STOP'
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          MANUAL
        </button>
        <button
          type="button"
          onClick={actions.stopScan}
          className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
            scanMode === 'STOP'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          STOP
        </button>
      </div>

      {/* Scanning Speed Control */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">
            Scanning Speed
          </span>
          <span className="font-mono text-cyan-400">
            {scanSpeed <= 25 ? 'Fast' : scanSpeed <= 50 ? 'Normal' : 'Slow'} ({scanSpeed}ms)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Fast', speed: 25 },
            { label: 'Normal', speed: 50 },
            { label: 'Slow', speed: 100 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => actions.setSpeed(item.speed)}
              className={`py-1 text-xs font-mono rounded-lg border transition-colors ${
                scanSpeed === item.speed
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Command Telemetry Status */}
      {lastAck && (
        <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
          <span className="text-slate-400">Command: {lastAck.command}</span>
          <span className={lastAck.success ? 'text-emerald-400' : 'text-amber-400'}>
            {lastAck.success ? '✓ ACK Sent' : '⚠ Queued'}
          </span>
        </div>
      )}

    </div>
  );
}

export default ServoControl;
