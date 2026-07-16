import { LevelConfig, Character, Pet, ThemeConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Level 1: Learn Red 🔴",
    instructionText: "The light is RED! Press STOP to wait safely.",
    voiceText: "The traffic light is red. Let's press STOP to wait safely on the sidewalk.",
    carCount: 1,
    carSpeed: 0.6,
    lightDuration: { red: 8000, yellow: 0, green: 0 },
    mixedSignals: false,
    focusSignal: 'red'
  },
  {
    id: 2,
    name: "Level 2: Learn Yellow 🟡",
    instructionText: "The light is YELLOW! Press WAIT while cars slow down.",
    voiceText: "The traffic light is yellow. Press WAIT while the cars slow down.",
    carCount: 1,
    carSpeed: 0.7,
    lightDuration: { red: 0, yellow: 8000, green: 0 },
    mixedSignals: false,
    focusSignal: 'yellow'
  },
  {
    id: 3,
    name: "Level 3: Learn Green 🟢",
    instructionText: "The light is GREEN! Press CROSS to walk safely.",
    voiceText: "The traffic light is green! The cars are stopped. Press CROSS to walk safely.",
    carCount: 1,
    carSpeed: 0.7,
    lightDuration: { red: 0, yellow: 0, green: 8000 },
    mixedSignals: false,
    focusSignal: 'green'
  },
  {
    id: 4,
    name: "Level 4: Mixed Signals 🚥",
    instructionText: "Signals change! Press STOP for Red, WAIT for Yellow, and CROSS for Green.",
    voiceText: "Great! Now the signals will change automatically. Watch carefully and press the right buttons!",
    carCount: 2,
    carSpeed: 0.8,
    lightDuration: { red: 6000, yellow: 4000, green: 6000 },
    mixedSignals: true
  },
  {
    id: 5,
    name: "Level 5: Busy Road 🚗🚙",
    instructionText: "Watch the busy road! Press STOP, WAIT, and CROSS matching the lights.",
    voiceText: "The road is getting busier. Watch the traffic light and stay safe!",
    carCount: 3,
    carSpeed: 0.9,
    lightDuration: { red: 5000, yellow: 3500, green: 5000 },
    mixedSignals: true
  },
  {
    id: 6,
    name: "Level 6: School Crossing 🏫🚌",
    instructionText: "School Zone! Be extremely careful near buses.",
    voiceText: "Look, we are near a school! Stay on the sidewalk until the light turns green.",
    carCount: 3,
    carSpeed: 0.9,
    lightDuration: { red: 6000, yellow: 4000, green: 6000 },
    mixedSignals: true
  },
  {
    id: 7,
    name: "Level 7: City Crossing 🏙️🚕",
    instructionText: "City signals change faster. Stay alert!",
    voiceText: "Welcome to the big city! The lights change a bit faster here. Keep watching closely.",
    carCount: 4,
    carSpeed: 1.1,
    lightDuration: { red: 4500, yellow: 3000, green: 5000 },
    mixedSignals: true
  },
  {
    id: 8,
    name: "Level 8: Road Safety Master 🏆🎖️",
    instructionText: "Show your safety skills! Cross the busiest road to win your certificate!",
    voiceText: "This is the final test! Help your character cross this very busy road safely and become a Road Safety Master!",
    carCount: 4,
    carSpeed: 1.2,
    lightDuration: { red: 5000, yellow: 3500, green: 5000 },
    mixedSignals: true
  }
];

export const CHARACTERS: Character[] = [
  {
    id: "alex",
    name: "Alex",
    color: "bg-amber-400 border-amber-500",
    accessory: "🎒 Red Backpack",
    unlocked: true,
    costCoins: 0,
    emoji: "🧒"
  },
  {
    id: "lily",
    name: "Lily",
    color: "bg-pink-400 border-pink-500",
    accessory: "🎀 Pink Bow",
    unlocked: false,
    costCoins: 100,
    emoji: "👧"
  },
  {
    id: "leo",
    name: "Leo",
    color: "bg-green-400 border-green-500",
    accessory: "🦖 Dino Hoodie",
    unlocked: false,
    costCoins: 200,
    emoji: "👦"
  },
  {
    id: "mia",
    name: "Mia",
    color: "bg-indigo-400 border-indigo-500",
    accessory: "🚀 Space Cap",
    unlocked: false,
    costCoins: 300,
    emoji: "👩‍🚀"
  }
];

export const PETS: Pet[] = [
  {
    id: "none",
    name: "No Pet",
    unlocked: true,
    costCoins: 0,
    emoji: "❌"
  },
  {
    id: "pippy",
    name: "Pippy the Bunny",
    unlocked: false,
    costCoins: 120,
    emoji: "🐰"
  },
  {
    id: "rex",
    name: "Rex the Puppy",
    unlocked: false,
    costCoins: 250,
    emoji: "🐶"
  },
  {
    id: "luna",
    name: "Luna the Kitten",
    unlocked: false,
    costCoins: 250,
    emoji: "🐱"
  },
  {
    id: "bubbles",
    name: "Bubbles the Duck",
    unlocked: false,
    costCoins: 150,
    emoji: "🦆"
  }
];

export const THEMES: ThemeConfig[] = [
  {
    id: "sunny",
    name: "Sunny Town",
    bgClass: "bg-sky-100",
    skyClass: "from-sky-300 to-sky-100",
    sidewalkClass: "bg-neutral-300 border-neutral-400",
    unlocked: true,
    costCoins: 0,
    emoji: "☀️"
  },
  {
    id: "sunset",
    name: "Sunset Boulevard",
    bgClass: "bg-orange-100",
    skyClass: "from-orange-300 via-rose-200 to-amber-100",
    sidewalkClass: "bg-amber-200 border-amber-300",
    unlocked: false,
    costCoins: 150,
    emoji: "🌇"
  },
  {
    id: "rainbow",
    name: "Rainbow Valley",
    bgClass: "bg-purple-50",
    skyClass: "from-fuchsia-200 via-indigo-100 to-pink-100",
    sidewalkClass: "bg-pink-100 border-pink-200",
    unlocked: false,
    costCoins: 250,
    emoji: "🌈"
  },
  {
    id: "school",
    name: "School Zone",
    bgClass: "bg-emerald-50",
    skyClass: "from-teal-200 to-emerald-50",
    sidewalkClass: "bg-slate-300 border-slate-400",
    unlocked: false,
    costCoins: 200,
    emoji: "🏫"
  }
];
