import React, { useEffect, useState } from 'react';
import { Sparkles, ThumbsUp } from 'lucide-react';

interface ElonThumbsUpModalProps {
  tokenEvent: { id: string; points: number; label: string; timestamp: number } | null;
}

const ELON_QUOTES = [
  'To the Moon! 👍',
  'Occupying Mars! 🚀',
  'Hot Wheels Mode Activated! 🔥',
  '1.1 seconds 0-60! Pure Physics.',
  'Cold-Gas Thrusters Nominal! 💨',
  'Next-Level Stunt! Doge Approved 🐶',
  'Starship Approved Maneuver! 🌌',
  'Maximum Plaid Velocity! ⚡',
];

export const ElonThumbsUpModal: React.FC<ElonThumbsUpModalProps> = ({ tokenEvent }) => {
  const [visible, setVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentToken, setCurrentToken] = useState<typeof tokenEvent>(null);

  useEffect(() => {
    if (!tokenEvent) return;

    setCurrentToken(tokenEvent);
    const randomQuote = ELON_QUOTES[Math.floor(Math.random() * ELON_QUOTES.length)];
    setCurrentQuote(randomQuote);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, [tokenEvent]);

  if (!visible || !currentToken) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none cursor-pointer animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="relative bg-slate-950/90 border-2 border-amber-400/90 p-4 rounded-2xl backdrop-blur-md shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center gap-4 max-w-md">
        {/* Glow halo behind portrait */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 rounded-2xl blur-lg -z-10" />

        {/* Handcrafted Stylized Elon Musk Vector Avatar with Thumbs Up */}
        <div className="relative w-20 h-20 shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-400/80 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Dark SpaceX background */}
            <rect width="100" height="100" fill="#0f172a" />
            <circle cx="82" cy="18" r="6" fill="#f59e0b" opacity="0.4" />
            <circle cx="20" cy="25" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="75" cy="40" r="1.2" fill="#ffffff" opacity="0.6" />

            {/* Flight Jacket Shoulders */}
            <path d="M 12 100 C 12 76, 32 70, 50 70 C 68 70, 88 76, 88 100 Z" fill="#1e293b" />
            {/* SpaceX Collar */}
            <path d="M 38 72 L 50 82 L 62 72 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
            {/* Red Roadster/SpaceX patch */}
            <rect x="25" y="82" width="10" height="5" rx="1" fill="#dc2626" />

            {/* Neck */}
            <rect x="44" y="58" width="12" height="15" fill="#fcd34d" rx="2" />

            {/* Face Shape */}
            <path
              d="M 34 38 C 34 22, 66 22, 66 38 C 66 52, 58 64, 50 64 C 42 64, 34 52, 34 38 Z"
              fill="#fed7aa"
            />

            {/* Characteristic Hair (Brownish brushed forward/side) */}
            <path
              d="M 33 36 C 31 22, 45 14, 56 15 C 67 16, 70 24, 67 34 C 64 24, 54 22, 44 24 C 38 25, 34 29, 33 36 Z"
              fill="#523924"
            />

            {/* Eyes & Eyebrows */}
            <ellipse cx="43" cy="39" rx="2.5" ry="1.5" fill="#1e293b" />
            <ellipse cx="57" cy="39" rx="2.5" ry="1.5" fill="#1e293b" />
            <path d="M 40 35 Q 43 33 46 35" stroke="#451a03" strokeWidth="1.5" fill="none" />
            <path d="M 54 35 Q 57 33 60 35" stroke="#451a03" strokeWidth="1.5" fill="none" />

            {/* Characteristic Smirk / Smile */}
            <path
              d="M 44 50 Q 50 56 57 51"
              stroke="#9a3412"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Stubble shadow */}
            <path d="M 43 56 Q 50 61 57 56" stroke="#ea580c" strokeWidth="1" strokeDasharray="1,1" fill="none" opacity="0.5" />

            {/* Big Thumbs Up Glove Overlay */}
            <g transform="translate(62, 52) scale(0.42)">
              <circle cx="28" cy="28" r="26" fill="#f59e0b" />
              <path
                d="M 28 8 C 32 8, 33 16, 31 22 L 39 22 C 43 22, 45 25, 43 29 L 40 40 C 39 43, 36 45, 32 45 L 20 45 C 17 45, 15 43, 15 40 L 15 28 C 15 25, 17 22, 21 20 L 25 10 C 26 8, 27 8, 28 8 Z"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
            </g>
          </svg>

          {/* Golden Badge Border */}
          <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow">
            <ThumbsUp className="w-3 h-3 fill-current" />
          </div>
        </div>

        {/* Quote & Point Award Details */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ELON APPROVES!</span>
            <span className="text-slate-500">·</span>
            <span className="text-white font-bold">+{currentToken.points} PTS</span>
          </div>

          <div className="text-base font-extrabold text-white tracking-tight">
            "{currentQuote}"
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Collected: <span className="text-cyan-300 font-semibold">{currentToken.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
