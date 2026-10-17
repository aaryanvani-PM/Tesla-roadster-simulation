import React, { useState } from 'react';
import { CameraMode } from '../game/CameraController';
import {
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface ControlsDockProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRespawn: () => void;
  // Virtual control triggers for touch/mouse
  onTriggerControlStart: (key: string) => void;
  onTriggerControlEnd: (key: string) => void;
  // Tuning panel toggle
  isTuningOpen?: boolean;
  onToggleTuning?: () => void;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  cameraMode,
  onCameraModeChange,
  isMuted,
  onToggleMute,
  onRespawn,
  onTriggerControlStart,
  onTriggerControlEnd,
  isTuningOpen,
  onToggleTuning,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const cameraOptions: { mode: CameraMode; label: string }[] = [
    { mode: 'chase', label: 'Chase' },
    { mode: 'cockpit', label: 'Cockpit' },
    { mode: 'action', label: 'Stunt' },
    { mode: 'drone', label: 'Drone' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center max-w-[min(960px,96vw)] select-none">
      {/* Drawer Toggle Handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-t-md text-xs font-medium backdrop-blur-md transition-colors shadow-lg cursor-pointer pointer-events-auto"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show Proving Dock (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hide Dock (Zen View)</span>
          </>
        )}
      </button>

      {/* Main Unified Control Bar */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 p-2.5 bg-slate-950/90 border border-slate-800/80 rounded-xl backdrop-blur-md shadow-2xl text-slate-200 pointer-events-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Camera Switcher Segmented Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
              <Camera className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
              {cameraOptions.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => onCameraModeChange(opt.mode)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    cameraMode === opt.mode
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* In-Game Action Buttons: Touch & Click Affordance */}
            <div className="flex items-center gap-1.5">
              {/* Thruster Lift */}
              <button
                onMouseDown={() => onTriggerControlStart('Space')}
                onMouseUp={() => onTriggerControlEnd('Space')}
                onTouchStart={() => onTriggerControlStart('Space')}
                onTouchEnd={() => onTriggerControlEnd('Space')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                title="Fire 4 Underbody SpaceX Thrusters (Spacebar)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>THRUSTER LIFT [SPACE]</span>
              </button>

              {/* Rocket Boost */}
              <button
                onMouseDown={() => onTriggerControlStart('Shift')}
                onMouseUp={() => onTriggerControlEnd('Shift')}
                onTouchStart={() => onTriggerControlStart('Shift')}
                onTouchEnd={() => onTriggerControlEnd('Shift')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                title="Fire Rear Boost Thruster (Shift)"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>BOOST [SHIFT]</span>
              </button>
            </div>

            {/* Utility Actions: Audio, Tuning, Respawn, Help */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title={isMuted ? 'Unmute Sound Effects [M]' : 'Mute Sound Effects [M]'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline font-mono text-[11px]">{isMuted ? 'Muted' : 'SFX'}</span>
              </button>

              {onToggleTuning && (
                <button
                  onClick={onToggleTuning}
                  className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
                    isTuningOpen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300 hover:text-white'
                  }`}
                  title="Vehicle Dynamic Tuning Panel [T]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tuning [T]</span>
                </button>
              )}

              <button
                onClick={onRespawn}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset Roadster to Staging Pad (R)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset [R]</span>
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                  showHelp ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Stunt & Control Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick On-Screen Direction Pad for Touch Screen Devices */}
          <div className="md:hidden flex items-center justify-between pt-1 border-t border-slate-800/80 px-2">
            <div className="flex gap-1">
              <button
                onMouseDown={() => onTriggerControlStart('KeyA')}
                onMouseUp={() => onTriggerControlEnd('KeyA')}
                onTouchStart={() => onTriggerControlStart('KeyA')}
                onTouchEnd={() => onTriggerControlEnd('KeyA')}
                className="p-3 bg-slate-900 active:bg-cyan-600 rounded border border-slate-800 text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onMouseDown={() => onTriggerControlStart('KeyD')}
                onMouseUp={() => onTriggerControlEnd('KeyD')}
                onTouchStart={() => onTriggerControlStart('KeyD')}
                onTouchEnd={() => onTriggerControlEnd('KeyD')}
                className="p-3 bg-slate-900 active:bg-cyan-600 rounded border border-slate-800 text-white"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1">
              <button
                onMouseDown={() => onTriggerControlStart('KeyW')}
                onMouseUp={() => onTriggerControlEnd('KeyW')}
                onTouchStart={() => onTriggerControlStart('KeyW')}
                onTouchEnd={() => onTriggerControlEnd('KeyW')}
                className="p-3 bg-slate-900 active:bg-cyan-600 rounded border border-slate-800 text-white"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onMouseDown={() => onTriggerControlStart('KeyS')}
                onMouseUp={() => onTriggerControlEnd('KeyS')}
                onTouchStart={() => onTriggerControlStart('KeyS')}
                onTouchEnd={() => onTriggerControlEnd('KeyS')}
                className="p-3 bg-slate-900 active:bg-cyan-600 rounded border border-slate-800 text-white"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Control & Stunt Help Card (Collapsible) */}
      {showHelp && !isCollapsed && (
        <div className="mt-2 p-4 bg-slate-950/95 border border-slate-800 rounded-xl backdrop-blur-md shadow-2xl text-xs text-slate-300 w-full max-w-lg pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
            <span className="font-semibold text-white tracking-wide">Roadster Thruster & Stunt Manual</span>
            <button
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 leading-relaxed">
            <div>
              <div className="text-[11px] font-semibold text-cyan-400 mb-1">HIGH-SPEED DRIVING & AGILITY</div>
              <ul className="space-y-0.5 text-slate-300">
                <li><span className="font-mono text-white">W / ↑</span> : Progressive Throttle</li>
                <li><span className="font-mono text-white">S / ↓</span> : Brake & Reverse</li>
                <li><span className="font-mono text-white">A / D</span> : Tight Steering & Zero-Speed Pivot</li>
                <li><span className="font-mono text-white">SHIFT</span> : SpaceX Rocket Boost (180+ MPH)</li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-amber-400 mb-1">IN-AIR THRUSTERS & STUNTS</div>
              <ul className="space-y-0.5 text-slate-300">
                <li><span className="font-mono text-white">SPACE</span> : Vertical Cold-Gas Hover Lift</li>
                <li><span className="font-mono text-white">A / D (Air)</span> : Thruster Gimbal, RCS & 360° Turns</li>
                <li><span className="font-mono text-white">W / S (Air)</span> : Somersaults & Backflips</li>
                <li><span className="font-mono text-white">R</span> : Instant Arena Reset</li>
              </ul>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1">
            <span>🔥 Hot Wheels Circuit: Drive into the flared launcher lane to enter the 360° Loop & Stunt Jump!</span>
            <span>👍 Collect Star Tokens to summon Elon Musk Thumbs Up celebrations & bonus multipliers!</span>
          </div>
        </div>
      )}
    </div>
  );
};
