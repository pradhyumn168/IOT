# ObjectSense ESP32 Firmware Guide

This directory contains the production-ready ESP32 Arduino sketch for the HC-SR04 ultrasonic sensor and SG90 servo motor radar scanner.

## 🔌 Hardware Wiring

| Component | Pin | ESP32 GPIO | Description |
|-----------|-----|------------|-------------|
| **HC-SR04** | VCC | 5V (VIN) | Sensor Power (5V) |
| | GND | GND | Ground |
| | TRIG | GPIO 5 | Ultrasonic Trigger Pulse |
| | ECHO | GPIO 18 | Ultrasonic Return Pulse *(Use 1kΩ + 2kΩ divider if 3.3V strict)* |
| **SG90 Servo** | VCC | 5V (VIN/Ext) | Motor Power *(Separate 5V rail recommended)* |
| | GND | GND | Common Ground |
| | PWM (Orange/Yellow) | GPIO 19 | Servo Control Pulse |

> **Power Tip**: When the servo moves, it can draw current spikes exceeding 500mA. Power the servo from an external 5V 1A/2A source or a powered USB hub to prevent ESP32 brownout resets, and make sure to connect all Grounds (GND) together.

---

## 📦 Required Arduino Libraries

Install these from the Arduino IDE Library Manager (**Tools > Manage Libraries...**):

1. **WebSockets** by *Markus Sattler*
2. **ArduinoJson** by *Benoit Blanchon* (v6 or v7)
3. **ESP32Servo** by *Kevin Harrington*

---

## 🚀 Setup Steps

1. Open `firmware/esp32_radar.ino` in Arduino IDE.
2. Update your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Select board **ESP32 Dev Module** and correct COM port.
4. Upload the sketch.
5. Open Serial Monitor at **115200 baud**.
6. Copy the assigned IP address shown in the Serial Monitor (e.g. `192.168.1.120`).
7. In the web dashboard:
   - Click the **Settings icon** (top right) or update `.env`.
   - Enter `ws://192.168.1.120/ws` (or port if modified).
   - Switch the toggle from **DEMO** to **LIVE**.
