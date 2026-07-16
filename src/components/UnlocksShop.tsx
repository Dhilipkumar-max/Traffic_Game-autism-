import { useState } from 'react';
import { Character, Pet, ThemeConfig, AccessibilitySettings } from '../types';
import { CHARACTERS, PETS, THEMES } from '../lib/gameData';
import { Sparkles, Coins, Check, Lock, ShoppingBag, Eye, User } from 'lucide-react';
import { playClick, playSuccessChime } from '../lib/audio';

interface UnlocksShopProps {
  coins: number;
  unlockedCharacters: string[];
  unlockedPets: string[];
  unlockedThemes: string[];
  selectedCharacter: string;
  selectedPet: string;
  selectedTheme: string;
  settings: AccessibilitySettings;
  onUnlockCharacter: (id: string, cost: number) => void;
  onUnlockPet: (id: string, cost: number) => void;
  onUnlockTheme: (id: string, cost: number) => void;
  onSelectCharacter: (id: string) => void;
  onSelectPet: (id: string) => void;
  onSelectTheme: (id: string) => void;
  onClose: () => void;
}

type ShopTab = 'characters' | 'pets' | 'themes';

export default function UnlocksShop({
  coins,
  unlockedCharacters,
  unlockedPets,
  unlockedThemes,
  selectedCharacter,
  selectedPet,
  selectedTheme,
  settings,
  onUnlockCharacter,
  onUnlockPet,
  onUnlockTheme,
  onSelectCharacter,
  onSelectPet,
  onSelectTheme,
  onClose,
}: UnlocksShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('characters');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000);
  };

  const handleCharacterAction = (char: Character) => {
    playClick();
    const isUnlocked = unlockedCharacters.includes(char.id);
    if (isUnlocked) {
      onSelectCharacter(char.id);
    } else {
      if (coins >= char.costCoins) {
        onUnlockCharacter(char.id, char.costCoins);
        playSuccessChime();
      } else {
        triggerError(`Need ${char.costCoins - coins} more coins to unlock ${char.name}!`);
      }
    }
  };

  const handlePetAction = (pet: Pet) => {
    playClick();
    const isUnlocked = unlockedPets.includes(pet.id);
    if (isUnlocked) {
      onSelectPet(pet.id);
    } else {
      if (coins >= pet.costCoins) {
        onUnlockPet(pet.id, pet.costCoins);
        playSuccessChime();
      } else {
        triggerError(`Need ${pet.costCoins - coins} more coins to unlock ${pet.name}!`);
      }
    }
  };

  const handleThemeAction = (theme: ThemeConfig) => {
    playClick();
    const isUnlocked = unlockedThemes.includes(theme.id);
    if (isUnlocked) {
      onSelectTheme(theme.id);
    } else {
      if (coins >= theme.costCoins) {
        onUnlockTheme(theme.id, theme.costCoins);
        playSuccessChime();
      } else {
        triggerError(`Need ${theme.costCoins - coins} more coins to unlock ${theme.name}!`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl rounded-3xl bg-white border-4 border-[#BAE6FD] p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]"
        id="shop-modal"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            playClick();
            onClose();
          }}
          className="absolute right-6 top-6 w-11 h-11 flex items-center justify-center rounded-full bg-red-50 text-red-600 border-2 border-red-200 font-bold text-lg hover:bg-red-100 transition-all cursor-pointer shadow-sm"
          id="close-shop-btn"
        >
          ✕
        </button>

        {/* Header with Coin Count */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6 pr-12">
          <div>
            <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight font-sans flex items-center gap-2">
              🎒 <span>Shop & Wardrobe</span>
            </h2>
            <p className="text-sm text-[#64748B]">Dress up your character and choose your road companion!</p>
          </div>
          
          <div className="bg-white px-4 py-2 rounded-full border-2 border-[#E2E8F0] flex items-center gap-2 font-black text-[#475569] shadow-sm shrink-0">
            <Coins className="w-6 h-6 animate-pulse text-yellow-500" />
            <span className="text-xl">🪙 {coins}</span>
          </div>
        </div>

        {/* Floating Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold rounded-2xl text-center animate-bounce shadow-sm">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Shop Tabs */}
        <div className="flex bg-[#F8FAFC] p-1.5 rounded-2xl gap-1 mb-6 border-2 border-[#E2E8F0]">
          <button
            onClick={() => { playClick(); setActiveTab('characters'); }}
            className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
            id="tab-characters-btn"
          >
            🧒 Characters
          </button>
          
          <button
            onClick={() => { playClick(); setActiveTab('pets'); }}
            className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pets'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
            id="tab-pets-btn"
          >
            🐰 Pets
          </button>

          <button
            onClick={() => { playClick(); setActiveTab('themes'); }}
            className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
            id="tab-themes-btn"
          >
            🌆 Themes
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[350px] overflow-y-auto pr-2">
          
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' && CHARACTERS.map((char) => {
            const isUnlocked = unlockedCharacters.includes(char.id);
            const isEquipped = selectedCharacter === char.id;

            return (
              <div
                key={char.id}
                className={`p-4 rounded-2xl border-4 transition-all duration-300 flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-[#ECFDF5] border-[#10B981] shadow-sm'
                    : isUnlocked
                    ? 'bg-white border-[#E2E8F0] hover:border-slate-300'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]/80 opacity-95'
                }`}
              >
                <div className="flex gap-3 items-center mb-4">
                  {/* Big Character Avatar Display */}
                  <div className={`w-16 h-16 rounded-2xl border-4 border-[#1E293B] ${char.color} flex items-center justify-center text-4xl shadow-sm`}>
                    {char.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1E293B] flex items-center gap-1.5">
                      {char.name}
                      {isUnlocked && <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />}
                    </h3>
                    <p className="text-xs text-[#64748B] font-sans">{char.accessory}</p>
                  </div>
                </div>

                {/* Card Button Action */}
                <button
                  onClick={() => handleCharacterAction(char)}
                  className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-500 text-white cursor-default border-b-4 border-emerald-700'
                      : isUnlocked
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-b-4 border-indigo-700'
                      : 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-b-4 border-amber-500'
                  }`}
                >
                  {isEquipped ? (
                    <>Active Outfit</>
                  ) : isUnlocked ? (
                    'Wear Outfit 🎒'
                  ) : (
                    <>🪙 Unlock {char.costCoins}</>
                  )}
                </button>
              </div>
            );
          })}

          {/* TAB 2: PETS */}
          {activeTab === 'pets' && PETS.map((pet) => {
            const isUnlocked = unlockedPets.includes(pet.id);
            const isEquipped = selectedPet === pet.id;

            return (
              <div
                key={pet.id}
                className={`p-4 rounded-2xl border-4 transition-all duration-300 flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-[#ECFDF5] border-[#10B981] shadow-sm'
                    : isUnlocked
                    ? 'bg-white border-[#E2E8F0] hover:border-slate-300'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]/80 opacity-95'
                }`}
              >
                <div className="flex gap-3 items-center mb-4">
                  {/* Big Pet Avatar Display */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border-4 border-[#E2E8F0] flex items-center justify-center text-4xl shadow-sm">
                    {pet.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1E293B] flex items-center gap-1.5">
                      {pet.name}
                      {isUnlocked && <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />}
                    </h3>
                    <p className="text-xs text-[#64748B] font-sans">
                      {pet.id === 'none' ? 'No companion' : 'Walks right beside you!'}
                    </p>
                  </div>
                </div>

                {/* Card Button Action */}
                <button
                  onClick={() => handlePetAction(pet)}
                  className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-500 text-white cursor-default border-b-4 border-emerald-700'
                      : isUnlocked
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-b-4 border-indigo-700'
                      : 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-b-4 border-amber-500'
                  }`}
                >
                  {isEquipped ? (
                    <>Equipped</>
                  ) : isUnlocked ? (
                    'Equip Pet 🐾'
                  ) : (
                    <>🪙 Unlock {pet.costCoins}</>
                  )}
                </button>
              </div>
            );
          })}

          {/* TAB 3: THEMES */}
          {activeTab === 'themes' && THEMES.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isEquipped = selectedTheme === theme.id;

            return (
              <div
                key={theme.id}
                className={`p-4 rounded-2xl border-4 transition-all duration-300 flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-[#ECFDF5] border-[#10B981] shadow-sm'
                    : isUnlocked
                    ? 'bg-white border-[#E2E8F0] hover:border-slate-300'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]/80 opacity-95'
                }`}
              >
                <div className="flex gap-3 items-center mb-4">
                  {/* Theme display emoji */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border-4 border-[#E2E8F0] flex items-center justify-center text-4xl shadow-sm">
                    {theme.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1E293B] flex items-center gap-1.5">
                      {theme.name}
                      {isUnlocked && <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />}
                    </h3>
                    <p className="text-xs text-[#64748B] font-sans">Updates background town graphics</p>
                  </div>
                </div>

                {/* Card Button Action */}
                <button
                  onClick={() => handleThemeAction(theme)}
                  className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-500 text-white cursor-default border-b-4 border-emerald-700'
                      : isUnlocked
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-b-4 border-indigo-700'
                      : 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-b-4 border-amber-500'
                  }`}
                >
                  {isEquipped ? (
                    <>Active Theme</>
                  ) : isUnlocked ? (
                    'Apply Theme 🌇'
                  ) : (
                    <>🪙 Unlock {theme.costCoins}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Tip Box */}
        <div className="mt-6 p-4 bg-indigo-50 border-2 border-indigo-100 text-indigo-950 font-medium rounded-2xl text-center text-xs md:text-sm">
          💡 Tip: Earn lots of coins by crossing safely in higher levels!
        </div>
      </div>
    </div>
  );
}
