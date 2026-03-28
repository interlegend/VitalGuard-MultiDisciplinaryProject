// ============================================================
// VitalGuard - Firebase RTDB (ESP32 + MPU-6500 + MAX30102)
// BULLETPROOF DEBUG VERSION - v2 FAST MODE
// ============================================================

#include <Wire.h>
#include <WiFi.h>
#include <MAX30105.h>
#include <Firebase_ESP_Client.h>
#include <math.h>

// ======================= FILL THESE =========================
#define WIFI_SSID       "ZTE_2.4G_zx4RcW"
#define WIFI_PASSWORD   "LDJtc3yd"
#define API_KEY         "AIzaSyAJaYE0clRn_ntgDe_6hhrPJQyp_9ydAW0"
#define DATABASE_URL    "https://vitalguard-77-default-rtdb.asia-southeast1.firebasedatabase.app/"
// ============================================================

// ─── THRESHOLDS ─────────────────────────────────────────────
#define BPM_THRESHOLD       80.0f
#define JERK_THRESHOLD      15000.0f
#define IR_FINGER_THRESHOLD 30000L
#define MIN_BEAT_SAMPLES    2        // ✅ CHANGED: was 4, now 2 (fits 2s window)

// ─── TIMING ─────────────────────────────────────────────────
#define WINDOW_MS        2000UL      // ✅ CHANGED: was 5000, now 2000 (faster!)
#define MPU_INTERVAL_MS  20

// ─── PEAK DETECTOR ──────────────────────────────────────────
#define PEAK_MIN_RISE      300L
#define BEAT_COOLDOWN_MS   400
#define BASELINE_ALPHA     0.93f

// ─── MPU REGISTERS ──────────────────────────────────────────
#define MPU_ADDR         0x68
#define REG_WHOAMI       0x75
#define REG_PWR_MGMT_1   0x6B
#define REG_CONFIG       0x1A
#define REG_ACCEL_CFG    0x1C
#define REG_GYRO_CFG     0x1B
#define REG_ACCEL_XOUTH  0x3B
#define ACCEL_SCALE      16384.0f
#define GYRO_SCALE       131.0f

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool firebaseReady = false;

// MAX30102
MAX30105 particleSensor;

// Device/path
String deviceId;
String basePath;

// Calibration
float accelOffset[3] = {0,0,0};
float gyroOffset[3]  = {0,0,0};

// Peak detector state
float irBaseline = 0.0f;
long  irValleyVal = 0;
long  prevIR = 0;
bool  irRising = false;

// Heart rate (per-window)
byte          rateBuffer[4] = {0,0,0,0};
byte          rateIdx = 0;
unsigned long lastBeatTime = 0;
bool          lastBeatValid = false;
float         bpmWindowSum = 0.0f;
int           bpmWindowCount = 0;

// Motion
float prevAxmg = 0.0f, prevAymg = 0.0f, prevAzmg = 0.0f;
bool  firstMpuSample = true;
bool  jerkInWindow = false;
float maxJerkInWindow = 0.0f;

// Window accumulators
float sumAx=0,sumAy=0,sumAz=0;
float sumGx=0,sumGy=0,sumGz=0;
long  mpuSampleCount = 0;
unsigned long sumIR = 0;
int   irSampleCount = 0;

unsigned long lastMpuTime = 0;
unsigned long windowStart = 0;

// ============================================================
// MPU RAW I2C 
// ============================================================
void mpuWriteReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg); Wire.write(val);
  Wire.endTransmission();
}

uint8_t mpuReadReg(uint8_t reg) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)1);
  return Wire.available() ? Wire.read() : 0xFF;
}

void mpuReadBurst(uint8_t startReg, uint8_t* buf, uint8_t len) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(startReg);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU_ADDR, len);
  for (uint8_t i = 0; i < len; i++) buf[i] = Wire.available() ? Wire.read() : 0;
}

