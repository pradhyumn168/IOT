import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';

export function DistanceChart({
  angleMap = {},
  currentAngle = 90,
  detectionThreshold = 50,
}) {
  // Construct 0° to 180° continuous dataset for chart
  const chartData = useMemo(() => {
    const data = [];
    for (let deg = 0; deg <= 180; deg += 2) {
      const entry = angleMap[deg];
      data.push({
        angle: deg,
        distance: entry && entry.distance !== null ? entry.distance : null,
        detected: entry ? entry.detected : false,
      });
    }
    return data;
  }, [angleMap]);

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/40">
      
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Distance vs Angle Profile
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span>Profile (cm)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-0.5 border-t border-dashed border-rose-400 inline-block" />
            <span>Threshold ({detectionThreshold}cm)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>Beam ({currentAngle}°)</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="distGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="angle"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}°`}
              domain={[0, 180]}
              type="number"
              ticks={[0, 30, 60, 90, 120, 150, 180]}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}cm`}
              domain={[0, 'auto']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl shadow-xl font-mono text-xs">
                      <div className="text-cyan-400 font-bold mb-1">
                        Angle: {item.angle}°
                      </div>
                      <div className="text-slate-200">
                        Distance: {item.distance !== null ? `${item.distance} cm` : 'No reading'}
                      </div>
                      <div className={item.detected ? 'text-rose-400 font-bold mt-1' : 'text-emerald-400 mt-1'}>
                        {item.detected ? '⚠ Object Detected' : '✓ Clear'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Line */}
            <ReferenceLine
              y={detectionThreshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Current Beam Angle Marker */}
            <ReferenceLine
              x={currentAngle}
              stroke="#f59e0b"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="distance"
              stroke="#22d3ee"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#distGradient)"
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default DistanceChart;
