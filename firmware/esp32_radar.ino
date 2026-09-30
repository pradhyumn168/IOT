/*
 * ==============================================================================
 * ObjectSense - ESP32 Ultrasonic Radar & Object Detection Firmware
 * ==============================================================================
 * Hardware:
 *   - ESP32 Development Board (NodeMCU / ESP32-WROOM-32)
 *   - HC-SR04 Ultrasonic Distance Sensor
 *   - SG90 or MG995/MG996R Servo Motor
 *   - External 5V Power Supply recommended for Servo motor
 *
 * Pin Mapping:
 *   - TRIG_PIN    -> GPIO 5  (Output to HC-SR04 Trigger)
 *   - ECHO_PIN    -> GPIO 18 (Input from HC-SR04 Echo via voltage divider / direct)
 *   - SERVO_PIN   -> GPIO 19 (PWM to Servo Signal)
 *
 * Libraries Required (install via Arduino IDE Library Manager):
 *   - WebSockets by Markus Sattler (v2.4.0+)
 *   - ArduinoJson by Benoit Blanchon (v6.x or v7.x)
 *   - ESP32Servo by Kevin Harrington (v1.1.0+)
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ---------------- Wi-Fi Configuration ----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------------- Hardware Pin Assignments -----------
#define TRIG_PIN  5
#define ECHO_PIN  18
#define SERVO_PIN 19

// ---------------- Ultrasonic & Servo Parameters ------
#define MIN_ANGLE 0
#define MAX_ANGLE 180
#define DETECTION_THRESHOLD_CM 50 // Threshold for marking detected = true

Servo radarServo;
WebSocketsServer webSocket = WebSocketsServer(80); // WebSocket on Port 80 (or 81)

// Scanning State Machine
bool isScanning = true;
int currentAngle = 0;
int sweepStep = 2; // Step in degrees
int sweepDirection = 1; // 1 = 0 -> 180, -1 = 180 -> 0
unsigned long scanInterval = 50; // Delay in milliseconds between steps
unsigned long lastScanTime = 0;

// Read distance from HC-SR04 in centimeters
float readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse width (timeout after ~30ms = approx 5 meters)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) {
    return 400.0; // Out of range or no echo
  }

  // Speed of sound = 343 m/s = 0.0343 cm/us
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

// Send sensor measurement telemetry to connected web clients
void broadcastTelemetry(int angle, float distance, bool detected) {
  StaticJsonDocument<200> doc;
  doc["angle"] = angle;
  doc["distance"] = round(distance * 10.0) / 10.0;
  doc["detected"] = detected;
  doc["timestamp"] = millis() / 1000; // or epoch time if NTP configured

  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
}

// Send command acknowledgment to client
void sendAck(uint8_t num, const char* command, bool success, const char* message = "") {
  StaticJsonDocument<200> doc;
  doc["type"] = "ack";
  doc["command"] = command;
  doc["success"] = success;
  if (strlen(message) > 0) {
    doc["message"] = message;
  }

  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(num, output);
}

// WebSocket Event Handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WebSocket] Client #%u disconnected\n", num);
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WebSocket] Client #%u connected from %s\n", num, ip.toString().c_str());
      sendAck(num, "connect", true, "ESP32 ObjectSense Connected");
      break;
    }

    case WStype_TEXT: {
      Serial.printf("[WebSocket] Received text from #%u: %s\n", num, payload);
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, payload, length);

      if (error) {
        Serial.printf("[WebSocket] JSON Deserialization failed: %s\n", error.c_str());
        return;
      }

      // Handle Ping / Heartbeat
      if (doc.containsKey("type") && strcmp(doc["type"], "ping") == 0) {
        StaticJsonDocument<64> pong;
        pong["type"] = "pong";
        pong["t"] = doc["t"];
        String pongStr;
        serializeJson(pong, pongStr);
        webSocket.sendTXT(num, pongStr);
        return;
      }

      // Handle Inbound Control Commands
      if (doc.containsKey("command")) {
        const char* cmd = doc["command"];

        if (strcmp(cmd, "start_scan") == 0) {
          isScanning = true;
          sendAck(num, "start_scan", true);
        } else if (strcmp(cmd, "stop_scan") == 0) {
          isScanning = false;
          sendAck(num, "stop_scan", true);
        } else if (strcmp(cmd, "set_angle") == 0) {
          int targetAngle = doc["angle"];
          targetAngle = constrain(targetAngle, MIN_ANGLE, MAX_ANGLE);
          currentAngle = targetAngle;
          radarServo.write(currentAngle);
          isScanning = false; // pause auto scan when manual angle is set
          sendAck(num, "set_angle", true);

          // Take immediate reading at this target angle
          float dist = readDistanceCM();
          bool detected = (dist > 0 && dist <= DETECTION_THRESHOLD_CM);
          broadcastTelemetry(currentAngle, dist, detected);
        } else if (strcmp(cmd, "set_speed") == 0) {
          int speed = doc["speed"]; // delay in ms
          scanInterval = constrain(speed, 10, 200);
          sendAck(num, "set_speed", true);
        } else {
          sendAck(num, cmd, false, "Unknown command");
        }
      }
      break;
    }

    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Initializing ObjectSense ESP32 Radar ---");

  // Ultrasonic Pin Modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // Servo Configuration
  ESP32PWM::allocateTimer(0);
  radarServo.setPeriodHertz(50); // Standard 50Hz servo
  radarServo.attach(SERVO_PIN, 500, 2400); // Standard pulse width for SG90
  radarServo.write(currentAngle);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.printf("Frontend WebSocket URL: ws://%s/ws\n", WiFi.localIP().toString().c_str());

  // Start WebSocket Server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server initialized on port 80");
}

void loop() {
  // Service incoming WebSocket traffic
  webSocket.loop();

  // Handle Scanning Loop
  unsigned long now = millis();
  if (isScanning && (now - lastScanTime >= scanInterval)) {
    lastScanTime = now;

    // Move Servo
    radarServo.write(currentAngle);

    // Measure Distance
    float distance = readDistanceCM();
    bool detected = (distance > 0 && distance <= DETECTION_THRESHOLD_CM);

    // Broadcast reading to all web dashboard clients
    broadcastTelemetry(currentAngle, distance, detected);

    // Advance angle
    currentAngle += (sweepStep * sweepDirection);
    if (currentAngle >= MAX_ANGLE) {
      currentAngle = MAX_ANGLE;
      sweepDirection = -1;
    } else if (currentAngle <= MIN_ANGLE) {
      currentAngle = MIN_ANGLE;
      sweepDirection = 1;
    }
  }
}
