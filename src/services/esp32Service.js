/**
 * ESP32 WebSocket Service
 * Handles live WebSocket connection, reconnection logic, message parsing,
 * validation, and command transmission.
 */

// Connection Status States
export const ConnectionStatus = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
};

class ESP32Service {
  constructor() {
    this.ws = null;
    this.url = '';
    this.status = ConnectionStatus.DISCONNECTED;
    this.listeners = {
      status: new Set(),
      sensorData: new Set(),
      ack: new Set(),
      error: new Set(),
    };
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 2000;
    this.manualDisconnect = false;
    this.lastPingTime = 0;
    this.latency = null;
    this.pingInterval = null;
  }

  /**
   * Resolves the default WebSocket URL
   */
  getDefaultUrl() {
    const saved = localStorage.getItem('esp32_ws_url');
    if (saved) return saved;
    return import.meta.env.VITE_ESP32_WS_URL || 'ws://192.168.1.100/ws';
  }

  /**
   * Save custom WebSocket URL in localStorage
   */
  saveCustomUrl(url) {
    if (url) {
      localStorage.setItem('esp32_ws_url', url.trim());
    }
  }

  /**
   * Connect to ESP32 WebSocket server
   */
  connect(customUrl = null) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[ESP32Service] Already connected or connecting.');
      return;
    }

    this.manualDisconnect = false;
    this.clearReconnectTimer();

    this.url = (customUrl || this.getDefaultUrl()).trim();
    if (!this.url.startsWith('ws://') && !this.url.startsWith('wss://')) {
      this.url = `ws://${this.url}`;
    }

    this.setStatus(
      this.reconnectAttempts > 0 ? ConnectionStatus.RECONNECTING : ConnectionStatus.CONNECTING
    );

    try {
      console.log(`[ESP32Service] Connecting to ${this.url}...`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log(`[ESP32Service] Connected successfully to ${this.url}`);
        this.reconnectAttempts = 0;
        this.setStatus(ConnectionStatus.CONNECTED);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.warn('[ESP32Service] WebSocket error:', err);
        this.emit('error', err);
      };

      this.ws.onclose = (event) => {
        console.log(`[ESP32Service] Connection closed (code: ${event.code})`);
        this.stopHeartbeat();
        this.ws = null;

        if (!this.manualDisconnect) {
          this.scheduleReconnect();
        } else {
          this.setStatus(ConnectionStatus.DISCONNECTED);
        }
      };
    } catch (error) {
      console.error('[ESP32Service] Failed to initialize WebSocket:', error);
      this.setStatus(ConnectionStatus.ERROR);
      if (!this.manualDisconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Disconnect from ESP32
   */
  disconnect() {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {
        console.warn('[ESP32Service] Error closing socket:', err);
      }
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Schedule exponential backoff reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[ESP32Service] Max reconnection attempts reached.');
      this.setStatus(ConnectionStatus.DISCONNECTED);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 15000);
    console.log(`[ESP32Service] Scheduling reconnect #${this.reconnectAttempts} in ${delay}ms`);

    this.setStatus(ConnectionStatus.RECONNECTING);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.url);
    }, delay);
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Parse and validate incoming WebSocket message
   */
  handleMessage(rawPayload) {
    if (!rawPayload || typeof rawPayload !== 'string') return;

    try {
      const data = JSON.parse(rawPayload);

      // Handle Pong / Latency measurement
      if (data.type === 'pong') {
        if (this.lastPingTime) {
          this.latency = Date.now() - this.lastPingTime;
        }
        return;
      }

      // Handle Acknowledgement packets
      if (data.type === 'ack') {
        this.emit('ack', {
          command: data.command,
          success: Boolean(data.success),
          message: data.message || '',
        });
        return;
      }

      // Validate standard sensor data packet
      const validatedData = this.validateSensorData(data);
      if (validatedData) {
        this.emit('sensorData', validatedData);
      } else {
        console.warn('[ESP32Service] Ignored malformed sensor packet:', data);
      }
    } catch (err) {
      console.warn('[ESP32Service] Failed to parse JSON message:', rawPayload, err);
    }
  }

  /**
   * Validates incoming sensor data strictly
   */
  validateSensorData(data) {
    if (!data || typeof data !== 'object') return null;

    // Angle must be a number between 0 and 180
    const rawAngle = Number(data.angle);
    if (isNaN(rawAngle) || rawAngle < 0 || rawAngle > 180) {
      return null;
    }

    // Distance must be a non-negative number (in cm)
    const rawDistance = Number(data.distance);
    if (isNaN(rawDistance) || rawDistance < 0) {
      return null;
    }

    // Detected flag
    const detected = Boolean(data.detected);

    // Timestamp
    let timestamp = data.timestamp;
    if (!timestamp) {
      timestamp = Date.now();
    } else if (typeof timestamp === 'number' && timestamp < 10000000000) {
      // Convert Unix seconds to milliseconds
      timestamp = timestamp * 1000;
    }

    return {
      angle: Math.round(rawAngle),
      distance: Number(rawDistance.toFixed(1)),
      detected,
      timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawTimestamp: timestamp,
    };
  }

  /**
   * Send JSON command to ESP32
   * @param {Object} commandObj e.g. { command: 'start_scan' }
   */
  sendCommand(commandObj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[ESP32Service] Cannot send command: WebSocket is not connected.', commandObj);
      return false;
    }

    try {
      const payload = JSON.stringify(commandObj);
      this.ws.send(payload);
      console.log('[ESP32Service] Sent command:', payload);
      return true;
    } catch (err) {
      console.error('[ESP32Service] Error sending command:', err);
      return false;
    }
  }

  /**
   * Start Scan Command
   */
  startScan() {
    return this.sendCommand({ command: 'start_scan' });
  }

  /**
   * Stop Scan Command
   */
  stopScan() {
    return this.sendCommand({ command: 'stop_scan' });
  }

  /**
   * Set Specific Angle
   */
  setAngle(angle) {
    const validAngle = Math.max(0, Math.min(180, Math.round(angle)));
    return this.sendCommand({ command: 'set_angle', angle: validAngle });
  }

  /**
   * Set Scanning Speed
   * @param {number} speed Speed or delay in ms (e.g. 10 - 100)
   */
  setSpeed(speed) {
    const validSpeed = Math.max(5, Math.min(200, Math.round(speed)));
    return this.sendCommand({ command: 'set_speed', speed: validSpeed });
  }

  /**
   * Periodic ping/pong for link liveness and latency
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        try {
          this.ws.send(JSON.stringify({ type: 'ping', t: this.lastPingTime }));
        } catch {
          // ignore
        }
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Subscriptions
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => {
      if (this.listeners[event]) {
        this.listeners[event].delete(callback);
      }
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[ESP32Service] Error in ${event} listener:`, e);
        }
      });
    }
  }

  setStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('status', {
        status: newStatus,
        url: this.url,
        reconnectAttempts: this.reconnectAttempts,
      });
    }
  }
}

// Singleton instance
export const esp32Service = new ESP32Service();

// Standalone exported helper functions per spec
export function connectESP32(url = null) {
  esp32Service.connect(url);
}

export function disconnectESP32() {
  esp32Service.disconnect();
}

export function sendCommand(command) {
  return esp32Service.sendCommand(command);
}

export function handleSensorData(data) {
  return esp32Service.validateSensorData(data);
}

export default esp32Service;
