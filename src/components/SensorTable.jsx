import React, { useState } from 'react';
import { Table, Download, Trash2 } from 'lucide-react';


export function SensorTable({
  history = [],
  onClearHistory,
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OBJECT' | 'CLEAR'

  const filteredHistory = history.filter((item) => {
    if (filter === 'OBJECT') return item.status === 'Object';
    if (filter === 'CLEAR') return item.status === 'Clear';
    return true;
  });

  const exportCSV = () => {
    if (history.length === 0) return;
    const header = ['Time', 'Angle (deg)', 'Distance (cm)', 'Status'];
    const rows = history.map((r) => [r.time, r.angle, r.distance, r.status]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `objectsense_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Live Sensor Data Log
          </h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {history.length} / 50 readings
          </span>
        </div>

        {/* Table Actions */}
        <div className="flex items-center gap-2">
          
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {['ALL', 'OBJECT', 'CLEAR'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === f
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={exportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 disabled:opacity-40 transition-colors"
            title="Clear Log History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Body Container */}
      <div className="mt-3 overflow-x-auto max-h-[340px] rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 text-slate-400">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Time</th>
              <th className="py-2.5 px-3 font-semibold">Angle</th>
              <th className="py-2.5 px-3 font-semibold">Distance</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                  No readings available yet. Connect ESP32 or switch to DEMO mode.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    idx === 0 ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-300 font-medium">
                    {item.time}
                  </td>
                  <td className="py-2 px-3 text-cyan-400 font-semibold">
                    {item.angle}°
                  </td>
                  <td className="py-2 px-3 text-white">
                    {item.distance !== null ? `${item.distance} cm` : '--'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === 'Object'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Object' ? 'bg-rose-400' : 'bg-emerald-400'
                        }`}
                      />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default SensorTable;
