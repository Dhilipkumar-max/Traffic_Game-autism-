import { useEffect, useState, useRef } from 'react';
import { TrafficLightState, AccessibilitySettings, LevelConfig } from '../types';
import { 
  playBirdChirp, 
  playWarningWhistle, 
  updateCarHumPitch,
  playBicycleBell,
  playFireTruckSiren,
  playScooterBeep,
  playCarHorn,
  playTruckHonk
} from '../lib/audio';

interface Car {
  id: number;
  x: number; // percentage
  speed: number;
  lane: 1 | 2; // 1 = Left-to-Right, 2 = Right-to-Left
  type: 'sedan' | 'sports' | 'bus' | 'truck' | 'bicycle' | 'firetruck' | 'scooter';
  color: string;
  size: number; // width percentage
}

interface RoadSceneProps {
  currentLight: TrafficLightState;
  settings: AccessibilitySettings;
  level: LevelConfig;
  characterEmoji: string;
  characterColor: string;
  petEmoji: string;
  themeId: string;
  isCrossing: boolean;
  crossingProgress: number; // 0 to 100
  policeIntervention: boolean;
  onChildReachedOtherSide: () => void;
  onPoliceStopComplete: () => void;
}

export default function RoadScene({
  currentLight,
  settings,
  level,
  characterEmoji,
  characterColor,
  petEmoji,
  themeId,
  isCrossing,
  crossingProgress,
  policeIntervention,
  onChildReachedOtherSide,
  onPoliceStopComplete,
}: RoadSceneProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [clouds, setClouds] = useState<{ id: number; x: number; y: number; speed: number; size: number }[]>([]);
  const [birds, setBirds] = useState<{ id: number; x: number; y: number; speed: number; wingOpen: boolean }[]>([]);
  
  // Animation frames and tick loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Initialize background elements
  useEffect(() => {
    // Generate static clouds and birds
    const initialClouds = [
      { id: 1, x: 10, y: 8, speed: 0.02, size: 80 },
      { id: 2, x: 45, y: 15, speed: 0.015, size: 100 },
      { id: 3, x: 80, y: 5, speed: 0.025, size: 70 },
    ];
    setClouds(initialClouds);

    const initialBirds = [
      { id: 1, x: -10, y: 22, speed: 0.12, wingOpen: true },
      { id: 2, x: 110, y: 12, speed: -0.09, wingOpen: false },
    ];
    setBirds(initialBirds);

    // Initial cars based on level config
    const generatedCars: Car[] = [];
    const colors = ['#f43f5e', '#3b82f6', '#eab308', '#a855f7', '#10b981', '#f97316'];
    const types: ('sedan' | 'sports' | 'bus' | 'truck' | 'bicycle' | 'firetruck' | 'scooter')[] = [
      'sedan', 'sports', 'bus', 'truck', 'bicycle', 'firetruck', 'scooter'
    ];

    for (let i = 0; i < level.carCount; i++) {
      const lane: 1 | 2 = (i % 2 === 0) ? 1 : 2;
      const type = types[i % types.length];
      const baseSpeed = (0.3 + Math.random() * 0.25) * level.carSpeed;
      const speedModifier = type === 'bicycle' ? 0.55 : type === 'scooter' ? 0.75 : type === 'firetruck' ? 1.3 : 1.0;
      const speed = baseSpeed * speedModifier;
      
      generatedCars.push({
        id: i,
        // Stagger positions across the screen width
        x: lane === 1 ? (0 - (i * 35)) : (100 + (i * 35)),
        speed,
        lane,
        type,
        color: type === 'firetruck' ? '#ef4444' : colors[i % colors.length],
        size: type === 'bus' ? 14 : type === 'firetruck' ? 14 : type === 'truck' ? 13 : type === 'sports' ? 9 : type === 'bicycle' ? 7 : type === 'scooter' ? 8 : 10,
      });
    }
    setCars(generatedCars);
  }, [level]);

  // Game Loop tick for moving elements
  useEffect(() => {
    const tick = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // 1. Move Clouds (ignore or slow if reducedMotion)
      if (!settings.reducedMotion) {
        setClouds(prev => prev.map(c => {
          let newX = c.x + c.speed * (delta / 16);
          if (newX > 110) newX = -15;
          return { ...c, x: newX };
        }));

        // Move Birds
        setBirds(prev => prev.map(b => {
          let newX = b.x + b.speed * (delta / 16);
          // Loop birds
          if (b.speed > 0 && newX > 115) {
            newX = -15;
            if (Math.random() > 0.6) playBirdChirp();
          } else if (b.speed < 0 && newX < -15) {
            newX = 115;
            if (Math.random() > 0.6) playBirdChirp();
          }
          // Flap wings
          const flap = Math.floor(time / 200) % 2 === 0;
          return { ...b, x: newX, wingOpen: flap };
        }));
      }

      // 2. Move Cars with Physics based on traffic light
      setCars(prevCars => {
        let maxCurrentSpeed = 0;
        const updated = prevCars.map(car => {
          let targetSpeedMultiplier = 1.0;

          if (currentLight === 'yellow') {
            targetSpeedMultiplier = 0.25; // slow down
          } else if (currentLight === 'green') {
            targetSpeedMultiplier = 0.0; // stop!
          }

          const currentSpeed = car.speed * targetSpeedMultiplier;
          if (currentSpeed > maxCurrentSpeed) {
            maxCurrentSpeed = currentSpeed;
          }

          let newX = car.x;

          if (car.lane === 1) {
            // Lane 1 moves Left-to-Right
            if (currentLight === 'green') {
              // Smooth stop before Zebra crossing (Zebra is around 45% - 55%)
              // Stop at x = 36% if car is before the zebra
              if (car.x < 36 && car.x + currentSpeed >= 36) {
                newX = 36;
              } else if (car.x >= 36) {
                // If already past the zebra, keep driving off screen
                newX = car.x + car.speed;
              } else {
                newX = car.x + currentSpeed;
              }
            } else {
              newX = car.x + (currentLight === 'yellow' ? Math.max(0.08, car.speed * 0.25) : car.speed);
            }

            // Loop offscreen
            if (newX > 120) {
              newX = -20;
            }
          } else {
            // Lane 2 moves Right-to-Left
            if (currentLight === 'green') {
              // Smooth stop before Zebra crossing (Zebra is 45% - 55%)
              // Stop at x = 60% if car is before the zebra (approaching from right)
              if (car.x > 60 && car.x - currentSpeed <= 60) {
                newX = 60;
              } else if (car.x <= 60) {
                // If already past, keep going
                newX = car.x - car.speed;
              } else {
                newX = car.x - currentSpeed;
              }
            } else {
              newX = car.x - (currentLight === 'yellow' ? Math.max(0.08, car.speed * 0.25) : car.speed);
            }

            // Loop offscreen
            if (newX < -20) {
              newX = 120;
            }
          }

          // Play unique sound when vehicle passes near the center crossing area
          const isPassingCenter = 
            (car.lane === 1 && car.x < 50 && newX >= 50) || 
            (car.lane === 2 && car.x > 50 && newX <= 50);

          if (isPassingCenter) {
            // Only play if the car is actually moving
            const isMoving = currentLight !== 'green' || (car.lane === 1 ? car.x >= 36 : car.x <= 60);
            if (isMoving) {
              switch (car.type) {
                case 'bicycle':
                  playBicycleBell();
                  break;
                case 'firetruck':
                  playFireTruckSiren();
                  break;
                case 'scooter':
                  playScooterBeep();
                  break;
                case 'bus':
                case 'truck':
                  playTruckHonk();
                  break;
                case 'sports':
                case 'sedan':
                default:
                  playCarHorn();
                  break;
              }
            }
          }

          return { ...car, x: newX };
        });

        // Update soft car engine hum pitch in background
        updateCarHumPitch(maxCurrentSpeed);

        return updated;
      });

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentLight, settings.reducedMotion]);

  // Custom theme configurations
  const getSkyGradient = () => {
    switch (themeId) {
      case 'sunset':
        return 'bg-gradient-to-b from-orange-400 via-rose-300 to-amber-100';
      case 'rainbow':
        return 'bg-gradient-to-b from-purple-300 via-pink-200 to-teal-100';
      case 'school':
        return 'bg-gradient-to-b from-emerald-300 to-teal-50';
      case 'sunny':
      default:
        return 'bg-gradient-to-b from-[#BAE6FD] to-[#E0F2FE]';
    }
  };

  const getGrassColor = () => {
    switch (themeId) {
      case 'sunset': return 'bg-amber-100 border-t-4 border-amber-200';
      case 'rainbow': return 'bg-pink-50 border-t-4 border-pink-100';
      case 'school': return 'bg-emerald-100 border-t-4 border-emerald-200';
      case 'sunny':
      default: return 'bg-[#86EFAC] border-t-4 border-[#4ADE80]';
    }
  };

  const getSidewalkColor = () => {
    switch (themeId) {
      case 'sunset': return 'bg-amber-200 border-y-4 border-amber-300';
      case 'rainbow': return 'bg-purple-100 border-y-4 border-purple-200';
      case 'school': return 'bg-slate-300 border-y-4 border-slate-400';
      case 'sunny':
      default: return 'bg-[#CBD5E1] border-y-4 border-[#94A3B8]';
    }
  };

  // Helper to render cute cartoon vector cars
  const renderCarSVG = (car: Car) => {
    const height = car.type === 'bus' ? 44 : car.type === 'firetruck' ? 44 : car.type === 'truck' ? 42 : car.type === 'sports' ? 24 : car.type === 'bicycle' ? 36 : car.type === 'scooter' ? 34 : 28;
    const isLeftToRight = car.lane === 1;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 40"
        className={`w-full h-full drop-shadow-md transition-transform duration-100 ${isLeftToRight ? '' : 'scale-x-[-1]'}`}
      >
        {/* Wheels (Only for standard vehicles) */}
        {car.type !== 'bicycle' && car.type !== 'scooter' && (
          <>
            <circle cx="22" cy="32" r="6" fill="#1e293b" />
            <circle cx="22" cy="32" r="3" fill="#cbd5e1" />
            <circle cx="78" cy="32" r="6" fill="#1e293b" />
            <circle cx="78" cy="32" r="3" fill="#cbd5e1" />
          </>
        )}

        {car.type === 'bus' && (
          <>
            {/* School Bus body */}
            <rect x="5" y="4" width="90" height="26" rx="5" fill="#facc15" />
            <rect x="5" y="24" width="90" height="4" fill="#1e293b" />
            {/* Bus Windows */}
            <rect x="12" y="8" width="12" height="10" rx="1" fill="#38bdf8" />
            <rect x="28" y="8" width="12" height="10" rx="1" fill="#38bdf8" />
            <rect x="44" y="8" width="12" height="10" rx="1" fill="#38bdf8" />
            <rect x="60" y="8" width="12" height="10" rx="1" fill="#38bdf8" />
            <path d="M 76 8 L 88 8 L 88 18 L 76 18 Z" fill="#38bdf8" />
            {/* Front Grill & Lights */}
            <rect x="91" y="18" width="4" height="8" rx="1" fill="#e2e8f0" />
            <circle cx="92" cy="22" r="2.5" fill="#fef08a" />
            {/* Cute Cartoon Eyes on the Bus Front */}
            <circle cx="83" cy="12" r="3.5" fill="white" />
            <circle cx="83" cy="12" r="1.5" fill="black" />
            {/* Cheerful mouth */}
            <path d="M 88 24 Q 91 26 91 24" stroke="black" strokeWidth="1.5" fill="none" />
            <text x="32" y="22" fill="#1e293b" fontSize="5" fontWeight="bold">SCHOOL BUS</text>
          </>
        )}

        {car.type === 'truck' && (
          <>
            {/* Cargo Truck */}
            <rect x="8" y="4" width="55" height="26" rx="2" fill="#e2e8f0" />
            <rect x="63" y="12" width="28" height="18" rx="3" fill={car.color} />
            <rect x="74" y="15" width="12" height="8" rx="1" fill="#38bdf8" />
            {/* Wheels cover */}
            <rect x="6" y="28" width="86" height="3" fill="#475569" />
            {/* Eye */}
            <circle cx="80" cy="18" r="3" fill="white" />
            <circle cx="80" cy="18" r="1.5" fill="black" />
            <circle cx="89" cy="24" r="2" fill="#fbbf24" />
          </>
        )}

        {car.type === 'sports' && (
          <>
            {/* Sleek sports car */}
            <path d="M 5 28 L 10 16 Q 15 14 30 14 L 65 14 Q 75 14 85 20 L 93 24 Q 96 28 92 30 Z" fill={car.color} />
            <rect x="35" y="16" width="20" height="8" fill="#1e293b" />
            <path d="M 58 16 L 72 16 Q 76 18 78 24 L 58 24 Z" fill="#38bdf8" />
            {/* Eye on windshield */}
            <circle cx="67" cy="19" r="2" fill="white" />
            <circle cx="67" cy="19" r="1" fill="black" />
            {/* Back wing */}
            <path d="M 8 16 L 16 12 L 18 16 Z" fill="#1e293b" />
          </>
        )}

        {car.type === 'sedan' && (
          <>
            {/* Classic cute sedan */}
            <rect x="10" y="16" width="80" height="14" rx="4" fill={car.color} />
            <path d="M 25 16 L 38 6 L 68 6 L 78 16 Z" fill={car.color} />
            <rect x="40" y="9" width="12" height="7" fill="#38bdf8" />
            <path d="M 56 9 L 68 9 L 72 16 L 56 16 Z" fill="#38bdf8" />
            {/* Eyeball on wind shield */}
            <circle cx="63" cy="12" r="2.5" fill="white" />
            <circle cx="63" cy="12" r="1.2" fill="black" />
            {/* Light */}
            <circle cx="88" cy="22" r="2.5" fill="#fef08a" />
          </>
        )}

        {car.type === 'firetruck' && (
          <>
            {/* Premium Fire Engine */}
            <rect x="6" y="6" width="58" height="24" rx="2" fill="#b91c1c" />
            <rect x="64" y="10" width="28" height="20" rx="3" fill="#ef4444" />
            {/* Ladder on top */}
            <rect x="15" y="2" width="45" height="4" fill="#94a3b8" rx="1" />
            <rect x="22" y="2" width="2" height="4" fill="#f1f5f9" />
            <rect x="32" y="2" width="2" height="4" fill="#f1f5f9" />
            <rect x="42" y="2" width="2" height="4" fill="#f1f5f9" />
            <rect x="52" y="2" width="2" height="4" fill="#f1f5f9" />
            {/* Flashing Blue Emergency Siren */}
            <rect x="74" y="6" width="8" height="4" rx="1" fill="#3b82f6" />
            <circle cx="78" cy="6" r="3.5" fill="#60a5fa" className="animate-pulse" />
            {/* Cabin Window */}
            <rect x="74" y="14" width="12" height="7" fill="#38bdf8" rx="1" />
            {/* Cute eyes */}
            <circle cx="81" cy="17.5" r="2.5" fill="white" />
            <circle cx="81" cy="17.5" r="1.2" fill="black" />
            {/* Golden shield badge */}
            <polygon points="34,14 39,12 44,14 42,20 34,20" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            <text x="36" y="18" fill="#78350f" fontSize="4.5" fontWeight="black">911</text>
          </>
        )}

        {car.type === 'bicycle' && (
          <>
            {/* Spoked Wheels */}
            <circle cx="26" cy="31" r="7.5" stroke="#475569" strokeWidth="1.5" fill="none" />
            <circle cx="26" cy="31" r="2" fill="#475569" />
            <line x1="26" y1="23.5" x2="26" y2="38.5" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="18.5" y1="31" x2="33.5" y2="31" stroke="#94a3b8" strokeWidth="0.5" />

            <circle cx="74" cy="31" r="7.5" stroke="#475569" strokeWidth="1.5" fill="none" />
            <circle cx="74" cy="31" r="2" fill="#475569" />
            <line x1="74" y1="23.5" x2="74" y2="38.5" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="66.5" y1="31" x2="81.5" y2="31" stroke="#94a3b8" strokeWidth="0.5" />

            {/* Bike Frame */}
            <path d="M 26 31 L 44 31 L 58 19 L 74 31 M 44 31 L 40 17 L 50 17 M 58 19 L 55 13" stroke={car.color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <line x1="44" y1="31" x2="58" y2="19" stroke="#1e293b" strokeWidth="1.5" />
            {/* Handlebars */}
            <path d="M 55 13 L 61 13 M 55 13 L 51 15" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
            {/* Seat */}
            <path d="M 37 17 L 44 17" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            {/* Helmet-wearing Kid Rider Emoji */}
            <text x="40" y="11" fontSize="11" className="select-none">🧒</text>
            <text x="38" y="7" fontSize="8" className="select-none">🪖</text>
          </>
        )}

        {car.type === 'scooter' && (
          <>
            {/* Cute Vespa Moped Scooter */}
            {/* Small Wheels */}
            <circle cx="26" cy="32.5" r="5.5" fill="#1e293b" />
            <circle cx="26" cy="32.5" r="2.5" fill="#cbd5e1" />
            <circle cx="74" cy="32.5" r="5.5" fill="#1e293b" />
            <circle cx="74" cy="32.5" r="2.5" fill="#cbd5e1" />

            {/* Scooter frame */}
            <path d="M 26 32 L 42 32 L 68 32 L 72 18" stroke={car.color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Body shield and seat */}
            <path d="M 20 22 L 38 22 Q 44 22 44 31 L 22 31 Z" fill={car.color} rx="2" />
            <path d="M 66 18 Q 72 18 72 32" stroke={car.color} strokeWidth="5.5" strokeLinecap="round" fill="none" />
            {/* Seat */}
            <path d="M 23 20 C 26 19, 36 19, 39 21" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Front headlamp */}
            <circle cx="73" cy="17" r="3" fill="#fef08a" />
            <path d="M 72 15 L 68 15" stroke="#475569" strokeWidth="2" />
            {/* Cute driver Emoji */}
            <text x="44" y="21" fontSize="13" className="select-none">🐶</text>
          </>
        )}
      </svg>
    );
  };

  return (
    <div className={`w-full relative select-none rounded-3xl ${settings.highContrast ? 'border-4 border-slate-800' : 'border border-slate-100/60 shadow-md'} bg-[#E0F2FE] overflow-hidden h-[420px] md:h-[480px]`}>
      
      {/* 1. SKY BACKDROP */}
      <div className={`absolute inset-x-0 top-0 h-[40%] ${getSkyGradient()} relative overflow-hidden transition-all duration-700`}>
        
        {/* Rainbow representation on crossing success */}
        {isCrossing && crossingProgress > 80 && (
          <div className="absolute inset-0 flex justify-center items-end opacity-90 animate-fade-in pointer-events-none">
            <svg viewBox="0 0 100 50" className="w-[180px] h-[90px] translate-y-3">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f43f5e" strokeWidth="4" />
              <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f97316" strokeWidth="4" />
              <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#eab308" strokeWidth="4" />
              <path d="M 25 50 A 25 25 0 0 1 75 50" fill="none" stroke="#22c55e" strokeWidth="4" />
              <path d="M 30 50 A 20 20 0 0 1 70 50" fill="none" stroke="#3b82f6" strokeWidth="4" />
              <path d="M 35 50 A 15 15 0 0 1 65 50" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
          </div>
        )}

        {/* Floating clouds */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            style={{ left: `${cloud.x}%`, top: `${cloud.y}%` }}
            className="absolute opacity-85 pointer-events-none transition-all duration-100 ease-linear"
          >
            <svg width={cloud.size} height={cloud.size / 2} viewBox="0 0 100 50" fill="white">
              <path d="M 20 40 A 15 15 0 0 1 40 25 A 20 20 0 0 1 75 25 A 15 15 0 0 1 90 40 Z" />
            </svg>
          </div>
        ))}

        {/* flying birds */}
        {birds.map(bird => (
          <div
            key={bird.id}
            style={{ left: `${bird.x}%`, top: `${bird.y}%` }}
            className="absolute transition-all duration-100 ease-linear pointer-events-none"
          >
            <svg width="24" height="20" viewBox="0 0 24 20" fill="#2563eb">
              {bird.wingOpen ? (
                <path d="M 2 12 Q 10 2 12 12 Q 14 2 22 12 Q 12 16 2 12" />
              ) : (
                <path d="M 2 10 Q 10 16 12 10 Q 14 16 22 10 Q 12 12 2 10" />
              )}
            </svg>
          </div>
        ))}

        {/* School House (specifically for school zone level, or rendered beautifully in general) */}
        <div className="absolute bottom-0 left-6 flex items-end pointer-events-none">
          {/* School Building */}
          <div className="w-24 h-16 bg-red-400 rounded-t-xl border-4 border-red-500 relative flex flex-col justify-between p-1 shadow-sm">
            <div className="flex justify-around">
              <div className="w-4 h-4 bg-yellow-100 rounded border border-red-500 flex items-center justify-center text-[7px] font-bold">🏫</div>
              <div className="w-4 h-4 bg-yellow-100 rounded border border-red-500 flex items-center justify-center text-[7px]">📚</div>
            </div>
            {/* Clock tower */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-200 border-4 border-amber-400 rounded-full flex items-center justify-center shadow">
              <span className="text-[8px] font-bold text-amber-900">🕒</span>
            </div>
            {/* Door */}
            <div className="w-6 h-6 bg-amber-800 border-t-2 border-x-2 border-amber-950 mx-auto rounded-t-md" />
          </div>
          {/* Cute tree */}
          <div className="w-8 h-12 flex flex-col items-center -ml-2">
            <div className="w-8 h-8 bg-green-400 border-4 border-green-500 rounded-full" />
            <div className="w-2 h-4 bg-amber-700" />
          </div>
        </div>

        {/* Cute Houses / Trees background */}
        <div className="absolute bottom-0 right-6 flex items-end gap-3 pointer-events-none">
          <div className="w-16 h-10 bg-indigo-200 border-4 border-indigo-300 rounded-t-md relative">
            <div className="absolute -top-4 left-0 w-16 h-4 bg-rose-300 border-t-4 border-x-4 border-rose-400" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>
          <div className="w-10 h-14 flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-400 border-4 border-emerald-500 rounded-full" />
            <div className="w-2.5 h-4 bg-amber-800" />
          </div>
        </div>
      </div>

      {/* 2. TOP SIDEWALK (GRASS & WALKWAY) */}
      <div className={`h-[12%] ${getGrassColor()} flex items-center justify-between px-8 relative`}>
        {/* Safety sign post */}
        <div className="w-1.5 h-10 bg-slate-400 relative">
          <div className="absolute -top-4 -left-3 w-8 h-6 bg-blue-500 border-2 border-white rounded flex items-center justify-center shadow">
            <span className="text-[10px] font-black text-white">🚸</span>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-700 font-sans tracking-wide">
          {themeId === 'school' ? '🏫 School Crossing Zone' : '🏡 Safety Safe Sidewalk'}
        </div>
      </div>

      {/* 3. THE ROAD WAY (Main play area with zebra stripe lane) */}
      <div className="h-[38%] bg-[#475569] relative border-y-8 border-[#334155] flex flex-col justify-around overflow-hidden">
        
        {/* Lane separator dotted line */}
        <div className="absolute inset-x-0 top-1/2 border-t-4 border-dashed border-white h-0 opacity-40" />

        {/* ZEBRA CROSSING STRIPES (In the center) */}
        <div className="absolute left-[42%] right-[42%] top-0 bottom-0 flex justify-between px-2 pointer-events-none z-10">
          <div className={`w-3.5 bg-white h-full border-x-2 border-neutral-700 opacity-90 ${currentLight === 'green' ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.7)]' : ''}`} />
          <div className={`w-3.5 bg-white h-full border-x-2 border-neutral-700 opacity-90 ${currentLight === 'green' ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.7)]' : ''}`} />
          <div className={`w-3.5 bg-white h-full border-x-2 border-neutral-700 opacity-90 ${currentLight === 'green' ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.7)]' : ''}`} />
          <div className={`w-3.5 bg-white h-full border-x-2 border-neutral-700 opacity-90 ${currentLight === 'green' ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.7)]' : ''}`} />
        </div>

        {/* Lane 1 - Top lane (Left to Right) */}
        <div className="w-full h-[45%] relative flex items-center">
          {cars.filter(c => c.lane === 1).map(car => (
            <div
              key={car.id}
              style={{
                left: `${car.x}%`,
                width: `${car.size}%`,
                height: car.type === 'bus' ? '90%' : car.type === 'truck' ? '85%' : '65%',
              }}
              className="absolute z-20 transition-all duration-100 ease-linear"
            >
              {renderCarSVG(car)}
            </div>
          ))}
        </div>

        {/* Lane 2 - Bottom lane (Right to Left) */}
        <div className="w-full h-[45%] relative flex items-center">
          {cars.filter(c => c.lane === 2).map(car => (
            <div
              key={car.id}
              style={{
                left: `${car.x}%`,
                width: `${car.size}%`,
                height: car.type === 'bus' ? '90%' : car.type === 'truck' ? '85%' : '65%',
              }}
              className="absolute z-20 transition-all duration-100 ease-linear"
            >
              {renderCarSVG(car)}
            </div>
          ))}
        </div>
      </div>

      {/* 4. BOTTOM SIDEWALK (Waiting point for the child) */}
      <div className={`h-[10%] ${getSidewalkColor()} flex items-center relative z-20`}>
        {/* Zebra approach marks */}
        <div className="absolute left-[42%] right-[42%] inset-y-0 bg-neutral-400 flex justify-between border-x-4 border-amber-400 opacity-80" />
      </div>

      {/* 5. TRAFFIC LIGHT (LARGE & VISIBLE ON SIDEWALK) */}
      <div className="absolute top-[20%] right-6 md:right-10 w-20 h-48 bg-[#1E293B] rounded-2xl p-3 flex flex-col justify-between shadow-xl ring-4 ring-[#0F172A] z-40 items-center">
        
        {/* Red light bulb */}
        <div className="relative">
          <div
            className={`w-11 h-11 rounded-full transition-all duration-500 flex items-center justify-center font-black ${
              currentLight === 'red'
                ? 'bg-red-600 border-4 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.8)] scale-105'
                : 'bg-red-950/50 border-2 border-red-900 opacity-40'
            }`}
            id="light-bulb-red"
          >
            {settings.highContrast && currentLight === 'red' && (
              <span className="text-xs text-white">🔴</span>
            )}
          </div>
          {currentLight === 'red' && (
            <span className="absolute -left-12 top-2 bg-red-600 text-white font-bold text-[9px] px-1 rounded shadow animate-bounce">STOP</span>
          )}
        </div>

        {/* Yellow light bulb */}
        <div className="relative">
          <div
            className={`w-11 h-11 rounded-full transition-all duration-500 flex items-center justify-center font-black ${
              currentLight === 'yellow'
                ? 'bg-[#F59E0B] border-4 border-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105'
                : 'bg-amber-950/50 border-2 border-amber-900 opacity-40'
            }`}
            id="light-bulb-yellow"
          >
            {settings.highContrast && currentLight === 'yellow' && (
              <span className="text-xs text-black">🟡</span>
            )}
          </div>
          {currentLight === 'yellow' && (
            <span className="absolute -left-12 top-2 bg-[#F59E0B] text-black font-bold text-[9px] px-1 rounded shadow">WAIT</span>
          )}
        </div>

        {/* Green light bulb */}
        <div className="relative">
          <div
            className={`w-11 h-11 rounded-full transition-all duration-500 flex items-center justify-center font-black ${
              currentLight === 'green'
                ? 'bg-[#10B981] border-4 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-105'
                : 'bg-emerald-950/50 border-2 border-emerald-900 opacity-40'
            }`}
            id="light-bulb-green"
          >
            {settings.highContrast && currentLight === 'green' && (
              <span className="text-xs text-white">🟢</span>
            )}
          </div>
          {currentLight === 'green' && (
            <span className="absolute -left-12 top-2 bg-[#10B981] text-white font-bold text-[9px] px-1 rounded shadow animate-pulse">GO!</span>
          )}
        </div>
      </div>

      {/* 6. CHILD CHARACTER (SMOOTH ANIMATED ON THE ROAD) */}
      <div
        style={{
          left: '48%',
          top: isCrossing 
            ? `${82 - (crossingProgress * 0.65)}%` // Walk upward from sidewalk (82%) to other side sidewalk (17%)
            : '82%',
        }}
        className="absolute w-12 h-14 z-30 transition-all duration-100 ease-linear flex flex-col items-center justify-center"
        id="character-container"
      >
        {/* Child character drawing */}
        <div className="relative flex flex-col items-center select-none">
          {/* Walking wobble animation */}
          <div className={`relative ${isCrossing ? 'animate-bounce' : 'animate-pulse'}`}>
            {/* Cute outfit color base circle */}
            <div className={`w-11 h-11 rounded-full border-4 border-[#1E293B] ${characterColor} flex items-center justify-center shadow-md relative`}>
              {/* Face Emoji */}
              <span className="text-2xl mt-0.5">{characterEmoji}</span>
            </div>
            
            {/* Backpack/Accessory representation */}
            <span className="absolute -right-1 -top-1 text-xs">🎒</span>
          </div>

          {/* Sits at feet / Pet follow */}
          {petEmoji !== '❌' && (
            <div className="absolute -left-5 bottom-0 text-lg animate-bounce" style={{ animationDelay: '150ms' }}>
              {petEmoji}
            </div>
          )}
        </div>
      </div>

      {/* 7. FRIENDLY POLICE OFFICER (Gentle guidance overlay) */}
      <div
        className={`absolute bottom-[10%] left-4 transition-all duration-500 z-40 flex items-end gap-2 max-w-[240px] md:max-w-[280px] ${
          policeIntervention ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-48 opacity-0 scale-90 pointer-events-none'
        }`}
        id="police-officer-intervention"
      >
        {/* Friendly Police Officer vector avatar */}
        <div className="w-16 h-16 shrink-0 bg-blue-50 border-4 border-[#3B82F6] rounded-full flex items-center justify-center text-3xl shadow-md relative">
          👮
          <span className="absolute -right-1 -top-1 bg-[#FF6B6B] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">📢</span>
        </div>
        
        {/* Dialogue Bubble */}
        <div className="bg-white border-4 border-[#3B82F6] text-[#1E293B] rounded-3xl p-3 shadow-xl text-xs font-bold leading-snug relative">
          <p className="font-sans text-[#1E293B]">
            "Cars are moving! Let's wait for green together."
          </p>
          <button
            onClick={() => {
              playWarningWhistle();
              onPoliceStopComplete();
            }}
            className="mt-2 w-full py-1 bg-red-500 hover:bg-red-600 border-2 border-red-700 text-white font-black rounded-lg text-[10px] text-center tracking-wider transition-all cursor-pointer block"
          >
            OKAY! 🛑
          </button>
          {/* Arrow */}
          <div className="absolute bottom-4 -left-2.5 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-[#3B82F6] border-b-8 border-b-transparent" />
        </div>
      </div>

      {/* Static Visual Decoration elements - Cheerful Mascot in outer boundary */}
      <div className="absolute bottom-2 left-4 pointer-events-none opacity-90 flex items-center gap-1.5 z-10 text-[11px] font-bold text-[#1E293B] bg-white border-2 border-[#BAE6FD] rounded-full px-3 py-1 shadow-sm">
        <span className="text-sm">🦁</span> Mascot says: "Stay safe!"
      </div>
    </div>
  );
}
