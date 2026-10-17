import React from 'react';
import { StuntEvent, VehicleTuning } from '../game/PhysicsEngine';
import {
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Zap,
  Flame,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

export interface HUDProps {
  speedMph: number;
  altitudeMeters: number;
  nitrogenFuel: number;
  airtime: number;
  stuntScore: number;
  recentStunt: StuntEvent | null;
  ringsCollected: number;
  totalRings: number;
  tokensCollected: number;
  totalTokens: number;
  dawnProgress: number;
  outOfBoundsNotice: boolean;
  isGrounded: boolean;
  carX: number;
  carZ: number;
  carHeading: number;
  ringPositions: { x: number; z: number; collected: boolean }[];
  tokenPositions: { x: number; z: number; collected: boolean }[];
  qualityMode?: 'perf' | 'high';
  onToggleQuality?: () => void;
  // Sound Effects Controls
  isMuted: boolean;
  onToggleMute: () => void;
  // Vehicle Dynamic Tuning
  tuning: VehicleTuning;
  onUpdateTuning: (tuning: Partial<VehicleTuning>) => void;
  isTuningOpen: boolean;
  onToggleTuning: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedMph,
  altitudeMeters,
  nitrogenFuel,
  airtime,
  stuntScore,
  recentStunt,
  ringsCollected,
  totalRings,
  tokensCollected,
  totalTokens,
  dawnProgress,
  outOfBoundsNotice,
  isGrounded,
  carX,
  carZ,
  carHeading,
  ringPositions,
  tokenPositions,
  qualityMode = 'perf',
  onToggleQuality,
  isMuted,
  onToggleMute,
  tuning,
  onUpdateTuning,
  isTuningOpen,
  onToggleTuning,
}) => {
  // Compute tachometer ratio based on 250 MPH
  const speedRatio = Math.min(100, (Math.abs(speedMph) / 250) * 100);
  const fuelColor = nitrogenFuel > 30 ? 'bg-cyan-400' : 'bg-amber-400';

  // Time of Day formatting from tokens collected (0 to 10)
  let timeOfDayPhase = 'DEEP NIGHT • 04:15 AM';
  let timeIcon = '🌙';
  if (dawnProgress >= 0.95) {
    timeOfDayPhase = 'SPACEX LAUNCH SUNRISE • 06:30 AM';
    timeIcon = '🌅';
  } else if (dawnProgress >= 0.65) {
    timeOfDayPhase = 'CIVIL DAWN • 06:05 AM';
    timeIcon = '☀️';
  } else if (dawnProgress >= 0.35) {
    timeOfDayPhase = 'NAUTICAL TWILIGHT • 05:30 AM';
    timeIcon = '🌄';
  } else if (dawnProgress >= 0.1) {
    timeOfDayPhase = 'ASTRONOMICAL DAWN • 04:55 AM';
    timeIcon = '🌌';
  }

  // Preset Configurations
  const presets = [
    {
      name: 'Stock Spec',
      icon: '🏎️',
      desc: 'Balanced factory Tesla Roadster baseline',
      values: { brakeSensitivity: 1.0, steeringResponse: 1.0, boostPower: 1.0 },
    },
    {
      name: 'Track & Slalom',
      icon: '🏁',
      desc: 'High grip, agile steering and firm brakes',
      values: { brakeSensitivity: 1.6, steeringResponse: 1.5, boostPower: 1.2 },
    },
    {
      name: 'SpaceX Dragster',
      icon: '🚀',
      desc: 'Ultra high-speed rocket boost launch',
      values: { brakeSensitivity: 1.2, steeringResponse: 0.9, boostPower: 2.6 },
    },
    {
      name: 'Stunt Master',
      icon: '🌪️',
      desc: 'Extreme air vectoring and somersault power',
      values: { brakeSensitivity: 1.4, steeringResponse: 2.2, boostPower: 2.0 },
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Out of Bounds Warning Notification Banner */}
      {outOfBoundsNotice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-white px-5 py-2 rounded-lg font-mono text-sm tracking-wide shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-red-400 font-bold">⚠️ ENERGY BARRIER DEFLECTION</span>
          <span className="text-slate-300">·</span>
          <span>Repositioned to Hot Wheels Launcher</span>
        </div>
      )}

      {/* 1. TOP TELEMETRY & CONTROL BAR */}
      <div className="absolute top-4 left-6 right-6 flex items-start justify-between gap-4">
        {/* Left: Brand, Score, Tokens & Dawn Tracker */}
        <div className="bg-slate-950/85 border border-slate-800/80 px-4 py-3 rounded-lg backdrop-blur-md shadow-xl flex items-center gap-5 flex-wrap">
          <div>
            <div className="text-[11px] tracking-wider text-slate-400 font-medium uppercase">
              TESLA ROADSTER
            </div>
            <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>SpaceX Thruster Package</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-cyan-400 font-mono">COLD-GAS NITROGEN</span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Stunt Score */}
          <div>
            <div className="text-[10px] tracking-wider text-slate-400 uppercase">
              Proving Score
            </div>
            <div className="text-base font-bold text-amber-400 font-mono tabular-nums">
              {stuntScore.toLocaleString()} PTS
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Star Tokens */}
          <div>
            <div className="text-[10px] tracking-wider text-amber-400 uppercase flex items-center gap-1">
              <span>Star Tokens</span>
            </div>
            <div className="text-sm font-semibold text-white font-mono tabular-nums">
              {tokensCollected} / {totalTokens}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Target Rings */}
          <div>
            <div className="text-[10px] tracking-wider text-cyan-400 uppercase">
              Aerial Rings
            </div>
            <div className="text-sm font-semibold text-white font-mono tabular-nums">
              {ringsCollected} / {totalRings}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden md:block" />

          {/* Dynamic Time of Day / Sunrise Protocol Tracker */}
          <div className="min-w-[170px] hidden md:block">
            <div className="text-[10px] tracking-wider text-orange-400 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>{timeIcon}</span>
                <span>DAWN PROTOCOL</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400">{Math.round(dawnProgress * 100)}%</span>
            </div>
            <div className="text-xs font-bold text-slate-200 font-mono truncate">
              {timeOfDayPhase}
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(4, dawnProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Dynamic Airtime / Stunt Banner */}
        {recentStunt && Date.now() - recentStunt.timestamp < 3500 && (
          <div className="animate-in fade-in zoom-in-95 duration-200 bg-slate-950/85 border border-cyan-500/50 px-6 py-2.5 rounded-lg backdrop-blur-md text-center shadow-[0_0_20px_rgba(6,182,212,0.25)] hidden lg:block">
            <div className="text-[11px] font-semibold text-cyan-300 tracking-wider uppercase">
              Acrobatic Maneuver Completed
            </div>
            <div className="text-xl font-bold text-white tracking-wide font-mono">
              {recentStunt.name}
            </div>
            <div className="text-xs font-semibold text-amber-400 font-mono">
              +{recentStunt.points} PTS {recentStunt.multiplier > 1 ? `(${recentStunt.multiplier}x Multiplier)` : ''}
            </div>
          </div>
        )}

        {/* Right Action Cluster: SFX Toggle, Tuning Panel Toggle, Graphics & Radar */}
        <div className="flex flex-col items-end gap-2">
          {/* Quick HUD Buttons: Sound Effects & Real-Time Tuning */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Sound Effects Toggle Button */}
            <button
              onClick={onToggleMute}
              className={`px-3 py-2 rounded-lg border font-mono text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/85 border-rose-600/80 text-rose-300 hover:bg-rose-900/90'
                  : 'bg-slate-900/85 border-emerald-500/60 text-emerald-400 hover:bg-slate-800 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              }`}
              title="Toggle Audio & Sound Effects [M]"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>SFX: MUTED [M]</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>SFX: ON [M]</span>
                </>
              )}
            </button>

            {/* Real-Time Vehicle Tuning Panel Toggle Button */}
            <button
              onClick={onToggleTuning}
              className={`px-3 py-2 rounded-lg border font-mono text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer ${
                isTuningOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/85 border-cyan-500/50 text-cyan-300 hover:bg-slate-800 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              }`}
              title="Open Real-Time Vehicle Dynamic Tuning Panel [T]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>TUNING [T]</span>
            </button>
          </div>

          {/* Mini-Radar & Graphics Quality Card */}
          <div className="bg-slate-950/85 border border-slate-800/80 p-2.5 rounded-lg backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono mb-1.5 px-0.5">
              <span>Starbase Arena</span>
              <span className="text-cyan-400">RADAR</span>
            </div>
            <div className="relative w-28 h-28 bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-slate-800" />
                <div className="h-full w-[1px] bg-slate-800 absolute" />
              </div>

              {/* Launch Tower */}
              <div
                className="absolute w-2 h-2 bg-slate-500 rounded-sm transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${50 + (0 / 400) * 45}%`,
                  top: `${50 + (-110 / 400) * 45}%`,
                }}
                title="Starship Launch Tower"
              />

              {/* Rings */}
              {ringPositions.map((ring, idx) => (
                <div
                  key={`ring-${idx}`}
                  className={`absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    ring.collected ? 'bg-slate-700' : 'bg-cyan-400 shadow-[0_0_4px_#38bdf8]'
                  }`}
                  style={{
                    left: `${Math.max(5, Math.min(95, 50 + (ring.x / 400) * 45))}%`,
                    top: `${Math.max(5, Math.min(95, 50 + (ring.z / 400) * 45))}%`,
                  }}
                />
              ))}

              {/* Tokens */}
              {tokenPositions.map((tok, idx) => (
                <div
                  key={`tok-${idx}`}
                  className={`absolute w-1.5 h-1.5 rotate-45 transform -translate-x-1/2 -translate-y-1/2 ${
                    tok.collected ? 'hidden' : 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                  }`}
                  style={{
                    left: `${Math.max(5, Math.min(95, 50 + (tok.x / 400) * 45))}%`,
                    top: `${Math.max(5, Math.min(95, 50 + (tok.z / 400) * 45))}%`,
                  }}
                />
              ))}

              {/* Player Car Heading */}
              <div
                className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_6px_#f59e0b]"
                style={{
                  left: `${Math.max(5, Math.min(95, 50 + (carX / 400) * 45))}%`,
                  top: `${Math.max(5, Math.min(95, 50 + (carZ / 400) * 45))}%`,
                  transform: `translate(-50%, -50%) rotate(${carHeading}rad)`,
                }}
              >
                <div className="w-1 h-1.5 bg-white absolute top-[-3px] left-[2.5px] rounded-t-sm" />
              </div>
            </div>

            {/* Graphics Quality Toggle Button */}
            {onToggleQuality && (
              <button
                onClick={onToggleQuality}
                className="pointer-events-auto w-full mt-2 py-1 px-2 rounded bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-[10px] font-mono text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                title="Click to toggle Graphics Quality"
              >
                <span>GRAPHICS</span>
                <span className={qualityMode === 'perf' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {qualityMode === 'perf' ? '⚡ 60 FPS' : '✨ HIGH'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME VEHICLE DYNAMIC TUNING PANEL MODAL */}
      {isTuningOpen && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] p-6 text-slate-200 flex flex-col gap-5 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
                    SpaceX Telemetry Tuning Lab
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time powertrain, steering rack, and cold-gas boost calibration.
                </p>
              </div>
              <button
                onClick={onToggleTuning}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
                title="Close Tuning Panel [T or Esc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Quick Calibration Profiles</span>
                <span className="text-[10px] text-cyan-400 font-mono">LIVE PRESETS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((preset) => {
                  const isActive =
                    Math.abs(tuning.brakeSensitivity - preset.values.brakeSensitivity) < 0.05 &&
                    Math.abs(tuning.steeringResponse - preset.values.steeringResponse) < 0.05 &&
                    Math.abs(tuning.boostPower - preset.values.boostPower) < 0.05;

                  return (
                    <button
                      key={preset.name}
                      onClick={() => onUpdateTuning(preset.values)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{preset.icon}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-xs font-bold leading-tight">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-Time Parameter Multiplier Sliders */}
            <div className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              {/* 1. Brake Sensitivity Multiplier */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Brake Sensitivity Multiplier
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                    {tuning.brakeSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={tuning.brakeSensitivity}
                  onChange={(e) => onUpdateTuning({ brakeSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0.5x (Soft Progressive)</span>
                  <span>1.0x (Stock Carbon)</span>
                  <span>2.5x (Ceramic Instant Decel)</span>
                </div>
              </div>

              {/* 2. Steering Response Multiplier */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Steering Response Multiplier
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                    {tuning.steeringResponse.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={tuning.steeringResponse}
                  onChange={(e) => onUpdateTuning({ steeringResponse: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0.5x (Relaxed Touring)</span>
                  <span>1.0x (Precision Standard)</span>
                  <span>2.5x (Hyper Agile / Stunt)</span>
                </div>
              </div>

              {/* 3. Boost Power Multiplier */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Boost Power Multiplier
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    {tuning.boostPower.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={tuning.boostPower}
                  onChange={(e) => onUpdateTuning({ boostPower: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0.5x (Mild Pulse)</span>
                  <span>1.0x (SpaceX 1.9s)</span>
                  <span>3.0x (Hyper Warp Rocket)</span>
                </div>
              </div>
            </div>

            {/* Footer with Reset & Status info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => onUpdateTuning({ brakeSensitivity: 1.0, steeringResponse: 1.0, boostPower: 1.0 })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Stock Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Active in Real-Time</span>
                </span>
                <button
                  onClick={onToggleTuning}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AIRTIME LIVE METER (Shown when car is airborne) */}
      {!isGrounded && airtime > 0.3 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-700/80 px-6 py-2 rounded-lg backdrop-blur-sm text-center shadow-lg">
          <div className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">
            Vertical Flight Airtime
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {airtime.toFixed(1)}s
          </div>
        </div>
      )}

      {/* 4. SPEEDOMETER & FLIGHT GAUGES (Bottom Right) */}
      <div className="absolute bottom-24 right-6 bg-slate-950/80 border border-slate-800/80 px-6 py-4 rounded-xl backdrop-blur-sm shadow-2xl flex flex-col items-end gap-3 min-w-[220px]">
        {/* Speed in MPH */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-white font-mono tracking-tighter tabular-nums">
            {speedMph}
          </span>
          <span className="text-xs font-bold text-cyan-400 tracking-wider">MPH</span>
        </div>

        {/* Speedometer Tachometer Line */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500 transition-all duration-75"
            style={{ width: `${speedRatio}%` }}
          />
        </div>

        {/* Altitude Radar */}
        <div className="w-full flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800/60">
          <span className="text-slate-400 text-[11px]">RADAR ALTITUDE</span>
          <span className="text-white font-bold tabular-nums">
            {Math.max(0, altitudeMeters).toFixed(1)} M
          </span>
        </div>

        {/* Cold-Gas Thruster Nitrogen Fuel Gauge */}
        <div className="w-full flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">THRUSTER PRESSURE</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {Math.round(nitrogenFuel)}%
            </span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${fuelColor} transition-all duration-100 shadow-[0_0_8px_rgba(56,189,248,0.5)]`}
              style={{ width: `${nitrogenFuel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
