import React, { useState, useEffect } from 'react';
import { Radar, Settings, Clock } from 'lucide-react';
import { ConnectionStatus } from '../services/esp32Service';


export function Navbar({
  mode,
  setMode,
  connectionStatus,
  onOpenSettings,
}) {
  const [timeStr, setTimeStr] = useState('');

  // Clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isConnecting =
    connectionStatus === ConnectionStatus.CONNECTING ||
    connectionStatus === ConnectionStatus.RECONNECTING;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Radar className="w-5 h-5 animate-spin-slow" />
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-sm -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Object<span className="text-cyan-400">Sense</span>
                </span>
                {mode === 'demo' && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide hidden sm:block">
                ESP32 Ultrasonic Object Detection
              </p>
            </div>
          </div>

          {/* Right: Controls & Status Indicators */}
          <div className="flex items-center gap-3">
            
            {/* Live / Demo Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mode === 'live'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Connect to physical ESP32 hardware via WebSocket"
              >
                LIVE
              </button>
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mode === 'demo'
                    ? 'bg-purple-500 text-white font-semibold shadow-sm shadow-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Run simulated 0°-180° servo sweep and obstacle data"
              >
                DEMO
              </button>
            </div>

            {/* Connection Status Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors ${
                mode === 'demo'
                  ? 'bg-purple-950/40 border-purple-800/60 text-purple-300'
                  : isConnected
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : isConnecting
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    mode === 'demo'
                      ? 'bg-purple-400'
                      : isConnected
                      ? 'bg-emerald-400'
                      : isConnecting
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    mode === 'demo'
                      ? 'bg-purple-400'
                      : isConnected
                      ? 'bg-emerald-400'
                      : isConnecting
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">
                {mode === 'demo'
                  ? 'SIMULATION'
                  : isConnected
                  ? 'ESP32 ONLINE'
                  : isConnecting
                  ? 'CONNECTING...'
                  : 'ESP32 OFFLINE'}
              </span>
              <span className="sm:hidden">
                {mode === 'demo'
                  ? 'DEMO'
                  : isConnected
                  ? 'ONLINE'
                  : 'OFFLINE'}
              </span>
            </div>

            {/* Current Time */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{timeStr}</span>
            </div>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="ESP32 Connection & Sensor Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
