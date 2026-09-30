import { useState, useEffect, useRef, useCallback } from 'react';
import esp32Service, { ConnectionStatus } from '../services/esp32Service';
import { playDetectionBeep } from '../services/soundService';

const MAX_HISTORY = 50;

export function useESP32() {
  // Mode: 'live' or 'demo'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('objectsense_mode') || 'demo';
  });

  const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.DISCONNECTED);
  const [wsUrl, setWsUrl] = useState(() => esp32Service.getDefaultUrl());


  // Servo Control State
  const [servoAngle, setServoAngle] = useState(90);
  const [scanMode, setScanMode] = useState('AUTO'); // 'AUTO' | 'MANUAL' | 'STOP'
  const [scanSpeed, setScanSpeed] = useState(50); // ms per step (lower = faster)
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [detectionThreshold, setDetectionThreshold] = useState(50); // cm

  // Current Live Detection
  const [currentDetection, setCurrentDetection] = useState({
    angle: 90,
    distance: null,
    detected: false,
    timestamp: '--:--:--',
  });

  // Recent 50 readings history for table
  const [history, setHistory] = useState([]);

  // Angle Map for Radar and Angle-vs-Distance Chart (0 to 180 deg)
  const [angleMap, setAngleMap] = useState(() => {
    const initial = {};
    for (let i = 0; i <= 180; i += 2) {
      initial[i] = { distance: null, detected: false, timestamp: null };
    }
    return initial;
  });

  // Last Command Acknowledgment
  const [lastAck, setLastAck] = useState(null);

  // Aggregate Statistics
  const [stats, setStats] = useState({
    totalScans: 0,
    objectsDetected: 0,
    minDistance: null,
    avgDistance: null,
    sweepCount: 0,
  });

  // Refs for tracking values inside intervals without re-triggering
  const demoIntervalRef = useRef(null);
  const demoAngleRef = useRef(0);
  const demoDirectionRef = useRef(1); // 1 = forward (0->180), -1 = backward (180->0)
  const allReadingsRef = useRef([]);

  // Save mode preference
  const updateMode = useCallback((newMode) => {
    setMode(newMode);
    localStorage.setItem('objectsense_mode', newMode);
    if (newMode === 'demo') {
      esp32Service.disconnect();
      setConnectionStatus(ConnectionStatus.CONNECTED);
    } else {
      setConnectionStatus(esp32Service.status);
      esp32Service.connect(wsUrl);
    }
  }, [wsUrl]);

  // Record sensor data into state
  const recordReading = useCallback((reading) => {
    if (!reading) return;

    setCurrentDetection(reading);
    setServoAngle(reading.angle);

    // Audio beep on confirmed detection
    if (reading.detected && soundAlerts) {
      playDetectionBeep();
    }

    // Add to latest 50 history
    setHistory((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        time: reading.timestamp || new Date().toLocaleTimeString(),
        angle: reading.angle,
        distance: reading.distance,
        status: reading.detected ? 'Object' : 'Clear',
        detected: reading.detected,
      };
      const updated = [entry, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });

    // Update angle mapping
    setAngleMap((prev) => ({
      ...prev,
      [reading.angle]: {
        distance: reading.distance,
        detected: reading.detected,
        timestamp: Date.now(),
      },
    }));

    // Update stats
    allReadingsRef.current.push(reading);
    const readings = allReadingsRef.current;

    const validDistances = readings.map((r) => r.distance).filter((d) => typeof d === 'number' && d > 0);
    const minD = validDistances.length > 0 ? Math.min(...validDistances) : null;
    const avgD = validDistances.length > 0
      ? Math.round(validDistances.reduce((a, b) => a + b, 0) / validDistances.length)
      : null;
    const detectedCount = readings.filter((r) => r.detected).length;

    setStats((prev) => ({
      ...prev,
      totalScans: readings.length,
      objectsDetected: detectedCount,
      minDistance: minD,
      avgDistance: avgD,
    }));
  }, [soundAlerts]);

  // LIVE MODE: Setup WebSocket listeners
  useEffect(() => {
    if (mode !== 'live') return;

    // Connect to WebSocket
    esp32Service.connect(wsUrl);

    const unsubStatus = esp32Service.on('status', (info) => {
      setConnectionStatus(info.status);
    });

    const unsubData = esp32Service.on('sensorData', (data) => {
      recordReading(data);
    });

    const unsubAck = esp32Service.on('ack', (ack) => {
      setLastAck({ ...ack, time: Date.now() });
    });

    return () => {
      unsubStatus();
      unsubData();
      unsubAck();
    };
  }, [mode, wsUrl, recordReading]);

  // DEMO MODE: Realistic simulation loop
  useEffect(() => {
    if (mode !== 'demo') {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      return;
    }

    if (scanMode === 'STOP') {
      return;
    }

    const intervalTime = Math.max(25, scanSpeed);

    demoIntervalRef.current = setInterval(() => {
      let currentAngle = demoAngleRef.current;
      let dir = demoDirectionRef.current;

      if (scanMode === 'AUTO') {
        currentAngle += dir * 2;
        if (currentAngle >= 180) {
          currentAngle = 180;
          demoDirectionRef.current = -1;
          setStats((s) => ({ ...s, sweepCount: s.sweepCount + 1 }));
        } else if (currentAngle <= 0) {
          currentAngle = 0;
          demoDirectionRef.current = 1;
          setStats((s) => ({ ...s, sweepCount: s.sweepCount + 1 }));
        }
        demoAngleRef.current = currentAngle;
      } else {
        // Manual mode stays at current servo angle
        currentAngle = servoAngle;
      }

      // Realistic environmental simulation:
      // Obstacle 1: angle ~45° to 62° at ~34cm
      // Obstacle 2: angle ~122° to 138° at ~23cm
      // Background clear reading: 75cm to 130cm with slight variation
      let distance;
      let detected = false;
      const noise = (Math.random() - 0.5) * 1.5;

      if (currentAngle >= 44 && currentAngle <= 62) {
        // Bell curve profile for object shape
        const distOffset = Math.abs(currentAngle - 53) * 1.2;
        distance = Math.round((33 + distOffset + noise) * 10) / 10;
        detected = true;
      } else if (currentAngle >= 120 && currentAngle <= 138) {
        const distOffset = Math.abs(currentAngle - 129) * 0.9;
        distance = Math.round((22 + distOffset + noise) * 10) / 10;
        detected = true;
      } else {
        // Clear wall distance
        distance = Math.round((85 + Math.sin(currentAngle * (Math.PI / 180)) * 25 + noise * 2) * 10) / 10;
        detected = distance < detectionThreshold;
      }

      const reading = {
        angle: currentAngle,
        distance,
        detected,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rawTimestamp: Date.now(),
      };

      recordReading(reading);
    }, intervalTime);

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    };
  }, [mode, scanMode, scanSpeed, servoAngle, detectionThreshold, recordReading]);

  // Controls API
  const handleSetAngle = useCallback((angle) => {
    const valid = Math.max(0, Math.min(180, Math.round(angle)));
    setServoAngle(valid);
    demoAngleRef.current = valid;

    if (mode === 'live') {
      const ok = esp32Service.setAngle(valid);
      setLastAck({
        command: `set_angle (${valid}°)`,
        success: ok,
        time: Date.now(),
        mode: 'live',
      });
    } else {
      setLastAck({
        command: `set_angle (${valid}°)`,
        success: true,
        time: Date.now(),
        mode: 'demo',
      });
    }
  }, [mode]);

  const handleStartScan = useCallback(() => {
    setScanMode('AUTO');
    if (mode === 'live') {
      const ok = esp32Service.startScan();
      setLastAck({
        command: 'start_scan',
        success: ok,
        time: Date.now(),
        mode: 'live',
      });
    } else {
      setLastAck({
        command: 'start_scan',
        success: true,
        time: Date.now(),
        mode: 'demo',
      });
    }
  }, [mode]);

  const handleStopScan = useCallback(() => {
    setScanMode('STOP');
    if (mode === 'live') {
      const ok = esp32Service.stopScan();
      setLastAck({
        command: 'stop_scan',
        success: ok,
        time: Date.now(),
        mode: 'live',
      });
    } else {
      setLastAck({
        command: 'stop_scan',
        success: true,
        time: Date.now(),
        mode: 'demo',
      });
    }
  }, [mode]);

  const handleSetSpeed = useCallback((speed) => {
    setScanSpeed(speed);
    if (mode === 'live') {
      const ok = esp32Service.setSpeed(speed);
      setLastAck({
        command: `set_speed (${speed}ms)`,
        success: ok,
        time: Date.now(),
        mode: 'live',
      });
    } else {
      setLastAck({
        command: `set_speed (${speed}ms)`,
        success: true,
        time: Date.now(),
        mode: 'demo',
      });
    }
  }, [mode]);

  const handleConnectLive = useCallback((newUrl) => {
    if (newUrl) {
      setWsUrl(newUrl);
      esp32Service.saveCustomUrl(newUrl);
    }
    esp32Service.connect(newUrl || wsUrl);
  }, [wsUrl]);

  const handleDisconnectLive = useCallback(() => {
    esp32Service.disconnect();
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    allReadingsRef.current = [];
    setStats({
      totalScans: 0,
      objectsDetected: 0,
      minDistance: null,
      avgDistance: null,
      sweepCount: 0,
    });
    setAngleMap(() => {
      const initial = {};
      for (let i = 0; i <= 180; i += 2) {
        initial[i] = { distance: null, detected: false, timestamp: null };
      }
      return initial;
    });
  }, []);

  const effectiveConnectionStatus =
    mode === 'demo' ? ConnectionStatus.CONNECTED : connectionStatus;

  return {
    mode,
    setMode: updateMode,
    connectionStatus: effectiveConnectionStatus,
    wsUrl,
    setWsUrl,
    currentDetection,
    history,
    angleMap,
    stats,
    servoAngle,
    scanMode,
    setScanMode,
    scanSpeed,
    soundAlerts,
    setSoundAlerts,
    detectionThreshold,
    setDetectionThreshold,
    lastAck,
    actions: {
      setAngle: handleSetAngle,
      startScan: handleStartScan,
      stopScan: handleStopScan,
      setSpeed: handleSetSpeed,
      connectLive: handleConnectLive,
      disconnectLive: handleDisconnectLive,
      clearHistory,
    },
  };
}

export default useESP32;
