# ObjectSense - ESP32 Ultrasonic Object Detection Dashboard

A modern, responsive, dark-themed engineering dashboard for an IoT ultrasonic radar scanner built with an **ESP32**, an **HC-SR04 ultrasonic sensor**, and a **servo motor**.

The servo sweeps the HC-SR04 across an angle range of **0° to 180°**, measuring distance at each angle and streaming live telemetry over WebSockets to this web interface.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure ESP32 IP
Copy the example environment file or edit `.env`:
```bash
cp .env.example .env
```
Set your ESP32's WebSocket URL:
```env
VITE_ESP32_WS_URL=ws://192.168.1.100/ws
```
*(You can also configure or change this URL dynamically in the web UI using the top-right Settings modal without rebuilding!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🎯 Features

- **Live Semicircular Canvas Radar**:
  - Full 0° to 180° sweep visualization matching protractor geometry (0° left, 90° center/top, 180° right).
  - Concentric distance rings (10cm, 20cm, 30cm, 40cm, 50cm, etc.) with customizable range zoom.
  - Animated sweeping laser line with phosphor gradient trail effect.
  - Glowing red target markers with reticle locks on detected obstacles.
  - Persistent point-cloud representation with gradual age fading.
- **Current Detection Status Card**:
  - `OBJECT STATUS` display with high-visibility badges (`🎯 OBJECT DETECTED` vs `NO OBJECT DETECTED`).
  - Distance (`cm`), Angle (`°`), and Confirmation Status (`CONFIRMED` / `CLEAR`).
- **Telemetry Cards**:
  - Real-time Distance meter.
  - Real-time Servo Angle gauge.
  - Detection Status indicator.
  - ESP32 Connection status badge.
- **Servo Motor Controls**:
  - Angle slider with numeric readout and preset angle buttons (`0°`, `45°`, `90°`, `135°`, `180°`).
  - Direction step buttons (`[ ◀ 5° ]` and `[ 5° ▶ ]`).
  - Mode buttons: `AUTO`, `MANUAL`, `STOP`.
  - Scanning speed controller (Fast: 25ms, Normal: 50ms, Slow: 100ms).
  - Command acknowledgment telemetry feedback.
- **Real-Time Distance vs. Angle Contour Chart**:
  - Built with Recharts.
  - Shows environmental distance profile across the 0°–180° arc.
  - Reference lines for detection threshold and current servo beam angle.
- **Live 50-Reading Log Table**:
  - Records Time, Angle, Distance, and Status.
  - Filter by All / Object / Clear.
  - One-click CSV export and log clearing.
- **Aggregate Statistics**:
  - Total Scans, Objects Detected (% rate), Minimum Distance, and Average Distance.
- **Audio Feedback**:
  - Synthetic Web Audio radar ping on confirmed target detection (can be muted via Settings).
- **Separated Demo Mode**:
  - Toggle between `LIVE` and `DEMO` in the navbar.
  - In Demo Mode: realistic simulation sweeps 0° → 180° → 0° with obstacle profiles and noise.

---

## 📡 ESP32 Communication Protocol

### WebSocket Endpoint
The frontend connects via WebSocket to:
```
ws://<ESP32_IP_ADDRESS>/ws
```

### Telemetry Packet (ESP32 ➔ Web Dashboard)
```json
{
  "angle": 75,
  "distance": 42.0,
  "detected": true,
  "timestamp": 1727689262
}
```

| Field | Type | Description |
|-------|------|-------------|
| `angle` | number (0-180) | Current servo motor angle in degrees |
| `distance` | number (>= 0) | Measured distance in centimeters |
| `detected` | boolean | `true` if an object is within the detection threshold |
| `timestamp` | number / string | Unix timestamp (seconds or ms) or formatted time |

### Command Packets (Web Dashboard ➔ ESP32)

1. **Start Automatic Scanning**:
   ```json
   {
     "command": "start_scan"
   }
   ```
2. **Stop / Pause Scanning**:
   ```json
   {
     "command": "stop_scan"
   }
   ```
3. **Set Specific Servo Angle**:
   ```json
   {
     "command": "set_angle",
     "angle": 90
   }
   ```
4. **Set Sweep Speed (Delay in ms per step)**:
   ```json
   {
     "command": "set_speed",
     "speed": 50
   }
   ```

### Optional Acknowledgment (ESP32 ➔ Web Dashboard)
```json
{
  "type": "ack",
  "command": "start_scan",
  "success": true
}
```

---

## 🛠️ ESP32 Firmware

A complete, ready-to-flash Arduino firmware sketch is available in [`firmware/esp32_radar.ino`](file:///c:/Users/PC/Desktop/IoT/firmware/esp32_radar.ino).
See [`firmware/README.md`](file:///c:/Users/PC/Desktop/IoT/firmware/README.md) for pinout diagrams and library installation details.

---

## 📁 Project Structure

```
IoT/
├── firmware/
│   ├── esp32_radar.ino           # Complete Arduino C++ sketch for ESP32
│   └── README.md                 # Hardware wiring & firmware documentation
├── public/
│   └── favicon.svg               # Vector radar icon
├── src/
│   ├── components/
│   │   ├── ConnectionStatus.jsx  # Status badge component
│   │   ├── DetectionCard.jsx     # Current detection status card
│   │   ├── DistanceChart.jsx     # Recharts 0°-180° distance vs angle chart
│   │   ├── Navbar.jsx            # Header with logo, clock, mode toggle & status
│   │   ├── Radar.jsx             # Semicircular Canvas radar with sweep line
│   │   ├── SensorCard.jsx        # 4 Sensor telemetry cards
│   │   ├── SensorTable.jsx       # 50-row live telemetry log with CSV export
│   │   ├── ServoControl.jsx      # Interactive servo control card
│   │   ├── SettingsModal.jsx     # Dynamic IP config, threshold & audio modal
│   │   └── StatisticsCards.jsx   # Aggregate session statistics
│   ├── hooks/
│   │   └── useESP32.js           # Custom hook for live/demo state & simulation
│   ├── pages/
│   │   └── Dashboard.jsx         # Responsive dashboard page layout
│   ├── services/
│   │   ├── esp32Service.js       # WebSocket client with backoff & validation
│   │   └── soundService.js       # Web Audio API radar ping synthesizer
│   ├── App.jsx                   # Main React entry component
│   ├── index.css                 # Tailwind CSS & scrollbar styling
│   └── main.jsx                  # React DOM root render
├── .env                          # Local environment variables
├── .env.example                  # Template environment variables
├── index.html                    # HTML shell with Google Fonts
├── package.json                  # Dependencies & scripts
└── vite.config.js                # Vite configuration with Tailwind CSS plugin
```
