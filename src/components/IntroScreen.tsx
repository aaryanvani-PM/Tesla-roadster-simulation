import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Volume2, ShieldCheck, Zap, Flame } from 'lucide-react';
import { audioEngine } from '../game/AudioEngine';

interface IntroScreenProps {
  onStartGame: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStartGame }) => {
  const [stage, setStage] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Staged revelation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 300);
    const timer2 = setTimeout(() => setStage(2), 1100);
    const timer3 = setTimeout(() => setStage(3), 1900);
    const timer4 = setTimeout(() => setStage(4), 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleLaunch = () => {
    if (isExiting) return;
    setIsExiting(true);

    // Initialize Web Audio on user gesture
    audioEngine.init();
    audioEngine.playBoostPad();

    // Smoothly dissolve black overlay after transition starts
    setTimeout(() => {
      onStartGame();
    }, 900);
  };

  // Keyboard shortcut listener (Space or Enter to start immediately)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExiting]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-8 sm:p-12 select-none overflow-hidden transition-all duration-1000 ease-out ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none filter blur-sm'
          : 'opacity-100 scale-100 bg-black'
      }`}
    >
      {/* Background Starbase Ambient Grid & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle radial center spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-950/20 rounded-full blur-[120px]" />
        
        {/* Cinematic Laser Horizon Scanner Line */}
        <div
          className={`absolute left-0 right-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent transition-opacity duration-1000 ${
            stage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Ambient Corner Accents */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
      </div>

      {/* Top Header Telemetry */}
      <div
        className={`relative z-10 flex items-center justify-between text-xs font-mono tracking-widest uppercase transition-all duration-700 ${
          stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span>SPACEX × TESLA PROVING PROTOCOL</span>
        </div>
        <div className="text-slate-500 hidden sm:block">
          STARBASE BOCA CHICA • ORBITAL STUNT ARENA
        </div>
        <button
          onClick={handleLaunch}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] underline underline-offset-4"
        >
          Skip Intro [Space]
        </button>
      </div>

      {/* Center Cinematic Title & Vehicle Diagnostic Sequence */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-3xl mx-auto">
        {/* Stage 1: Subtle Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-4 transition-all duration-700 ${
            stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Cold-Gas Thruster Package Prototype</span>
        </div>

        {/* Stage 2: Hero Title */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter uppercase mb-2 transition-all duration-700 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          TESLA <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">ROADSTER</span>
        </h1>

        <p
          className={`text-sm sm:text-base text-slate-400 font-mono tracking-wide max-w-xl mb-8 transition-all duration-700 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          10 SpaceX cold-gas nitrogen thrusters seamlessly arranged around an all-electric supercar.
        </p>

        {/* Stage 3: Real-Time Diagnostic Telemetry Checks */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10 transition-all duration-700 ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3 text-left">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Powertrain</div>
              <div className="text-xs font-bold text-slate-200">0-60 in 1.9s AWD</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3 text-left">
            <Flame className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">RCS Thrusters</div>
              <div className="text-xs font-bold text-slate-200">10,000 PSI Vector</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Proving Track</div>
              <div className="text-xs font-bold text-slate-200">360° Hot Wheels Loop</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
          </div>
        </div>

        {/* Stage 4: Interactive Main CTA Launch Button */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 ${
            stage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <button
            onClick={handleLaunch}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] cursor-pointer active:scale-95"
          >
            <span>ENTER PROVING GROUNDS</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click or press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200">SPACE</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200">ENTER</kbd> to ignite thrusters</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Telemetry */}
      <div
        className={`relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-500 transition-all duration-700 ${
          stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div>SYSTEM STATUS: ALL SYSTEMS NOMINAL</div>
        <div className="flex items-center gap-3">
          <span>REAL-TIME PHYSICS ENGINE</span>
          <span>•</span>
          <span>WEBGL 3D</span>
        </div>
      </div>
    </div>
  );
};
