import React, { useEffect, useRef, useState } from 'react';

export function Radar({
  currentAngle = 90,
  currentDistance = null,
  isDetected = false,
  angleMap = {},
  maxRange = 60, // default max distance in cm
  onRangeChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [range, setRange] = useState(maxRange);
  const trailLength = 15; // degrees of sweep trail


  // Keep trail history of recent angles to render phosphor radar sweep effect
  const recentAnglesRef = useRef([]);

  // Available ranges
  const rangeOptions = [30, 50, 60, 100, 150];

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (onRangeChange) onRangeChange(newRange);
  };

  useEffect(() => {
    // Record current angle in trail
    const list = recentAnglesRef.current;
    list.push({ angle: currentAngle, time: Date.now() });
    // keep last 25 angles
    if (list.length > 25) {
      list.shift();
    }
  }, [currentAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Support high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear with dark tech background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Radar dimensions: semicircular, origin at bottom-center
      // Give top and side padding for labels
      const paddingX = 40;
      const paddingTop = 36;
      const paddingBottom = 28;

      const cx = width / 2;
      const cy = height - paddingBottom;
      const radius = Math.min(cx - paddingX, cy - paddingTop);

      if (radius <= 10) {
        ctx.restore();
        return;
      }

      // Draw faint background grid glow
      const radialGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      radialGradient.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      radialGradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.02)');
      radialGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      // Helper function to convert angle in degrees (0 = left, 90 = top, 180 = right)
      // to canvas coordinates
      const angleToCoords = (deg, r) => {
        // deg 0 -> theta = PI (left)
        // deg 90 -> theta = PI/2 (top)
        // deg 180 -> theta = 0 (right)
        const rad = Math.PI - (deg * Math.PI) / 180;
        return {
          x: cx + r * Math.cos(rad),
          y: cy - r * Math.sin(rad),
        };
      };

      // 1. Draw Concentric Distance Rings
      const ringSteps = 5;
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.lineWidth = 1;

      for (let i = 1; i <= ringSteps; i++) {
        const r = (radius / ringSteps) * i;
        const distVal = Math.round((range / ringSteps) * i);

        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0, false);
        ctx.strokeStyle = i === ringSteps ? 'rgba(6, 182, 212, 0.4)' : 'rgba(30, 58, 88, 0.5)';
        ctx.setLineDash(i === ringSteps ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring distance label along 90° vertical line
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${distVal}cm`, cx + 18, cy - r + 3);
      }

      // Baseline line connecting 0° to 180°
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Draw Angle Radial Lines: 0°, 30°, 60°, 90°, 120°, 150°, 180°
      const keyAngles = [0, 30, 60, 90, 120, 150, 180];

      keyAngles.forEach((deg) => {
        const outer = angleToCoords(deg, radius);
        const labelCoord = angleToCoords(deg, radius + 18);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(outer.x, outer.y);
        ctx.strokeStyle = deg === 90 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(30, 58, 88, 0.45)';
        ctx.lineWidth = deg === 90 ? 1.5 : 1;
        ctx.stroke();

        // Angle tick marks
        const tickInner = angleToCoords(deg, radius - 6);
        ctx.beginPath();
        ctx.moveTo(tickInner.x, tickInner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Angle Text Labels
        ctx.fillStyle = deg === 90 ? '#38bdf8' : '#94a3b8';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${deg}°`, labelCoord.x, labelCoord.y);
      });

      // Intermediate minor ticks every 10°
      for (let deg = 10; deg < 180; deg += 10) {
        if (keyAngles.includes(deg)) continue;
        const outer = angleToCoords(deg, radius);
        const inner = angleToCoords(deg, radius - 4);
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Draw Historical Points from angleMap
      const now = Date.now();
      Object.keys(angleMap).forEach((degStr) => {
        const deg = Number(degStr);
        const item = angleMap[deg];
        if (!item || item.distance === null || item.distance === undefined) return;

        // Skip readings beyond selected range
        if (item.distance > range * 1.05) return;

        const r = Math.min(radius, (item.distance / range) * radius);
        const pt = angleToCoords(deg, r);

        // Calculate age fade (points fade slightly over 8 seconds)
        const ageMs = item.timestamp ? now - item.timestamp : 0;
        const opacity = Math.max(0.2, 1 - ageMs / 8000);

        if (item.detected) {
          // Detected obstacle point: Glowing Coral/Red dot
          ctx.save();
          ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Outer pulse ring for recent detected obstacle
          if (ageMs < 1200) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.8 - ageMs / 1500})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7 + (ageMs / 1200) * 5, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Clear / background point: Small cyan faint point
          ctx.fillStyle = `rgba(6, 182, 212, ${opacity * 0.4})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Draw Animated Sweep Trail (Phosphor Glow Effect)
      const sweepRad = Math.PI - (currentAngle * Math.PI) / 180;
      // We draw an arc sector trailing behind the current angle
      const trailWidthRad = (trailLength * Math.PI) / 180;
      // Determine sweep direction from recent angles
      let dir = 1;
      const history = recentAnglesRef.current;
      if (history.length >= 2) {
        dir = history[history.length - 1].angle >= history[history.length - 2].angle ? 1 : -1;
      }

      // Draw gradient cone for sweep beam
      ctx.save();
      const sweepCone = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepCone.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      sweepCone.addColorStop(0.6, 'rgba(6, 182, 212, 0.1)');
      sweepCone.addColorStop(1, 'rgba(6, 182, 212, 0.01)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Sweep sector
      const trailStartRad = dir > 0 ? sweepRad + trailWidthRad : sweepRad - trailWidthRad;
      ctx.arc(cx, cy, radius, sweepRad, trailStartRad, dir <= 0);
      ctx.closePath();
      ctx.fillStyle = sweepCone;
      ctx.fill();
      ctx.restore();

      // 5. Draw Primary Active Scanning Laser Line
      const beamTip = angleToCoords(currentAngle, radius);
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(beamTip.x, beamTip.y);
      ctx.stroke();
      ctx.restore();

      // 6. Draw Current Detected Object Marker at exact beam position
      if (currentDistance !== null && currentDistance !== undefined && currentDistance <= range) {
        const objRadius = (currentDistance / range) * radius;
        const objPt = angleToCoords(currentAngle, objRadius);

        ctx.save();
        if (isDetected) {
          // Intense target lock graphic
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(objPt.x, objPt.y, 5.5, 0, Math.PI * 2);
          ctx.fill();

          // Reticle ring
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(objPt.x, objPt.y, 11, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle cross-ticks
          const tick = 4;
          ctx.beginPath();
          ctx.moveTo(objPt.x - 11 - tick, objPt.y);
          ctx.lineTo(objPt.x - 11, objPt.y);
          ctx.moveTo(objPt.x + 11, objPt.y);
          ctx.lineTo(objPt.x + 11 + tick, objPt.y);
          ctx.moveTo(objPt.x, objPt.y - 11 - tick);
          ctx.lineTo(objPt.x, objPt.y - 11);
          ctx.moveTo(objPt.x, objPt.y + 11);
          ctx.lineTo(objPt.x, objPt.y + 11 + tick);
          ctx.stroke();

          // Target distance callout tag
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          const text = `${currentDistance}cm`;
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          const textW = ctx.measureText(text).width;
          const boxX = Math.min(width - textW - 14, Math.max(8, objPt.x + 14));
          const boxY = Math.max(16, objPt.y - 8);

          ctx.fillRect(boxX - 4, boxY - 10, textW + 8, 16);
          ctx.strokeRect(boxX - 4, boxY - 10, textW + 8, 16);
          ctx.fillStyle = '#fca5a5';
          ctx.textAlign = 'left';
          ctx.fillText(text, boxX, boxY + 2);
        } else {
          // Clear measurement indicator along beam
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(objPt.x, objPt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Draw Scanner Base / Servo Origin Hub
      ctx.save();
      // Outer glow ring
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Servo rotor center
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Scanner indicator arrow pointing towards current angle
      const arrowTip = angleToCoords(currentAngle, 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(arrowTip.x, arrowTip.y);
      ctx.stroke();
      ctx.restore();

      // Restore high-DPI scaling
      ctx.restore();
    };

    render();

    // Re-render on window resize
    const handleResize = () => {
      render();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentAngle, currentDistance, isDetected, angleMap, range, trailLength]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl shadow-black/40 overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
            Live Radar Scan
          </h2>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
            0° - 180° SWEEP
          </span>
        </div>

        {/* Range Controls */}
        <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-lg p-0.5">
          <span className="text-[11px] text-slate-400 px-1.5 font-medium hidden sm:inline">Range:</span>
          {rangeOptions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRangeChange(r)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                range === r
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}cm
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative w-full aspect-[2/1] min-h-[220px] max-h-[460px] flex items-center justify-center my-auto">
        <canvas
          ref={canvasRef}
          className="w-full h-full block select-none cursor-crosshair rounded-xl"
        />

        {/* Real-time telemetry HUD overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur border border-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-mono">
            <span className="text-slate-400">BEAM ANGLE: </span>
            <span className="text-cyan-400 font-bold">{currentAngle}°</span>
          </div>
          <div className="bg-slate-950/85 backdrop-blur border border-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-mono">
            <span className="text-slate-400">RAW RANGE: </span>
            <span className={isDetected ? 'text-rose-400 font-bold' : 'text-slate-200'}>
              {currentDistance !== null ? `${currentDistance} cm` : '--'}
            </span>
          </div>
        </div>

        {/* Bottom Scanner Legend */}
        <div className="absolute bottom-1 right-2 pointer-events-none hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur border border-slate-800/80 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Target</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Radar;
