import { useEffect, useState } from 'react';
import { playSuccessChime, playClick } from '../lib/audio';
import { Star, Trophy, Home, RotateCcw, ArrowRight } from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface EndOfRoundProps {
  levelNumber: number;
  levelName: string;
  starsEarned: number;
  coinsEarned: number;
  accuracy: number;
  settings: AccessibilitySettings;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function EndOfRound({
  levelNumber,
  levelName,
  starsEarned,
  coinsEarned,
  accuracy,
  settings,
  onNextLevel,
  onPlayAgain,
  onHome,
}: EndOfRoundProps) {
  const [balloons, setBalloons] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    // Generate celebratory balloons
    const colors = ['bg-rose-400', 'bg-sky-400', 'bg-yellow-400', 'bg-purple-400', 'bg-emerald-400', 'bg-orange-400'];
    const generated = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 85 + 5, // percentage
      delay: Math.random() * 2, // seconds delay
      color: colors[i % colors.length],
    }));
    setBalloons(generated);

    // Play successful completion audio
    playSuccessChime();
  }, [levelNumber]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Balloon Animation */}
      {!settings.reducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {balloons.map((b) => (
            <div
              key={b.id}
              style={{
                left: `${b.left}%`,
                animationDelay: `${b.delay}s`,
                animationDuration: '6s',
              }}
              className={`absolute bottom-[-100px] w-14 h-18 rounded-t-full rounded-b-[75%] ${b.color} shadow-lg animate-float-up opacity-80 flex flex-col items-center justify-end pb-2`}
            >
              {/* Balloon string */}
              <div className="w-0.5 h-10 bg-slate-300 translate-y-10" />
              {/* Balloon tie */}
              <div className="w-3 h-2 bg-inherit rotate-45 rounded-sm translate-y-2" />
              <span className="text-sm">🎈</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Celebratory Modal */}
      <div 
        className="w-full max-w-md bg-white border-2 border-[#BAE6FD] rounded-3xl p-5 md:p-6 shadow-2xl relative z-10 text-center animate-scale-in"
        id="completion-modal"
      >
        {/* Colorful Rainbow Arch Header */}
        <div className="w-full h-2 bg-gradient-to-r from-[#FF6B6B] via-orange-400 via-[#FEF08A] via-green-400 via-blue-400 to-[#818CF8] rounded-full mb-4" />

        {/* Mascot badge */}
        <div className="mx-auto w-16 h-16 bg-[#FEF08A]/40 border-2 border-[#FCD34D] rounded-full flex items-center justify-center text-3xl mb-3 animate-bounce">
          🦁
        </div>

        <h1 className="text-xl md:text-2xl font-black text-[#1E293B] tracking-tight mb-0.5">
          🌈 SUCCESS!
        </h1>
        <p className="text-sm md:text-base font-bold text-[#64748B] mb-3.5">
          "You Crossed Safely!"
        </p>

        {/* Big Glowy 5 Star Visual Display */}
        <div className="flex justify-center gap-1.5 mb-4" id="star-score-display">
          {[1, 2, 3, 4, 5].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-7 h-7 md:w-9 h-9 stroke-[2.5] transition-all duration-500 ${
                starIdx <= starsEarned
                  ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-md animate-pulse'
                  : 'text-neutral-200 fill-neutral-100'
              }`}
            />
          ))}
        </div>

        {/* Level Stats Breakdown */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <span className="text-xl mb-0.5">⭐</span>
            <span className="text-[10px] font-bold text-[#64748B]">Stars</span>
            <span className="text-base font-black text-[#1E293B]">+{starsEarned}</span>
          </div>

          <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <span className="text-xl mb-0.5">🪙</span>
            <span className="text-[10px] font-bold text-[#64748B]">Coins</span>
            <span className="text-base font-black text-[#1E293B]">+{coinsEarned}</span>
          </div>

          <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <span className="text-xl mb-0.5">🎯</span>
            <span className="text-[10px] font-bold text-[#64748B]">Accuracy</span>
            <span className="text-base font-black text-emerald-600">{accuracy}%</span>
          </div>
        </div>

        {/* Cheerful Voice Guide Text */}
        <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-[#1E293B] font-bold text-xs md:text-sm italic mb-4">
          🔊 "Wow, excellent job! You looked at the light, selected the right answer, and crossed safely!"
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          {/* Home Button */}
          <button
            onClick={() => {
              playClick();
              onHome();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 bg-white text-[#475569] font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
            id="modal-home-btn"
          >
            <Home className="w-4 h-4 shrink-0" />
            Home
          </button>

          {/* Play Again Button */}
          <button
            onClick={() => {
              playClick();
              onPlayAgain();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#BAE6FD] hover:bg-[#EFF6FF] bg-white text-indigo-600 font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
            id="modal-replay-btn"
          >
            <RotateCcw className="w-4 h-4 shrink-0 animate-spin-slow" />
            Replay
          </button>

          {/* Next Level Button */}
          {levelNumber < 8 ? (
            <button
              onClick={() => {
                playClick();
                onNextLevel();
              }}
              className="flex-1.5 py-3 px-4.5 rounded-xl border-b-4 border-emerald-700 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              id="modal-next-level-btn"
            >
              Next Level 🏆
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => {
                playClick();
                onHome();
              }}
              className="flex-1.5 py-3 px-4.5 rounded-xl border-b-4 border-amber-600 bg-[#F59E0B] hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-all cursor-pointer animate-pulse"
              id="modal-master-btn"
            >
              Get Certificate! 📜
              <Trophy className="w-4 h-4 shrink-0 text-yellow-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
