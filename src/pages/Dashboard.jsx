import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Radar from '../components/Radar';
import DetectionCard from '../components/DetectionCard';
import SensorCards from '../components/SensorCard';
import ServoControl from '../components/ServoControl';
import DistanceChart from '../components/DistanceChart';
import SensorTable from '../components/SensorTable';
import StatisticsCards from '../components/StatisticsCards';
import SettingsModal from '../components/SettingsModal';
import useESP32 from '../hooks/useESP32';
import { Sparkles } from 'lucide-react';

export function Dashboard() {
  const {
    mode,
    setMode,
    connectionStatus,
    wsUrl,

    currentDetection,
    history,
    angleMap,
    stats,
    servoAngle,
    scanMode,
    scanSpeed,
    soundAlerts,
    setSoundAlerts,
    detectionThreshold,
    setDetectionThreshold,
    lastAck,
    actions,
  } = useESP32();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [radarRange, setRadarRange] = useState(60);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      
      {/* 1. TOP NAVBAR */}
      <Navbar
        mode={mode}
        setMode={setMode}
        connectionStatus={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* DEMO MODE High-Visibility Banner */}
        {mode === 'demo' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-purple-950/30 border border-purple-800/50 rounded-2xl text-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  DEMO MODE ACTIVE
                </div>
                <div className="text-xs text-purple-200/80">
                  Simulating realistic 0°–180° servo sweeps and obstacles. Toggle <span className="font-semibold text-white">LIVE</span> in the navbar when your ESP32 is ready.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMode('live')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Switch to Live ESP32
            </button>
          </div>
        )}

        {/* 4. SENSOR DATA CARDS (4 Cards Grid) */}
        <SensorCards
          distance={currentDetection.distance}
          angle={currentDetection.angle}
          detected={currentDetection.detected}
          connectionStatus={connectionStatus}
          mode={mode}
        />

        {/* 2 & 3. MAIN DASHBOARD: LIVE RADAR (Left/Main) & CURRENT DETECTION CARD (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left/Main Section: Live Radar (8 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col">
            <Radar
              currentAngle={currentDetection.angle}
              currentDistance={currentDetection.distance}
              isDetected={currentDetection.detected}
              angleMap={angleMap}
              maxRange={radarRange}
              onRangeChange={setRadarRange}
            />
          </div>

          {/* Right Section: Current Detection Card & Servo Control (4 cols on desktop) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <DetectionCard
              detected={currentDetection.detected}
              distance={currentDetection.distance}
              angle={currentDetection.angle}
              detectionThreshold={detectionThreshold}
            />

            {/* 5. SERVO CONTROL */}
            <ServoControl
              servoAngle={servoAngle}
              scanMode={scanMode}
              scanSpeed={scanSpeed}
              connectionStatus={connectionStatus}
              mode={mode}
              lastAck={lastAck}
              actions={actions}
            />
          </div>

        </div>

        {/* 8. AGGREGATE STATISTICS */}
        <StatisticsCards stats={stats} />

        {/* 7 & 6. CHARTS & TELEMETRY LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Distance vs Angle Real-Time Graph (7 cols on desktop) */}
          <div className="lg:col-span-7">
            <DistanceChart
              angleMap={angleMap}
              currentAngle={currentDetection.angle}
              detectionThreshold={detectionThreshold}
            />
          </div>

          {/* Live Sensor Data Table (5 cols on desktop) */}
          <div className="lg:col-span-5">
            <SensorTable
              history={history}
              onClearHistory={actions.clearHistory}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 mt-8 text-center text-xs text-slate-400 font-mono">
        <p>ObjectSense IoT Platform • ESP32 + HC-SR04 Ultrasonic Sensor + Servo System</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        wsUrl={wsUrl}
        onSaveWsUrl={(newUrl) => {
          actions.connectLive(newUrl);
        }}
        detectionThreshold={detectionThreshold}
        onSaveThreshold={setDetectionThreshold}
        soundAlerts={soundAlerts}
        onToggleSound={() => setSoundAlerts(!soundAlerts)}
      />

    </div>
  );
}

export default Dashboard;
