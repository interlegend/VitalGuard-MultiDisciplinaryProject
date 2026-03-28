import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { database } from './firebaseConfig';
import { 
  Activity, 
  HeartPulse, 
  PersonStanding, 
  Wifi, 
  Cpu, 
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';


export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-200">
      {currentView === 'landing' ? (
        <LandingPage onLaunch={() => setCurrentView('dashboard')} />
      ) : (
        <Dashboard onReturn={() => setCurrentView('landing')} />
      )}
    </div>
  );
}


function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/30">
                <Activity size={28} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">VitalGuard</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">How it Works</a>
              <a href="#hardware" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">The Hardware</a>
              <a href="#team" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">Team</a>
              <button 
                onClick={onLaunch}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-xl flex items-center gap-2"
              >
                Launch Live Dashboard
                <Activity size={18} />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4">
            <a href="#how-it-works" className="block text-base font-medium text-slate-600">How it Works</a>
            <a href="#hardware" className="block text-base font-medium text-slate-600">The Hardware</a>
            <a href="#team" className="block text-base font-medium text-slate-600">Team</a>
            <button 
              onClick={onLaunch}
              className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-medium flex justify-center items-center gap-2"
            >
              Launch Live Dashboard
              <Activity size={18} />
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-100/50 via-slate-50 to-slate-50 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-800 font-medium text-sm mb-8 border border-cyan-200">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            Engineering Prototype v1.0 Active
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            VitalGuard: Your Lifeline, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Connected.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-12 leading-relaxed">
            An advanced IoT smart wearable device powered by the ESP32 microcontroller. 
            Delivering real-time fall detection and continuous heart monitoring for at-risk patients directly to caregivers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              onClick={onLaunch}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
            >
              View Live Dashboard
              <ArrowLeft className="rotate-180" size={20} />
            </button>
            <a 
              href="#hardware"
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-8 py-4 rounded-full text-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              Explore the Hardware
            </a>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Engineered for Precision</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Three core pillars of our multidisciplinary approach to patient safety.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartPulse className="text-rose-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Heart Rate</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Continuous cardiovascular monitoring using the high-precision <strong className="text-slate-800">MAX30102</strong> pulse oximeter and heart-rate sensor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PersonStanding className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Fall Detection</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Advanced kinematic analysis powered by the <strong className="text-slate-800">MPU6050</strong> 6-axis gyroscope and accelerometer to detect sudden impacts.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="bg-cyan-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wifi className="text-cyan-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cloud-Powered Alerts</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Seamless data transmission via the <strong className="text-slate-800">ESP32</strong> Wi-Fi module, syncing instantly to Firebase Realtime Database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section id="hardware" className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-cyan-400 font-medium text-sm mb-6 border border-slate-700">
                <Cpu size={16} />
                Hardware Architecture
              </div>
              <h2 className="text-4xl font-bold mb-6 leading-tight">The Brains Behind the Operation</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                VitalGuard is built on a robust, low-latency hardware stack designed for reliability in critical situations.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-800 p-2 rounded-lg h-fit">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">ESP32 Microcontroller</h4>
                    <p className="text-slate-400">The central processing unit. Handles sensor data aggregation, fall detection algorithms, and Wi-Fi communication to the cloud.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-800 p-2 rounded-lg h-fit">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">MPU6050 Sensor</h4>
                    <p className="text-slate-400">Provides 3-axis acceleration and 3-axis gyroscopic data to calculate orientation and detect sudden free-falls or impacts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-800 p-2 rounded-lg h-fit">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">MAX30102 Module</h4>
                    <p className="text-slate-400">Uses optical sensors (Red and IR LEDs) to measure heart rate continuously and stream to the cloud.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-rose-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-video bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <Cpu size={64} className="text-slate-600 mb-4" />
                  <p className="text-slate-400 font-mono text-sm">Prototype Breadboard Visualization</p>
                  <div className="mt-8 flex gap-4 w-full justify-center">
                    <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded text-xs font-mono text-cyan-400">ESP32</div>
                    <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded text-xs font-mono text-amber-400">MPU6050</div>
                    <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded text-xs font-mono text-rose-400">MAX30102</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="text-cyan-500" size={24} />
            <span className="text-xl font-bold text-slate-900">VitalGuard</span>
          </div>
          <p className="text-slate-500">Engineering a safer tomorrow.</p>
        </div>
      </footer>
    </div>
  );
}


