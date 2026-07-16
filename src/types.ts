export type Difficulty = 'easy' | 'medium' | 'hard';

export type TrafficLightState = 'red' | 'yellow' | 'green';

export interface Character {
  id: string;
  name: string;
  color: string;
  accessory: string;
  unlocked: boolean;
  costCoins: number;
  emoji: string;
}

export interface Pet {
  id: string;
  name: string;
  unlocked: boolean;
  costCoins: number;
  emoji: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  bgClass: string;
  skyClass: string;
  sidewalkClass: string;
  unlocked: boolean;
  costCoins: number;
  emoji: string;
}

export interface AccessibilitySettings {
  voiceGuidance: boolean;
  soundEffects: boolean;
  backgroundMusic: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: 'normal' | 'large' | 'extra-large';
}

export interface GameStats {
  level: number;
  stars: number;
  coins: number;
  balloons: number;
  rainbowPoints: number;
  unlockedCharacters: string[];
  unlockedPets: string[];
  unlockedThemes: string[];
  selectedCharacter: string;
  selectedPet: string;
  selectedTheme: string;
  totalCrossings: number;
  successfulCrossings: number;
  totalMistakes: number;
  highestLevelReached: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  instructionText: string;
  voiceText: string;
  carCount: number;
  carSpeed: number; // multiplier
  lightDuration: { red: number; yellow: number; green: number }; // in milliseconds
  mixedSignals: boolean;
  focusSignal?: TrafficLightState; // If specified, level teaches a single signal first
}
