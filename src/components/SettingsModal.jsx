import React, { useState } from 'react';
import { X, Wifi, Volume2, VolumeX, Save, Info } from 'lucide-react';


export function SettingsModal({
  isOpen,
  onClose,
  wsUrl,
  onSaveWsUrl,
  detectionThreshold,
  onSaveThreshold,
  soundAlerts,
  onToggleSound,
}) {
  const [urlInput, setUrlInput] = useState(wsUrl);
  const [thresholdInput, setThresholdInput] = useState(detectionThreshold);
  const [testingStatus, setTestingStatus] = useState(null);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveWsUrl(urlInput);
    onSaveThreshold(Number(thresholdInput));
    onClose();
  };

  const testConnection = () => {
    setTestingStatus('testing');
    try {
      let testUrl = urlInput.trim();
      if (!testUrl.startsWith('ws://') && !testUrl.startsWith('wss://')) {
        testUrl = `ws://${testUrl}`;
      }
      const testSocket = new WebSocket(testUrl);
      const timer = setTimeout(() => {
        if (testSocket.readyState !== WebSocket.OPEN) {
          testSocket.close();
          setTestingStatus('failed');
        }
      }, 3000);

      testSocket.onopen = () => {
        clearTimeout(timer);
        setTestingStatus('success');
        testSocket.close();
      };

      testSocket.onerror = () => {
        clearTimeout(timer);
        setTestingStatus('failed');
      };
    } catch {
      setTestingStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              ObjectSense Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* WebSocket URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              ESP32 WebSocket URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="ws://192.168.1.100/ws"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={testConnection}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                Test
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Default is read from <code className="text-cyan-400">VITE_ESP32_WS_URL</code>. Can be updated live here without rebuilding.
            </p>
            {testingStatus === 'testing' && (
              <span className="text-[11px] font-mono text-amber-400 mt-1 block">Connecting to socket...</span>
            )}
            {testingStatus === 'success' && (
              <span className="text-[11px] font-mono text-emerald-400 mt-1 block">✓ Socket connection verified!</span>
            )}
            {testingStatus === 'failed' && (
              <span className="text-[11px] font-mono text-rose-400 mt-1 block">✕ Connection failed or timed out. Check IP and Wi-Fi.</span>
            )}
          </div>

          {/* Detection Distance Threshold */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Detection Threshold Distance
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {thresholdInput} cm
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Readings below this distance will trigger an <span className="text-rose-400">OBJECT DETECTED</span> status.
            </p>
          </div>

          {/* Sound Alerts */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-3">
              {soundAlerts ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">Audio Alert Tone</div>
                <div className="text-[11px] text-slate-400">Plays <code className="text-cyan-400">object-detected.mp3</code> on new object detection</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundAlerts ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>


          {/* Quick Hardware Format Hint */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-[11px] font-mono text-cyan-300/80">
            <div className="flex items-center gap-1 font-bold text-cyan-400 mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Expected ESP32 WebSocket Packet:</span>
            </div>
            <code>{`{"angle": 75, "distance": 42, "detected": true, "timestamp": 1727689262}`}</code>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SettingsModal;
