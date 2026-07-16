import { useState, useEffect, useRef } from 'react';
import { 
  GameStats, 
  AccessibilitySettings, 
  TrafficLightState, 
  LevelConfig 
} from './types';
import { LEVELS, CHARACTERS, PETS, THEMES } from './lib/gameData';
import { 
  speak, 
  stopSpeaking, 
  playClick, 
  playSuccessChime, 
  playWaitChime, 
  playWarningWhistle, 
  playLevelCompleteChime, 
  startCarHum, 
  stopCarHum, 
  updateAudioSettings 
} from './lib/audio';

import RoadScene from './components/RoadScene';
import SettingsPanel from './components/SettingsPanel';
import EndOfRound from './components/EndOfRound';
import UnlocksShop from './components/UnlocksShop';
import MasterCertificate from './components/MasterCertificate';

import { 
  Star, 
  Coins, 
  Settings, 
  ShoppingBag, 
  Award, 
  RotateCcw, 
  Play, 
  Volume2, 
  VolumeX, 
  Lock, 
  CheckCircle2, 
  ArrowLeft,
  BookOpen,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const LOCAL_STORAGE_STATS_KEY = 'traffic_light_game_stats_v2';
const LOCAL_STORAGE_SETTINGS_KEY = 'traffic_light_game_settings_v2';

const DEFAULT_STATS: GameStats = {
  level: 1,
  stars: 0,
  coins: 0,
  balloons: 0,
  rainbowPoints: 0,
  unlockedCharacters: ['alex'],
  unlockedPets: ['none'],
  unlockedThemes: ['sunny'],
  selectedCharacter: 'alex',
  selectedPet: 'none',
  selectedTheme: 'sunny',
  totalCrossings: 0,
  successfulCrossings: 0,
  totalMistakes: 0,
  highestLevelReached: 1
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  voiceGuidance: true,
  soundEffects: true,
  backgroundMusic: false,
  reducedMotion: false,
  highContrast: false,
  textSize: 'normal'
};

export default function App() {
  // Game states loaded from localStorage
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  // Interface view states
  const [activeScreen, setActiveScreen] = useState<'menu' | 'playing'>('menu');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Active game logic states
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [currentLight, setCurrentLight] = useState<TrafficLightState>('red');
  const [isCrossing, setIsCrossing] = useState<boolean>(false);
  const [crossingProgress, setCrossingProgress] = useState<number>(0);
  const [policeIntervention, setPoliceIntervention] = useState<boolean>(false);
  const [mistakesThisRound, setMistakesThisRound] = useState<number>(0);
  const [narratorBubble, setNarratorBubble] = useState<string>('');

  // Refs for timers
  const lightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const walkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceDelayRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load of Stats and Settings
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
      
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        updateAudioSettings(parsedSettings);
      } else {
        updateAudioSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.error('Error loading game progress', e);
    }
  }, []);

  // Save Stats whenever updated
  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.error('Error saving progress', e);
    }
  };

  // Save Settings whenever updated
  const saveSettings = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    updateAudioSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  };

  const handleResetProgress = () => {
    localStorage.removeItem(LOCAL_STORAGE_STATS_KEY);
    saveStats(DEFAULT_STATS);
    saveSettings(DEFAULT_SETTINGS);
    setSelectedLevelId(1);
    setActiveScreen('menu');
    setShowSettings(false);
  };

  // 2. Play Level Action
  const handleStartLevel = (levelId: number) => {
    playClick();
    setSelectedLevelId(levelId);
    setActiveScreen('playing');
    setMistakesThisRound(0);
    setIsCrossing(false);
    setCrossingProgress(0);
    setPoliceIntervention(false);
    setShowSuccessModal(false);

    const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    
    // Set initial light state
    if (level.mixedSignals) {
      setCurrentLight('red');
    } else {
      setCurrentLight(level.focusSignal || 'red');
    }

    // Greet level
    setNarratorBubble(level.instructionText);
    
    if (voiceDelayRef.current) clearTimeout(voiceDelayRef.current);
    voiceDelayRef.current = setTimeout(() => {
      speak(level.voiceText, true);
    }, 400);

    // Start car engine hum
    if (settings.soundEffects) {
      startCarHum();
    }
  };

  // Manage light looping cycles for mixed levels
  useEffect(() => {
    if (activeScreen !== 'playing' || showSuccessModal || policeIntervention || isCrossing) {
      if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
      return;
    }

    const level = LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0];
    if (!level.mixedSignals) {
      // Focus levels don't loop lights automatically!
      return;
    }

    const runLightCycle = () => {
      if (lightTimerRef.current) clearTimeout(lightTimerRef.current);

      let nextState: TrafficLightState = 'red';
      let duration = level.lightDuration.red;

      if (currentLight === 'red') {
        nextState = 'yellow';
        duration = level.lightDuration.red; // stay red for red time, then go yellow
      } else if (currentLight === 'yellow') {
        nextState = 'green';
        duration = level.lightDuration.yellow;
      } else if (currentLight === 'green') {
        nextState = 'red';
        duration = level.lightDuration.green;
      }

      lightTimerRef.current = setTimeout(() => {
        setCurrentLight(nextState);
        
        // Speak updates on light change
        if (nextState === 'red') {
          setNarratorBubble("Light is Red! 🔴 Press STOP to stay safe.");
          speak("The light turned red. Stop!", true);
        } else if (nextState === 'yellow') {
          setNarratorBubble("Light is Yellow! 🟡 Press WAIT.");
          speak("The light is yellow. Wait for the cars to slow down.", true);
        } else if (nextState === 'green') {
          setNarratorBubble("Light is Green! 🟢 Press CROSS to walk!");
          speak("The light is green! Now is the safe time to cross.", true);
        }
      }, duration);
    };

    runLightCycle();

    return () => {
      if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
    };
  }, [activeScreen, currentLight, selectedLevelId, showSuccessModal, policeIntervention, isCrossing]);

  // Handle Walking across road
  useEffect(() => {
    if (isCrossing && activeScreen === 'playing') {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);

      walkIntervalRef.current = setInterval(() => {
        setCrossingProgress(prev => {
          if (prev >= 100) {
            clearInterval(walkIntervalRef.current!);
            handleCrossingComplete();
            return 100;
          }
          return prev + 1.8;
        });
      }, 30);
    } else {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    }

    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [isCrossing, activeScreen]);

  // 3. User Action Buttons
  const handleStopAction = () => {
    playClick();
    if (isCrossing || policeIntervention) return;

    if (currentLight === 'red') {
      playSuccessChime();
      setNarratorBubble("Great job! 🔴 Red light means STOP!");
      speak("Great job! Red means stop. You are waiting safely on the sidewalk.", true);
      
      // Reward
      const addedCoins = 15;
      const addedStars = 1;
      saveStats({
        ...stats,
        stars: stats.stars + addedStars,
        coins: stats.coins + addedCoins,
        rainbowPoints: stats.rainbowPoints + 5
      });

      // Special transition for Level 1 Focus Red:
      if (selectedLevelId === 1) {
        setTimeout(() => {
          setCurrentLight('green');
          setNarratorBubble("Now the light is Green! 🟢 Tap CROSS to walk!");
          speak("Look! Now the light is green. Tap CROSS to walk safely across!", true);
        }, 3000);
      }
    } else {
      setNarratorBubble("You are stopping! Let's watch for the light to turn green.");
      speak("You pressed stop. Let's wait for green.", true);
    }
  };

  const handleWaitAction = () => {
    playClick();
    if (isCrossing || policeIntervention) return;

    if (currentLight === 'yellow') {
      playWaitChime();
      setNarratorBubble("Nice waiting! 🟡 Yellow light means WAIT!");
      speak("Nice waiting! Yellow means wait for the cars to slow down.", true);

      // Reward
      const addedCoins = 15;
      const addedStars = 1;
      saveStats({
        ...stats,
        stars: stats.stars + addedStars,
        coins: stats.coins + addedCoins,
        rainbowPoints: stats.rainbowPoints + 5
      });

      // Special transition for Level 2 Focus Yellow:
      if (selectedLevelId === 2) {
        setTimeout(() => {
          setCurrentLight('green');
          setNarratorBubble("Now the light is Green! 🟢 Tap CROSS to walk!");
          speak("The light turned green! Tap CROSS to walk safely!", true);
        }, 3000);
      }
    } else {
      setNarratorBubble("You are waiting safely on the sidewalk.");
      speak("You are waiting. Nice job.", true);
    }
  };

  const handleCrossAction = () => {
    playClick();
    if (isCrossing || policeIntervention) return;

    if (currentLight === 'green') {
      // Safe to cross!
      setIsCrossing(true);
      setNarratorBubble("Wonderful! 🚶 Crossing the street safely...");
      speak("Walking safely across the zebra crossing. Excellent!", true);
    } else {
      // Red or Yellow: Intervened by friendly police officer
      playWarningWhistle();
      setMistakesTotal();
      setPoliceIntervention(true);
      setNarratorBubble("Wait! Cars are moving. Let's stay on the sidewalk.");
      speak("Wait. Cars are moving. Let's wait for the green light.", true);
    }
  };

  const setMistakesTotal = () => {
    setMistakesThisRound(prev => prev + 1);
    saveStats({
      ...stats,
      totalMistakes: stats.totalMistakes + 1
    });
  };

  const handlePoliceStopComplete = () => {
    playClick();
    setPoliceIntervention(false);
    setCrossingProgress(0);
    setIsCrossing(false);
    
    // Re-announce instruction
    const level = LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0];
    setNarratorBubble(level.instructionText);
    speak("Let's wait for the traffic light to turn green.", true);
  };

  // Crossing complete success
  const handleCrossingComplete = () => {
    stopCarHum();
    playLevelCompleteChime();
    
    const accuracy = Math.max(0, 100 - (mistakesThisRound * 25));
    const starsEarned = accuracy >= 100 ? 5 : accuracy >= 75 ? 4 : accuracy >= 50 ? 3 : 2;
    const coinsEarned = 50 + (starsEarned * 10);

    // Calculate next unlocked level
    const nextLevel = selectedLevelId + 1;
    const newHighestLevel = Math.max(stats.highestLevelReached, nextLevel > 8 ? 8 : nextLevel);

    saveStats({
      ...stats,
      stars: stats.stars + starsEarned,
      coins: stats.coins + coinsEarned,
      balloons: stats.balloons + 1,
      rainbowPoints: stats.rainbowPoints + 20,
      totalCrossings: stats.totalCrossings + 1,
      successfulCrossings: stats.successfulCrossings + 1,
      highestLevelReached: newHighestLevel
    });

    setNarratorBubble("Safe crossing complete! Excellent!");
    speak("Excellent! You crossed safely!", true);
    setShowSuccessModal(true);
  };

  // Navigations from Success Modal
  const handleNextLevel = () => {
    setShowSuccessModal(false);
    const nextId = selectedLevelId + 1;
    if (nextId <= 8) {
      handleStartLevel(nextId);
    } else {
      // Completed all levels! Reveal Master Certificate
      setActiveScreen('menu');
      setShowCertificate(true);
    }
  };

  const handlePlayAgain = () => {
    setShowSuccessModal(false);
    handleStartLevel(selectedLevelId);
  };

  const handleHomeFromPlaying = () => {
    playClick();
    stopCarHum();
    stopSpeaking();
    setActiveScreen('menu');
    setShowSuccessModal(false);
  };

  // Shop Unlock Callbacks
  const handleUnlockCharacter = (id: string, cost: number) => {
    saveStats({
      ...stats,
      coins: stats.coins - cost,
      unlockedCharacters: [...stats.unlockedCharacters, id],
      selectedCharacter: id
    });
  };

  const handleUnlockPet = (id: string, cost: number) => {
    saveStats({
      ...stats,
      coins: stats.coins - cost,
      unlockedPets: [...stats.unlockedPets, id],
      selectedPet: id
    });
  };

  const handleUnlockTheme = (id: string, cost: number) => {
    saveStats({
      ...stats,
      coins: stats.coins - cost,
      unlockedThemes: [...stats.unlockedThemes, id],
      selectedTheme: id
    });
  };

  // Selected wardrobe and companion characters
  const activeChar = CHARACTERS.find(c => c.id === stats.selectedCharacter) || CHARACTERS[0];
  const activePet = PETS.find(p => p.id === stats.selectedPet) || PETS[0];
  const activeTheme = THEMES.find(t => t.id === stats.selectedTheme) || THEMES[0];

  const getTextSizeClass = () => {
    if (settings.textSize === 'large') return 'text-xl md:text-2xl';
    if (settings.textSize === 'extra-large') return 'text-2xl md:text-3xl';
    return 'text-base md:text-lg';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-tr from-[#EFF6FF] via-[#F8FAFC] to-[#F1F5F9] flex flex-col justify-between overflow-x-hidden ${settings.highContrast ? 'contrast-125 saturate-120' : ''}`}>
      
      {/* GLOBAL HEADER BAR */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-3">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleHomeFromPlaying}>
            <div className="bg-[#FF6B6B] text-white w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-[0_4px_0_0_#D64545] shrink-0">
              🏠
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-[#1E293B] uppercase tracking-tight font-sans">
                Traffic Crossing Adventure
              </h1>
              <p className="text-[10px] md:text-xs text-[#64748B] font-bold uppercase">
                Autism-Friendly Safety Game
              </p>
            </div>
          </div>

          {/* Stats Badges Header */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-full border-2 border-[#E2E8F0] flex items-center gap-1.5 font-black text-xs md:text-sm text-[#475569] shadow-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
              <span>⭐ {stats.stars}</span>
            </div>

            <div className="bg-white px-4 py-2 rounded-full border-2 border-[#E2E8F0] flex items-center gap-1.5 font-black text-xs md:text-sm text-[#475569] shadow-sm">
              <Coins className="w-4 h-4 fill-amber-500 text-amber-600 shrink-0" />
              <span>🪙 {stats.coins}</span>
            </div>

            <div className="bg-white px-4 py-2 rounded-full border-2 border-[#E2E8F0] flex items-center gap-1.5 font-black text-xs md:text-sm text-[#475569] shadow-sm">
              <span>🎈</span>
              <span>{stats.balloons} Balloons</span>
            </div>

            {/* Shop Button */}
            <button
              onClick={() => { playClick(); setShowShop(true); }}
              className="bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 text-white font-bold rounded-2xl px-4 py-2 text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              id="header-shop-btn"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Wardrobe</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => { playClick(); setShowSettings(true); }}
              className="bg-white hover:bg-slate-50 border-2 border-[#E2E8F0] text-slate-700 rounded-2xl p-2 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              id="header-settings-btn"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCREEN ROUTING */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">

        {/* SCREEN 1: MAIN MENU (ROAD MAP MAP LEVEL SELECTOR) */}
        {activeScreen === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main-menu-screen">
            
            {/* Left side: Character display and Mascot greetings */}
            <div className="lg:col-span-4 bg-white border-4 border-[#BAE6FD] rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6">
              
              {/* Mascot greeting bubble */}
              <div className="flex gap-3 items-start">
                <div className="w-14 h-14 bg-[#FEF08A] border-2 border-[#FCD34D] rounded-full flex items-center justify-center text-3xl shrink-0 shadow-sm">
                  🦁
                </div>
                <div className="bg-[#FEF08A]/30 border-2 border-[#FCD34D] text-[#1E293B] p-4 rounded-3xl text-xs md:text-sm font-bold relative leading-snug">
                  <p>
                    "Hi Safety Helper! Tap on a road level to start your traffic light crossing adventure. Let's practice together!"
                  </p>
                  <div className="absolute top-4 -left-1.5 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-[#FCD34D] border-b-6 border-b-transparent" />
                </div>
              </div>

              {/* Character Costume Preview grass patch */}
              <div className="border-4 border-[#E2E8F0] rounded-3xl p-4 bg-gradient-to-b from-[#BAE6FD] to-[#E0F2FE] overflow-hidden relative shadow-inner h-56 flex flex-col justify-end items-center">
                {/* Sun */}
                <div className="absolute top-2 right-4 text-3xl animate-pulse">☀️</div>
                {/* Floating Clouds */}
                <div className="absolute top-4 left-4 text-xl opacity-60">☁️</div>

                {/* The Character preview */}
                <div className="relative flex flex-col items-center justify-center translate-y-3 z-10">
                  <div className="relative animate-bounce">
                    <div className={`w-14 h-14 rounded-full border-4 border-[#1E293B] ${activeChar.color} flex items-center justify-center shadow-lg relative`}>
                      <span className="text-4xl mt-1">{activeChar.emoji}</span>
                    </div>
                    <span className="absolute -right-2 -top-1 text-base">🎒</span>
                  </div>

                  {/* Pet preview */}
                  {activePet.id !== 'none' && (
                    <div className="absolute -left-10 bottom-0 text-3xl animate-bounce" style={{ animationDelay: '100ms' }}>
                      {activePet.emoji}
                    </div>
                  )}
                </div>

                {/* Ground */}
                <div className="w-full h-12 bg-[#86EFAC] border-t-4 border-[#4ADE80] absolute bottom-0 inset-x-0" />
              </div>

              {/* Stats Review Card */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-[#E2E8F0] space-y-2">
                <p className="text-xs font-black uppercase text-[#64748B] tracking-wider">My Progress Report</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#1E293B]">
                  <div>Crossings: <span className="text-emerald-600 font-extrabold">{stats.successfulCrossings}</span></div>
                  <div>Mistakes: <span className="text-red-500 font-extrabold">{stats.totalMistakes}</span></div>
                  <div className="col-span-2 pt-1 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                    <span>Certificate Unlocked:</span>
                    <span className="text-indigo-600">{stats.highestLevelReached >= 8 ? '✅ Ready!' : '🔒 Locked'}</span>
                  </div>
                </div>

                {/* Certificate shortcut if completed */}
                {stats.highestLevelReached >= 8 && (
                  <button
                    onClick={() => { playClick(); setShowCertificate(true); }}
                    className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    Show My Diploma! 📜
                  </button>
                )}
              </div>
            </div>

            {/* Right side: LEVEL MAP ROADWAY TRAIL */}
            <div className="lg:col-span-8 bg-white border-4 border-[#BAE6FD] rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl md:text-2xl font-black text-[#1E293B] mb-6 flex items-center gap-2">
                🛣️ Select a Safety Mission
              </h2>

              {/* The Level Pathway Map Grid */}
              <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="level-map-container">
                {LEVELS.map((level) => {
                  const isUnlocked = level.id <= stats.highestLevelReached;
                  const isCompleted = level.id < stats.highestLevelReached;
                  const isActiveNext = level.id === stats.highestLevelReached;

                  return (
                    <button
                      key={level.id}
                      onClick={() => isUnlocked && handleStartLevel(level.id)}
                      disabled={!isUnlocked}
                      className={`relative rounded-2xl p-5 border-4 flex flex-col justify-between items-start text-left h-44 transition-all cursor-pointer ${
                        isActiveNext
                          ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-sm ring-4 ring-[#3B82F6]/20 scale-[1.01] hover:scale-[1.03] animate-pulse'
                          : isCompleted
                          ? 'bg-[#ECFDF5] border-[#10B981] hover:bg-[#F0FDF4]'
                          : isUnlocked
                          ? 'bg-white border-[#E2E8F0] hover:border-slate-300'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60 cursor-not-allowed'
                      }`}
                      id={`level-card-${level.id}`}
                    >
                      {/* Top Row inside Card */}
                      <div className="flex justify-between items-center w-full mb-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                          isActiveNext
                            ? 'bg-indigo-500 text-white border-indigo-600'
                            : isCompleted
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {level.id}
                        </span>

                        {/* Lock / Check Icon */}
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 shrink-0" />
                        ) : !isUnlocked ? (
                          <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : isActiveNext ? (
                          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full animate-bounce">Play!</span>
                        ) : null}
                      </div>

                      {/* Title & description inside Card */}
                      <div>
                        <h3 className="font-extrabold text-[#1E293B] text-sm md:text-base leading-tight mb-1">
                          {level.name.replace(/Level \d+: /, '')}
                        </h3>
                        <p className="text-xs text-[#64748B] font-sans leading-snug">
                          {isUnlocked ? level.instructionText.split('!')[0] + '!' : 'Complete previous levels to unlock'}
                        </p>
                      </div>

                      {/* Base Tag */}
                      <div className="mt-2 w-full text-right text-[10px] font-bold uppercase text-[#94A3B8]">
                        {level.focusSignal ? `Focus: ${level.focusSignal}` : 'Mixed signal practice'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick instructions/Legends */}
              <div className="mt-6 flex gap-4 items-center flex-wrap justify-between p-3.5 bg-[#F8FAFC] rounded-2xl border-2 border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Complete Levels
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" /> Active Level
                  <span className="w-3 h-3 rounded-full bg-slate-200" /> Locked Mission
                </div>
                <span>🎯 Clear Level 8 to earn your printed Diploma!</span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: THE ACTIVE GAMEPLAY INTERACTION */}
        {activeScreen === 'playing' && (
          <div className="flex flex-col gap-5 md:gap-6" id="active-gameplay-screen">
            
            {/* Split Grid Layout: Columns side-by-side on laptop/desktop, stacked on mobile/tablet */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-stretch">
              
              {/* LEFT COLUMN: Back Nav and Road Scene (Spans 8 of 12 columns on large screen) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* Clean, Premium Back Nav Bar */}
                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm relative z-10">
                  <button
                    onClick={handleHomeFromPlaying}
                    className="py-2.5 px-4.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 font-extrabold text-xs md:text-sm flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm"
                    id="back-to-map-btn"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Map
                  </button>
                  
                  <div className="flex items-center gap-2 font-black text-xs md:text-sm text-indigo-600 bg-indigo-50/70 border border-indigo-100/80 px-3.5 py-1.5 rounded-xl">
                    <span>🎯 Mission {selectedLevelId}</span>
                    <span className="text-[#64748B] font-bold">•</span>
                    <span className="text-slate-600 font-bold">
                      {LEVELS.find(l => l.id === selectedLevelId)?.focusSignal ? `Focus: ${LEVELS.find(l => l.id === selectedLevelId)?.focusSignal}` : 'Mixed Signal Practice'}
                    </span>
                  </div>
                </div>

                {/* Animated Road Scene */}
                <RoadScene
                  currentLight={currentLight}
                  settings={settings}
                  level={LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0]}
                  characterEmoji={activeChar.emoji}
                  characterColor={activeChar.color}
                  petEmoji={activePet.emoji}
                  themeId={activeTheme.id}
                  isCrossing={isCrossing}
                  crossingProgress={crossingProgress}
                  policeIntervention={policeIntervention}
                  onChildReachedOtherSide={handleCrossingComplete}
                  onPoliceStopComplete={handlePoliceStopComplete}
                />
              </div>

              {/* RIGHT COLUMN: Leo Guide & Giant Control Buttons (Spans 4 of 12 columns) */}
              <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                
                {/* Leo Narrator Guide Bubble Card */}
                <div className="bg-white border-2 border-indigo-100 p-4.5 rounded-2xl flex flex-col gap-3 shadow-sm text-left justify-center flex-1 min-h-[110px]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const level = LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0];
                        speak(level.voiceText, true);
                      }}
                      className="w-10 h-10 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center cursor-pointer shadow-sm shrink-0 transition-colors"
                      title="Speak instruction out loud"
                      id="speak-guidance-btn"
                    >
                      <Volume2 className="w-5 h-5 shrink-0 animate-pulse" />
                    </button>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
                        🔊 Leo's Instruction
                      </p>
                    </div>
                  </div>
                  
                  <p className={`font-black text-[#1E293B] leading-snug tracking-tight ${getTextSizeClass()}`} id="instruction-board-text">
                    {narratorBubble}
                  </p>
                </div>

                {/* The 3 Clean-Minimalism Tactile Action Buttons (Flexible grid format) */}
                <div 
                  className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5" 
                  id="gameplay-action-buttons-grid"
                >
                  {/* Button 1: RED STOP */}
                  <div className="relative group h-20 sm:h-28 lg:h-24 select-none">
                    <div className="absolute inset-0 bg-red-700 rounded-2xl"></div>
                    <button
                      onClick={handleStopAction}
                      disabled={isCrossing || policeIntervention}
                      className={`relative -top-1.5 hover:-top-1 active:top-0 w-full h-full bg-[#EF4444] rounded-2xl border-2 border-red-700 flex flex-row sm:flex-col lg:flex-row items-center justify-start sm:justify-center lg:justify-start px-5 sm:px-2 lg:px-6 gap-3 sm:gap-1 lg:gap-4 transition-all duration-150 disabled:opacity-50 disabled:-top-1.5 cursor-pointer select-none ${
                        currentLight === 'red' ? 'ring-4 ring-red-400/30 scale-[1.01]' : 'opacity-80'
                      }`}
                      style={{ contentVisibility: 'auto' }}
                      id="action-btn-stop"
                    >
                      <span className="text-3xl sm:text-2xl lg:text-3xl filter drop-shadow">🛑</span>
                      <div className="text-left sm:text-center lg:text-left">
                        <span className="text-white text-base sm:text-xs lg:text-lg font-black uppercase tracking-wider block leading-none">STOP</span>
                        <span className="text-[10px] text-red-100 font-sans tracking-normal opacity-85 mt-1 sm:hidden lg:block">
                          Press on Red Light
                        </span>
                      </div>
                      
                      {/* Integrated Voice Assist Speaker */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          speak("STOP! Red light means STOP!", true);
                        }}
                        className="absolute right-3.5 top-3.5 sm:right-2 sm:top-2 lg:right-4 lg:top-4 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-sm"
                        title="Read STOP out loud"
                        id="speak-action-stop"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            playClick();
                            speak("STOP! Red light means STOP!", true);
                          }
                        }}
                      >
                        <Volume2 className="w-4 h-4 shrink-0" />
                      </span>
                    </button>
                  </div>

                  {/* Button 2: YELLOW WAIT */}
                  <div className="relative group h-20 sm:h-28 lg:h-24 select-none">
                    <div className="absolute inset-0 bg-amber-700 rounded-2xl"></div>
                    <button
                      onClick={handleWaitAction}
                      disabled={isCrossing || policeIntervention}
                      className={`relative -top-1.5 hover:-top-1 active:top-0 w-full h-full bg-[#F59E0B] rounded-2xl border-2 border-amber-700 flex flex-row sm:flex-col lg:flex-row items-center justify-start sm:justify-center lg:justify-start px-5 sm:px-2 lg:px-6 gap-3 sm:gap-1 lg:gap-4 transition-all duration-150 disabled:opacity-50 disabled:-top-1.5 cursor-pointer select-none ${
                        currentLight === 'yellow' ? 'ring-4 ring-amber-400/30 scale-[1.01]' : 'opacity-80'
                      }`}
                      style={{ contentVisibility: 'auto' }}
                      id="action-btn-wait"
                    >
                      <span className="text-3xl sm:text-2xl lg:text-3xl filter drop-shadow">⏳</span>
                      <div className="text-left sm:text-center lg:text-left">
                        <span className="text-white text-base sm:text-xs lg:text-lg font-black uppercase tracking-wider block leading-none">WAIT</span>
                        <span className="text-[10px] text-amber-50 font-sans tracking-normal opacity-85 mt-1 sm:hidden lg:block">
                          Press on Yellow Light
                        </span>
                      </div>

                      {/* Integrated Voice Assist Speaker */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          speak("WAIT! Yellow light means WAIT!", true);
                        }}
                        className="absolute right-3.5 top-3.5 sm:right-2 sm:top-2 lg:right-4 lg:top-4 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-sm"
                        title="Read WAIT out loud"
                        id="speak-action-wait"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            playClick();
                            speak("WAIT! Yellow light means WAIT!", true);
                          }
                        }}
                      >
                        <Volume2 className="w-4 h-4 shrink-0" />
                      </span>
                    </button>
                  </div>

                  {/* Button 3: GREEN CROSS */}
                  <div className="relative group h-20 sm:h-28 lg:h-24 select-none">
                    <div className="absolute inset-0 bg-emerald-700 rounded-2xl"></div>
                    <button
                      onClick={handleCrossAction}
                      disabled={isCrossing || policeIntervention}
                      className={`relative -top-1.5 hover:-top-1 active:top-0 w-full h-full bg-[#10B981] rounded-2xl border-2 border-emerald-700 flex flex-row sm:flex-col lg:flex-row items-center justify-start sm:justify-center lg:justify-start px-5 sm:px-2 lg:px-6 gap-3 sm:gap-1 lg:gap-4 transition-all duration-150 disabled:opacity-50 disabled:-top-1.5 cursor-pointer select-none ${
                        currentLight === 'green' ? 'ring-4 ring-emerald-400/30 scale-[1.01]' : 'opacity-80'
                      }`}
                      style={{ contentVisibility: 'auto' }}
                      id="action-btn-cross"
                    >
                      <span className="text-3xl sm:text-2xl lg:text-3xl filter drop-shadow">🚶</span>
                      <div className="text-left sm:text-center lg:text-left">
                        <span className="text-white text-base sm:text-xs lg:text-lg font-black uppercase tracking-wider block leading-none">CROSS</span>
                        <span className="text-[10px] text-emerald-100 font-sans tracking-normal opacity-85 mt-1 sm:hidden lg:block">
                          Press on Green Light
                        </span>
                      </div>

                      {/* Integrated Voice Assist Speaker */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          speak("CROSS! Green light means CROSS!", true);
                        }}
                        className="absolute right-3.5 top-3.5 sm:right-2 sm:top-2 lg:right-4 lg:top-4 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-sm"
                        title="Read CROSS out loud"
                        id="speak-action-cross"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            playClick();
                            speak("CROSS! Green light means CROSS!", true);
                          }
                        }}
                      >
                        <Volume2 className="w-4 h-4 shrink-0" />
                      </span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* FOOTER ACCREDITATION */}
      <footer className="py-4 border-t-2 border-slate-200 bg-white text-center text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Traffic Light Crossing Adventure. Developed with care for autism learning centers.</p>
          <div className="flex gap-4 font-bold text-indigo-500">
            <button onClick={() => { playClick(); setShowSettings(true); }} className="hover:underline cursor-pointer">Accessibility</button>
            <span>•</span>
            <button onClick={() => { playClick(); setShowShop(true); }} className="hover:underline cursor-pointer">Unlocks Shop</button>
          </div>
        </div>
      </footer>

      {/* MODAL WINDOWS OVERLAYS */}

      {/* 1. Success level complete overlay */}
      {showSuccessModal && (
        <EndOfRound
          levelNumber={selectedLevelId}
          levelName={LEVELS.find(l => l.id === selectedLevelId)?.name || ''}
          starsEarned={Math.max(0, 100 - (mistakesThisRound * 25)) >= 100 ? 5 : Math.max(0, 100 - (mistakesThisRound * 25)) >= 75 ? 4 : 3}
          coinsEarned={50 + (Math.max(0, 100 - (mistakesThisRound * 25)) >= 100 ? 50 : 20)}
          accuracy={Math.max(0, 100 - (mistakesThisRound * 25))}
          settings={settings}
          onNextLevel={handleNextLevel}
          onPlayAgain={handlePlayAgain}
          onHome={handleHomeFromPlaying}
        />
      )}

      {/* 2. Wardrobe shop overlay */}
      {showShop && (
        <UnlocksShop
          coins={stats.coins}
          unlockedCharacters={stats.unlockedCharacters}
          unlockedPets={stats.unlockedPets}
          unlockedThemes={stats.unlockedThemes}
          selectedCharacter={stats.selectedCharacter}
          selectedPet={stats.selectedPet}
          selectedTheme={stats.selectedTheme}
          settings={settings}
          onUnlockCharacter={handleUnlockCharacter}
          onUnlockPet={handleUnlockPet}
          onUnlockTheme={handleUnlockTheme}
          onSelectCharacter={(id) => saveStats({ ...stats, selectedCharacter: id })}
          onSelectPet={(id) => saveStats({ ...stats, selectedPet: id })}
          onSelectTheme={(id) => saveStats({ ...stats, selectedTheme: id })}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* 3. Settings panel overlay */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={saveSettings}
          onResetProgress={handleResetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 4. Triumphant Safe Master Certificate overlay */}
      {showCertificate && (
        <MasterCertificate
          stars={stats.stars}
          coins={stats.coins}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