void mpuRead(float &ax, float &ay, float &az,
             float &gx, float &gy, float &gz) {
  uint8_t buf[14];
  mpuReadBurst(REG_ACCEL_XOUTH, buf, 14);
  int16_t rawAx = (int16_t)(buf[0]<<8|buf[1]);
  int16_t rawAy = (int16_t)(buf[2]<<8|buf[3]);
  int16_t rawAz = (int16_t)(buf[4]<<8|buf[5]);
  int16_t rawGx = (int16_t)(buf[8]<<8|buf[9]);
  int16_t rawGy = (int16_t)(buf[10]<<8|buf[11]);
  int16_t rawGz = (int16_t)(buf[12]<<8|buf[13]);
  ax = rawAx/ACCEL_SCALE - accelOffset[0];
  ay = rawAy/ACCEL_SCALE - accelOffset[1];
  az = rawAz/ACCEL_SCALE - accelOffset[2];
  gx = rawGx/GYRO_SCALE  - gyroOffset[0];
  gy = rawGy/GYRO_SCALE  - gyroOffset[1];
  gz = rawGz/GYRO_SCALE  - gyroOffset[2];
}

void mpuCalibrate(int samples = 300) {
  Serial.println("Calibrating MPU... keep STILL");
  for (int i=0;i<3;i++) accelOffset[i]=gyroOffset[i]=0;

  float sax=0,say=0,saz=0,sgx=0,sgy=0,sgz=0,ax,ay,az,gx,gy,gz;
  for (int i=0;i<samples;i++) {
    mpuRead(ax,ay,az,gx,gy,gz);
    sax+=ax; say+=ay; saz+=az;
    sgx+=gx; sgy+=gy; sgz+=gz;
    delay(5);
  }
  accelOffset[0]=sax/samples;
  accelOffset[1]=say/samples;
  accelOffset[2]=saz/samples-1.0f;
  gyroOffset[0]=sgx/samples;
  gyroOffset[1]=sgy/samples;
  gyroOffset[2]=sgz/samples;
  Serial.println("Calibration done");
}

void mpuInit() {
  uint8_t w = mpuReadReg(REG_WHOAMI);
  Serial.print("MPU WHOAMI = 0x");
  Serial.println(w, HEX);
  if (w!=0x68 && w!=0x70 && w!=0x72) {
    Serial.println("FATAL ERROR: MPU NOT FOUND! Check wiring.");
    while(true) delay(500);
  }
  mpuWriteReg(REG_PWR_MGMT_1, 0x80); delay(100);
  mpuWriteReg(REG_PWR_MGMT_1, 0x01); delay(50);
  mpuWriteReg(REG_CONFIG,     0x03);
  mpuWriteReg(REG_ACCEL_CFG,  0x00);
  mpuWriteReg(REG_GYRO_CFG,   0x00);
  delay(10);
}

// ============================================================
// PEAK DETECTOR 
// ============================================================
bool detectBeat(long irValue) {
  if (irBaseline == 0.0f) {
    irBaseline = (float)irValue;
    irValleyVal = irValue; prevIR = irValue;
    return false;
  }
  irBaseline = BASELINE_ALPHA*irBaseline + (1.0f-BASELINE_ALPHA)*(float)irValue;

  bool currentlyRising = irValue > prevIR;
  prevIR = irValue;

  if (!currentlyRising) {
    if (irValue < irValleyVal) irValleyVal = irValue;
  }

  bool beatDetected = false;
  if (currentlyRising && !irRising) {
    long rise = irValue - irValleyVal;
    if (rise >= PEAK_MIN_RISE) {
      beatDetected = true;
      irValleyVal = (long)irBaseline;  // ✅ Reset to baseline, not peak!
    }
  }

  irRising = currentlyRising;
  return beatDetected;
}

void resetPeakDetector() {
  irBaseline=0.0f; irValleyVal=0; prevIR=0; irRising=false;
}

float median3(float a, float b, float c) {
  if ((a<=b && b<=c) || (c<=b && b<=a)) return b;
  if ((b<=a && a<=c) || (c<=a && a<=b)) return a;
  return c;
}

void resetWindow(unsigned long now) {
  bpmWindowSum=0; bpmWindowCount=0;
  rateBuffer[0]=rateBuffer[1]=rateBuffer[2]=rateBuffer[3]=0;
  rateIdx=0; lastBeatValid=false;

  jerkInWindow=false; maxJerkInWindow=0.0f;

  sumAx=sumAy=sumAz=0;
  sumGx=sumGy=sumGz=0;
  mpuSampleCount=0;

  sumIR=0; irSampleCount=0;
  windowStart=now;
}