function Dashboard({ onReturn }: { onReturn: () => void }) {
  // ── STATE ──────────────────────────────────────────────────────────────────
  const [isEmergency, setIsEmergency] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [maxJerk, setMaxJerk] = useState(0);

  // ── FIREBASE LIVE DATA HOOK ────────────────────────────────────────────────
  useEffect(() => {
    const deviceMac = "9417b22b1838";
    const esp32Ref = ref(database, `vitalguard/devices/${deviceMac}`);

    const unsubscribe = onValue(esp32Ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        setBpm(data.heart_rate?.bpm || 0);
        setFingerDetected(data.heart_rate?.finger_detected || false);
        setMaxJerk(data.motion?.max_jerk || 0);

        // Auto-trigger emergency from real Firebase alert
        if (data.system?.alert_level === "CRITICAL" || data.motion?.jerk_detected === true) {
          setIsEmergency(true);
        } else {
          setIsEmergency(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onReturn}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Return to Product Page"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-500" size={24} />
              <span className="font-bold text-slate-900 hidden sm:block">VitalGuard</span>
              <span className="text-slate-400 hidden sm:block">/</span>
              <span className="font-medium text-slate-600">Caregiver Portal - Live Monitoring</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">System Online</span>
          </div>
        </div>
      </header>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="bg-rose-600 text-white px-4 py-4 shadow-lg z-30 relative animate-pulse">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={32} className="animate-bounce" />
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider">CRITICAL: Fall Detected!</h2>
                <p className="text-rose-100">Max Jerk: {Math.round(maxJerk)} mg/s — Initiating Caregiver Notification...</p>
              </div>
            </div>
            <button 
              onClick={() => setIsEmergency(false)}
              className="bg-white text-rose-600 px-6 py-2 rounded-full font-bold hover:bg-rose-50 transition-colors whitespace-nowrap"
            >
              Acknowledge & Reset
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column: Vitals */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <HeartPulse className="text-rose-500" size={20} />
                  Patient Vitals
                </h3>
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Live Data</span>
              </div>

              <div className="p-8">
                {/* BPM Display - Full Width */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-rose-500/5 ${isEmergency ? 'animate-pulse' : ''}`}></div>

                  <HeartPulse 
                    size={48} 
                    className={`mb-4 ${!fingerDetected ? 'text-slate-300' : isEmergency ? 'text-rose-500 animate-bounce' : 'text-rose-500 animate-pulse'}`} 
                    style={fingerDetected && bpm > 0 ? { animationDuration: `${60 / bpm}s` } : {}}
                  />

                  {fingerDetected ? (
                    <div className="flex flex-col items-center z-10">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-7xl font-bold tracking-tighter ${isEmergency ? 'text-rose-600' : 'text-slate-900'}`}>
                          {Number(bpm).toFixed(2)}
                        </span>
                        <span className="text-2xl font-medium text-slate-500">BPM</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2 font-medium uppercase tracking-wider">Heart Rate — Live</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center animate-pulse mt-2 z-10">
                      <span className="text-5xl font-bold tracking-tighter text-slate-300 mb-3">--</span>
                      <span className="text-sm font-bold text-rose-600 bg-rose-100 px-4 py-2 rounded-full border border-rose-200 shadow-sm uppercase tracking-wider text-center">
                        ⚠️ Please Place Finger on Sensor
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Alert System */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={20} />
                  Emergency Alert System
                </h3>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <p className="text-slate-600 mb-6 max-w-lg">
                  This alert triggers automatically when the MPU6050 sensor detects a sudden impact or free-fall event above the jerk threshold.
                </p>
                <div className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 ${
                  isEmergency 
                    ? 'bg-rose-100 text-rose-600 border-2 border-rose-300 animate-pulse' 
                    : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                }`}>
                  <AlertTriangle size={24} />
                  {isEmergency ? 'FALL DETECTED — ALERT ACTIVE' : 'Monitoring for Fall Events...'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Cpu className="text-slate-500" size={20} />
                  Sensor Status
                </h3>
              </div>
              <div className="p-6 space-y-6">

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                      <Wifi className="text-cyan-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">ESP32 Connection</p>
                      <p className="text-xs text-slate-500 font-mono">Wi-Fi / Firebase</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-medium text-emerald-600">Online</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                      <PersonStanding className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">MPU6050</p>
                      <p className="text-xs text-slate-500 font-mono">Accel / Gyro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${isEmergency ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className={`text-sm font-medium ${isEmergency ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isEmergency ? 'TRIGGERED' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                      <HeartPulse className="text-rose-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">MAX30102</p>
                      <p className="text-xs text-slate-500 font-mono">Heart Rate Sensor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${fingerDetected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                    <span className={`text-sm font-medium ${fingerDetected ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {fingerDetected ? 'Active' : 'Standby'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* System Logs */}
            <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden text-white p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" />
                System Logs
              </h4>
              <div className="font-mono text-xs text-slate-400 space-y-2 h-36 overflow-y-auto flex flex-col-reverse">
                {isEmergency && (
                  <>
                    <p className="text-rose-400">[WARN] Fall detected. MPU6050 jerk threshold exceeded.</p>
                    <p className="text-rose-400">[ALERT] Max Jerk: {Math.round(maxJerk)} mg/s. Firebase alert active.</p>
                  </>
                )}
                {fingerDetected && <p className="text-emerald-400">[INFO] Finger detected. MAX30102 reading: {Number(bpm).toFixed(2)} BPM.</p>}
                {!fingerDetected && <p className="text-amber-400">[WARN] No finger on sensor. Heart rate standby.</p>}
                <p>[INFO] MAX30102 initialized successfully.</p>
                <p>[INFO] ESP32 heartbeat acknowledged.</p>
                <p>[INFO] Connected to Firebase Realtime DB.</p>
                <p>[INFO] System initialized.</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}