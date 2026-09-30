import React from 'react';
import { ConnectionStatus as StatusTypes } from '../services/esp32Service';

export function ConnectionStatus({ status, mode = 'demo' }) {
  const isConnected = status === StatusTypes.CONNECTED;
  const isConnecting =
    status === StatusTypes.CONNECTING || status === StatusTypes.RECONNECTING;

  if (mode === 'demo') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide bg-purple-950/40 border-purple-800/60 text-purple-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
        </span>
        <span>DEMO MODE</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-colors ${
        isConnected
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
          : isConnecting
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
          : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isConnected
              ? 'bg-emerald-400'
              : isConnecting
              ? 'bg-amber-400'
              : 'bg-rose-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected
              ? 'bg-emerald-400'
              : isConnecting
              ? 'bg-amber-400'
              : 'bg-rose-400'
          }`}
        />
      </span>
      <span>
        {isConnected
          ? 'ESP32 ONLINE'
          : isConnecting
          ? 'CONNECTING...'
          : 'ESP32 OFFLINE'}
      </span>
    </div>
  );
}

export default ConnectionStatus;