// ============================================================
// FIREBASE: one atomic update per window
// ============================================================
void pushWindowToFirebase(unsigned long now,
                          float avgBpm, bool bpmValid,
                          float avgIR, bool fingerDetected,
                          bool jerkDetected, float maxJerk,
                          float avgAx, float avgAy, float avgAz,
                          float avgGx, float avgGy, float avgGz) {
  if (!firebaseReady) {
    Serial.println("Warning: Firebase not ready, skipping push.");
    return;
  }
  if (!Firebase.ready()) {
    Serial.println("Warning: Firebase object not ready, skipping push.");
    return;
  }

  bool hrAlert = bpmValid && (avgBpm > BPM_THRESHOLD);
  bool motionAlert = jerkDetected;

  String alertLevel = "OK";
  if (hrAlert && motionAlert) alertLevel = "CRITICAL";
  else if (hrAlert)           alertLevel = "HR_ALERT";
  else if (motionAlert)       alertLevel = "MOTION_ALERT";

  Serial.println("=> PUSHING DATA TO FIREBASE...");
  Serial.print("   Alert Level: "); Serial.println(alertLevel);
  Serial.print("   BPM: "); Serial.println(avgBpm);
  Serial.print("   Max Jerk: "); Serial.println(maxJerk);

  FirebaseJson json;
  json.set("system/alert_level", alertLevel);
  json.set("system/last_updated_ms", (uint32_t)now);
  json.set("system/window_ms", (uint32_t)WINDOW_MS);

  json.set("heart_rate/finger_detected", fingerDetected);
  json.set("heart_rate/avg_ir", avgIR);
  json.set("heart_rate/bpm_valid", bpmValid);
  json.set("heart_rate/bpm", bpmValid ? avgBpm : 0.0f);
  json.set("heart_rate/beat_samples", bpmWindowCount);
  json.set("heart_rate/hr_alert", hrAlert);

  json.set("motion/jerk_detected", jerkDetected);
  json.set("motion/max_jerk", maxJerk);
  json.set("motion/motion_alert", motionAlert);

  json.set("mpu/avg_ax_g", avgAx);
  json.set("mpu/avg_ay_g", avgAy);
  json.set("mpu/avg_az_g", avgAz);
  json.set("mpu/avg_gx_dps", avgGx);
  json.set("mpu/avg_gy_dps", avgGy);
  json.set("mpu/avg_gz_dps", avgGz);

  bool ok = Firebase.RTDB.updateNode(&fbdo, basePath.c_str(), &json);
  if (ok) {
    Serial.println("   SUCCESS! Data saved to Firebase.");
  } else {
    Serial.print("   ERROR Pushing to Firebase: ");
    Serial.println(fbdo.errorReason());
  }
  Serial.println("----------------------------------------");
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(3000); 
  
  Serial.println("\n\n\n====================================");
  Serial.println("      VITALGUARD BOOT SEQUENCE      ");
  Serial.println("====================================");

  Wire.begin();
  Wire.setClock(400000);
  Serial.println("[1] I2C Wire Started");

  uint64_t mac = ESP.getEfuseMac();
  deviceId = String((uint32_t)(mac >> 32), HEX) + String((uint32_t)mac, HEX);
  deviceId.toLowerCase();
  basePath = "/vitalguard/devices/" + deviceId;
  Serial.print("[2] Device ID: ");
  Serial.println(deviceId);

  Serial.print("[3] Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - t0) < 20000UL) {
    delay(500);
    Serial.print(".");
  }
  
  if(WiFi.status() == WL_CONNECTED){
    Serial.print("\n[+] WiFi Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[-] WiFi FAILED TO CONNECT! Check credentials.");
  }

  Serial.println("[4] Connecting to Firebase...");
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.reconnectWiFi(true);

  if (Firebase.signUp(&config, &auth, "", "")) {
    firebaseReady = true;
    Serial.println("[+] Firebase Auth Success!");
  } else {
    firebaseReady = false;
    Serial.print("[-] Firebase Signup failed: ");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  fbdo.setResponseSize(2048);

  Serial.println("[5] Init MPU6500...");
  mpuInit();
  mpuCalibrate(300);

  Serial.println("[6] Init MAX30102...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("FATAL ERROR: MAX30102 not found! Check wiring.");
    while(true) delay(500);
  }
  
  
  particleSensor.setup(0x1F, 4, 2, 400, 411, 4096);
  particleSensor.setPulseAmplitudeGreen(0);
  Serial.println("[+] MAX30102 Ready! (FAST MODE — Brighter LEDs, Higher Sample Rate)");

  unsigned long now = millis();
  windowStart = now;
  lastMpuTime = now;
  resetWindow(now);
  
  Serial.println("====================================");
  Serial.println("   SETUP COMPLETE! FAST MODE ON!   ");
  Serial.println("====================================");
}

// ============================================================
// LOOP 
// ============================================================
void loop() {
  unsigned long now = millis();

  // ── MPU at ~50 Hz ──────────────────────────────────────────
  if (now - lastMpuTime >= MPU_INTERVAL_MS) {
    float dt = (now - lastMpuTime) / 1000.0f;
    lastMpuTime = now;

    float ax,ay,az,gx,gy,gz;
    mpuRead(ax,ay,az,gx,gy,gz);

    float axmg=ax*1000.0f, aymg=ay*1000.0f, azmg=az*1000.0f;

    sumAx+=ax; sumAy+=ay; sumAz+=az;
    sumGx+=gx; sumGy+=gy; sumGz+=gz;
    mpuSampleCount++;

    if (!firstMpuSample && dt > 0.0f) {
      float jx=(axmg-prevAxmg)/dt;
      float jy=(aymg-prevAymg)/dt;
      float jz=(azmg-prevAzmg)/dt;
      float jerkMag = sqrtf(jx*jx + jy*jy + jz*jz);

      if (jerkMag > maxJerkInWindow) maxJerkInWindow = jerkMag;
      if (jerkMag > JERK_THRESHOLD)  jerkInWindow = true;
    } else {
      firstMpuSample = false;
    }

    prevAxmg=axmg; prevAymg=aymg; prevAzmg=azmg;
  }

  // ── MAX30102 sampling (continuous) ─────────────────────────
  long irValue = particleSensor.getIR();
  bool fingerOn = (irValue >= IR_FINGER_THRESHOLD);

  if (irValue > 0) {
    sumIR += (unsigned long)irValue;
    irSampleCount++;
  }

  if (!fingerOn) {
    resetPeakDetector();
    lastBeatValid = false;
  } else {
    bool beat = detectBeat(irValue);
    if (beat) {
      unsigned long beatNow = millis();
      if (!lastBeatValid || (beatNow - lastBeatTime) >= BEAT_COOLDOWN_MS) {
        unsigned long delta = lastBeatValid ? (beatNow - lastBeatTime) : 0;
        lastBeatTime = beatNow;
        lastBeatValid = true;

        if (delta > 0) {
          float bpm = 60000.0f / (float)delta;
          if (bpm > 30.0f && bpm < 200.0f) {
            rateBuffer[rateIdx % 4] = (byte)bpm;
            rateIdx++;

            float b0 = rateBuffer[(rateIdx-1) % 4];
            float b1 = rateBuffer[(rateIdx-2) % 4];
            float b2 = rateBuffer[(rateIdx-3) % 4];
            float smoothBpm = (rateIdx >= 3) ? median3(b0,b1,b2) : b0;

            bpmWindowSum += smoothBpm;
            bpmWindowCount++;
          }
        }
      }
    }
  }

  // ── 2-second window report → Firebase ──────────────────────
  if (now - windowStart >= WINDOW_MS) {
    float avgBpm = (bpmWindowCount > 0) ? (bpmWindowSum / bpmWindowCount) : 0.0f;
    float avgIR = (irSampleCount > 0) ? (sumIR / (float)irSampleCount) : 0.0f;

    float avgAx = (mpuSampleCount > 0) ? (sumAx / mpuSampleCount) : 0.0f;
    float avgAy = (mpuSampleCount > 0) ? (sumAy / mpuSampleCount) : 0.0f;
    float avgAz = (mpuSampleCount > 0) ? (sumAz / mpuSampleCount) : 0.0f;
    float avgGx = (mpuSampleCount > 0) ? (sumGx / mpuSampleCount) : 0.0f;
    float avgGy = (mpuSampleCount > 0) ? (sumGy / mpuSampleCount) : 0.0f;
    float avgGz = (mpuSampleCount > 0) ? (sumGz / mpuSampleCount) : 0.0f;

    bool fingerDetected = (avgIR >= IR_FINGER_THRESHOLD);
    bool bpmValid = fingerDetected && (bpmWindowCount >= MIN_BEAT_SAMPLES);

    pushWindowToFirebase(now,
                         avgBpm, bpmValid,
                         avgIR, fingerDetected,
                         jerkInWindow, maxJerkInWindow,
                         avgAx, avgAy, avgAz,
                         avgGx, avgGy, avgGz);

    resetWindow(now);
  }

  delay(10);
}
