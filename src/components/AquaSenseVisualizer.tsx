import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Cpu, 
  Binary, 
  LayoutDashboard, 
  ShieldCheck, 
  Activity, 
  Waves,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { AQUASENSE_SENSORS } from '../data/portfolioData';

type PipelineStep = 'water' | 'sensors' | 'esp32' | 'data' | 'software' | 'interpretation';

export const AquaSenseVisualizer: React.FC = () => {
  const [activeStep, setActiveStep] = useState<PipelineStep>('sensors');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('turbidity');

  // Simulated live telemetry state for realistic hardware feel
  const [telemetry] = useState({
    turbidity: '2.4',
    tds: '148',
    temperature: '21.8',
    ph: '7.35',
    status: 'OPTIMAL CLEAR',
    frequency: '10 Hz',
    baudRate: '115200'
  });

  const pipelineSteps: { id: PipelineStep; label: string; icon: React.ReactNode; summary: string }[] = [
    { id: 'water', label: 'WATER', icon: <Waves className="w-3.5 h-3.5" />, summary: 'Physical Fluid Medium' },
    { id: 'sensors', label: 'SENSORS', icon: <Droplets className="w-3.5 h-3.5" />, summary: 'Turbidity, TDS, Temp & pH' },
    { id: 'esp32', label: 'ESP32-S3', icon: <Cpu className="w-3.5 h-3.5" />, summary: 'Microcontroller & ADC Filter' },
    { id: 'data', label: 'DATA', icon: <Binary className="w-3.5 h-3.5" />, summary: 'Telemetry Serialization' },
    { id: 'software', label: 'SOFTWARE', icon: <LayoutDashboard className="w-3.5 h-3.5" />, summary: 'Reactive Web Dashboard' },
    { id: 'interpretation', label: 'INTERPRETATION', icon: <ShieldCheck className="w-3.5 h-3.5" />, summary: 'Quality Index & Diagnosis' },
  ];

  const selectedSensor = AQUASENSE_SENSORS.find(s => s.id === selectedSensorId) || AQUASENSE_SENSORS[0];

  return (
    <div className="w-full rounded-2xl border border-[#38BDF8]/20 bg-[#050816]/90 p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.08)]">
      {/* Background Volumetric Blue Atmosphere */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#38BDF8]/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#1E3A8A]/20 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase font-semibold">
              CONNECTED HARDWARE SYSTEM ARCHITECTURE
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            AquaSense X Telemetry Pipeline
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-[#94A3B8]">
          <span className="px-2.5 py-1 rounded bg-[#07101F] border border-[#38BDF8]/20 text-[#38BDF8]">
            CHIP: ESP32-S3 (Xtensa LX7)
          </span>
          <span className="hidden md:inline px-2.5 py-1 rounded bg-[#07101F] border border-white/10 text-[#CBD5E1]">
            BUS: I2C / ADC
          </span>
        </div>
      </div>

      {/* Connected Visual Flow Sequence */}
      <div className="py-6 relative z-10">
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] mb-3 flex items-center justify-between">
          <span>SYSTEM FLOW (SELECT A NODE TO INSPECT)</span>
          <span className="text-[#38BDF8]">ACTIVE NODE: {activeStep.toUpperCase()}</span>
        </div>

        {/* Pipeline Nodes Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {pipelineSteps.map((step, idx) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`group relative p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'border-[#38BDF8] bg-[#07101F] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                    : 'border-white/10 bg-[#03050B]/60 hover:border-[#38BDF8]/30 hover:bg-[#07101F]/50'
                }`}
              >
                {/* Connecting arrow indicator for desktop */}
                {idx < pipelineSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-[#38BDF8]/40">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#38BDF8] text-[#03050B]' : 'bg-white/5 text-[#38BDF8]'}`}>
                    {step.icon}
                  </div>
                  <span className="font-mono text-[10px] text-[#94A3B8]">0{idx + 1}</span>
                </div>

                <div className="font-display font-bold text-xs sm:text-sm tracking-wider text-white">
                  {step.label}
                </div>
                <div className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                  {step.summary}
                </div>

                {isActive && (
                  <motion.div
                    layoutId="active-step-glow"
                    className="absolute inset-0 rounded-xl border-2 border-[#38BDF8] pointer-events-none"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Pipeline Node Interactive Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 relative z-10">
        
        {/* Left Interactive Node Spec (7 cols) */}
        <div className="lg:col-span-7 bg-[#03050B]/80 rounded-xl border border-white/10 p-5">
          <AnimatePresence mode="wait">
            {activeStep === 'water' && (
              <motion.div
                key="water"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                  <Waves className="w-4 h-4" />
                  <span>Physical Ingestion Phase</span>
                </div>
                <h4 className="text-lg font-display font-semibold text-white">Water Specimen & Field Sampling</h4>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  AquaSense X monitors physical water samples in residential, lab, or aquatic environments. Turbid matter, dissolved minerals, and thermal gradients create physical resistance and light scattering across the sensor array.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[#07101F] border border-white/5">
                    <span className="text-[#94A3B8] block">Sample Type:</span>
                    <span className="text-white font-semibold">Aqueous / Environmental</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#07101F] border border-white/5">
                    <span className="text-[#94A3B8] block">Interference:</span>
                    <span className="text-white font-semibold">Sediment & Dissolved Salts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 'sensors' && (
              <motion.div
                key="sensors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                    <Droplets className="w-4 h-4" />
                    <span>Transducer Subsystem</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#94A3B8]">Select a sensor below</span>
                </div>

                {/* Sensor selection buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AQUASENSE_SENSORS.map((sensor) => {
                    const isSelected = sensor.id === selectedSensorId;
                    return (
                      <button
                        key={sensor.id}
                        onClick={() => setSelectedSensorId(sensor.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#38BDF8] bg-[#07101F] text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'border-white/5 bg-[#07101F]/40 text-[#94A3B8] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="text-[10px] font-mono uppercase text-[#38BDF8]">{sensor.parameter}</div>
                        <div className="font-semibold text-xs truncate mt-0.5">{sensor.name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Sensor Deep Dive Card */}
                <div className="p-4 rounded-xl border border-[#38BDF8]/20 bg-[#07101F]/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-white text-base">
                      {selectedSensor.name} ({selectedSensor.parameter})
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8]">
                      Unit: {selectedSensor.unit}
                    </span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    {selectedSensor.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 text-[11px] font-mono">
                    <div className="flex-1 p-2 rounded bg-[#03050B] border border-white/5">
                      <span className="text-[#94A3B8]">Nominal Range: </span>
                      <span className="text-[#38BDF8] font-bold">{selectedSensor.nominalRange}</span>
                    </div>
                    <div className="flex-1 p-2 rounded bg-[#03050B] border border-white/5">
                      <span className="text-[#94A3B8]">Significance: </span>
                      <span className="text-[#F8FAFC]">{selectedSensor.significance}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 'esp32' && (
              <motion.div
                key="esp32"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>Processing Core</span>
                </div>
                <h4 className="text-lg font-display font-semibold text-white">ESP32-S3 Microcontroller Unit</h4>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  The ESP32-S3 dual-core microcontroller runs embedded C++ firmware with continuous Analog-to-Digital (ADC) conversion. Analog voltage signals from the turbidity and TDS sensors pass through median filtering to cancel transient electrical ripple.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                  <div className="p-2 rounded bg-[#07101F] border border-white/5">
                    <span className="text-[#94A3B8] text-[10px] block">Clock Speed</span>
                    <span className="text-[#38BDF8] font-bold">240 MHz Dual-Core</span>
                  </div>
                  <div className="p-2 rounded bg-[#07101F] border border-white/5">
                    <span className="text-[#94A3B8] text-[10px] block">ADC Precision</span>
                    <span className="text-[#38BDF8] font-bold">12-bit (0-4095)</span>
                  </div>
                  <div className="p-2 rounded bg-[#07101F] border border-white/5">
                    <span className="text-[#94A3B8] text-[10px] block">Filtering</span>
                    <span className="text-[#38BDF8] font-bold">Moving Median (N=15)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                  <Binary className="w-4 h-4" />
                  <span>Serialization & Transmission</span>
                </div>
                <h4 className="text-lg font-display font-semibold text-white">Telemetry Packet Serialization</h4>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Filtered floating-point values are packaged into structured JSON telemetry payloads. Data flows seamlessly over Wi-Fi sockets and UART serial conduits with timestamping and cyclic checksum validation.
                </p>
                <div className="p-3 rounded-lg bg-[#07101F] border border-[#38BDF8]/20 font-mono text-xs text-[#38BDF8] overflow-x-auto">
                  <code>{`{ "device": "AquaSense-S3", "turbidity_ntu": ${telemetry.turbidity}, "tds_ppm": ${telemetry.tds}, "temp_c": ${telemetry.temperature}, "ph": ${telemetry.ph}, "crc": "0x4F2A" }`}</code>
                </div>
              </motion.div>
            )}

            {activeStep === 'software' && (
              <motion.div
                key="software"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Client-Side Presentation</span>
                </div>
                <h4 className="text-lg font-display font-semibold text-white">Reactive Telemetry Dashboard</h4>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  A high-contrast, responsive web interface built with modern TypeScript and Tailwind CSS. Renders continuous historical trendlines, provides instant visual alerts if thresholds breach safety margins, and allows remote calibration.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
                  <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                  <span>Zero lag web-socket synchronization with live connection heartbeat.</span>
                </div>
              </motion.div>
            )}

            {activeStep === 'interpretation' && (
              <motion.div
                key="interpretation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Diagnostic Synthesis</span>
                </div>
                <h4 className="text-lg font-display font-semibold text-white">Water-Quality Interpretation Engine</h4>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Rather than showing isolated raw numbers, the software synthesizes all 4 parameters simultaneously to determine potable suitability, filtration efficacy, and chemical stability without fabricated claims.
                </p>
                <div className="p-3 rounded-lg bg-[#07101F] border border-emerald-500/20 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-semibold">SYNTHESIS: WITHIN POTABLE RECEPTOR SAFETY</span>
                  </div>
                  <span className="text-emerald-400 font-bold">INDEX 94 / 100</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Live Telemetry Screen (5 cols) */}
        <div className="lg:col-span-5 bg-[#03050B] rounded-xl border border-[#38BDF8]/20 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="font-mono text-xs text-[#CBD5E1] uppercase tracking-wider">LIVE TELEMETRY STREAM</span>
            </div>
            <span className="font-mono text-[10px] text-[#38BDF8] animate-pulse">● STREAMING</span>
          </div>

          {/* 4 Sensor Metric Tiles */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-lg bg-[#07101F]/80 border border-[#38BDF8]/15">
              <span className="text-[10px] font-mono text-[#94A3B8] block">TURBIDITY</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-bold text-white">{telemetry.turbidity}</span>
                <span className="text-xs font-mono text-[#38BDF8]">NTU</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Clear (&lt;5 NTU)</span>
            </div>

            <div className="p-3 rounded-lg bg-[#07101F]/80 border border-[#38BDF8]/15">
              <span className="text-[10px] font-mono text-[#94A3B8] block">TDS</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-bold text-white">{telemetry.tds}</span>
                <span className="text-xs font-mono text-[#38BDF8]">ppm</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Mineral Safe</span>
            </div>

            <div className="p-3 rounded-lg bg-[#07101F]/80 border border-[#38BDF8]/15">
              <span className="text-[10px] font-mono text-[#94A3B8] block">TEMPERATURE</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-bold text-white">{telemetry.temperature}</span>
                <span className="text-xs font-mono text-[#38BDF8]">°C</span>
              </div>
              <span className="text-[9px] font-mono text-[#CBD5E1] mt-1 block">Ambient Equilibrium</span>
            </div>

            <div className="p-3 rounded-lg bg-[#07101F]/80 border border-[#38BDF8]/15">
              <span className="text-[10px] font-mono text-[#94A3B8] block">pH CONTOUR</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-bold text-white">{telemetry.ph}</span>
                <span className="text-xs font-mono text-[#38BDF8]">pH</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-1 block">Neutral Range</span>
            </div>
          </div>

          {/* Bottom hardware state */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#38BDF8]" />
              ESP32-S3 VCC: 3.3V
            </span>
            <span className="text-[#38BDF8]">BAUD: 115200</span>
          </div>
        </div>

      </div>
    </div>
  );
};
