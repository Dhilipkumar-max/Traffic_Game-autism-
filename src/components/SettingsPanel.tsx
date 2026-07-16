import { AccessibilitySettings } from '../types';
import { Volume2, VolumeX, User, HelpCircle, Eye, RefreshCw, Sparkles, Smile } from 'lucide-react';
import { playClick } from '../lib/audio';

interface SettingsPanelProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: AccessibilitySettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose,
}: SettingsPanelProps) {

  const handleToggle = (key: keyof AccessibilitySettings) => {
    playClick();
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleTextSize = (size: 'normal' | 'large' | 'extra-large') => {
    playClick();
    onUpdateSettings({
      ...settings,
      textSize: size,
    });
  };

  const getButtonClass = (active: boolean) => {
    return `relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
      active
        ? 'bg-indigo-50 border-indigo-500 text-[#1E293B] shadow-sm'
        : 'bg-white border-[#E2E8F0] text-neutral-700 hover:border-slate-300'
    }`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white border-4 border-[#BAE6FD] p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]"
        id="settings-panel-modal"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight font-sans text-[#1E293B] flex items-center gap-3">
            ⚙️ <span>Settings</span>
          </h2>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-red-50 text-red-600 border-2 border-red-200 font-bold text-lg hover:bg-red-100 transition-all cursor-pointer shadow-sm"
            id="close-settings-btn"
          >
            ✕
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 rounded-2xl bg-[#FEF08A]/10 border-2 border-[#FEF08A] text-[#1E293B] flex items-start gap-3">
          <Smile className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm md:text-base font-bold">
            These friendly settings are designed for children who prefer softer sounds, larger text, clearer guidance, or slower movements.
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {/* Voice Guidance */}
          <button
            onClick={() => handleToggle('voiceGuidance')}
            className={getButtonClass(settings.voiceGuidance)}
            id="toggle-voice-btn"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl">🗣️</span>
              <div>
                <p className="font-extrabold text-base md:text-lg text-[#1E293B]">Friendly Voice Guidance</p>
                <p className="text-xs text-[#64748B]">The game reads out signals and safety tips</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${settings.voiceGuidance ? 'bg-[#10B981] border-emerald-600 text-white' : 'bg-neutral-50 border-[#E2E8F0] text-neutral-400'}`}>
              {settings.voiceGuidance ? '✓' : '✗'}
            </div>
          </button>

          {/* Sound Effects */}
          <button
            onClick={() => handleToggle('soundEffects')}
            className={getButtonClass(settings.soundEffects)}
            id="toggle-sounds-btn"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl">🔊</span>
              <div>
                <p className="font-extrabold text-base md:text-lg text-[#1E293B]">Game Sounds</p>
                <p className="text-xs text-[#64748B]">Play sweet music, vehicle hums, and reward chimes</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${settings.soundEffects ? 'bg-[#10B981] border-emerald-600 text-white' : 'bg-neutral-50 border-[#E2E8F0] text-neutral-400'}`}>
              {settings.soundEffects ? '✓' : '✗'}
            </div>
          </button>

          {/* Reduced Motion */}
          <button
            onClick={() => handleToggle('reducedMotion')}
            className={getButtonClass(settings.reducedMotion)}
            id="toggle-motion-btn"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl">💤</span>
              <div>
                <p className="font-extrabold text-base md:text-lg text-[#1E293B]">Soft Movement</p>
                <p className="text-xs text-[#64748B]">Stops fast background animations and floating clouds</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${settings.reducedMotion ? 'bg-[#10B981] border-emerald-600 text-white' : 'bg-neutral-50 border-[#E2E8F0] text-neutral-400'}`}>
              {settings.reducedMotion ? '✓' : '✗'}
            </div>
          </button>

          {/* High Contrast Mode */}
          <button
            onClick={() => handleToggle('highContrast')}
            className={getButtonClass(settings.highContrast)}
            id="toggle-contrast-btn"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl">🌓</span>
              <div>
                <p className="font-extrabold text-base md:text-lg text-[#1E293B]">High Contrast Mode</p>
                <p className="text-xs text-[#64748B]">Makes text and light signals stand out with thick lines</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${settings.highContrast ? 'bg-[#10B981] border-emerald-600 text-white' : 'bg-neutral-50 border-[#E2E8F0] text-neutral-400'}`}>
              {settings.highContrast ? '✓' : '✗'}
            </div>
          </button>

          {/* Text Size Selection */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#E2E8F0]">
            <p className="font-extrabold text-[#1E293B] text-base md:text-lg mb-3 flex items-center gap-2">
              <span>🔤</span> Text Size (Font Size)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extra-large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleTextSize(size)}
                  className={`py-3 px-2 rounded-xl font-bold border-2 text-xs md:text-sm capitalize transition-all cursor-pointer ${
                    settings.textSize === size
                      ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
                  }`}
                  id={`text-size-${size}-btn`}
                >
                  {size === 'normal' && 'Normal'}
                  {size === 'large' && 'Large 🔤'}
                  {size === 'extra-large' && 'Super Big 🗣️'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t-2 border-[#E2E8F0] flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to restart your crossing progress? You will lose unlocked outfits and stars.')) {
                playClick();
                onResetProgress();
              }
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-red-200 hover:bg-red-100 text-red-600 bg-red-50 font-bold text-center transition-all cursor-pointer text-sm md:text-base flex items-center justify-center gap-2"
            id="reset-progress-btn"
          >
            <RefreshCw className="w-5 h-5" />
            Reset Progress
          </button>
          
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl border-b-4 border-indigo-700 bg-indigo-500 text-white font-black text-center shadow-md hover:bg-indigo-600 transition-all cursor-pointer text-sm md:text-base"
            id="save-settings-btn"
          >
            Okay! Let's Play
          </button>
        </div>
      </div>
    </div>
  );
}
