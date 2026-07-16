import { useState } from 'react';
import { playClick, playSuccessChime } from '../lib/audio';
import { Printer, X, Download, Award, ShieldCheck, Heart } from 'lucide-react';

interface MasterCertificateProps {
  stars: number;
  coins: number;
  onClose: () => void;
}

export default function MasterCertificate({
  stars,
  coins,
  onClose,
}: MasterCertificateProps) {
  const [childName, setChildName] = useState<string>('');

  const handlePrint = () => {
    playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:static">
      
      {/* Modal Container */}
      <div 
        className="w-full max-w-2xl bg-white border-4 border-[#BAE6FD] rounded-3xl p-6 md:p-8 shadow-2xl relative text-center animate-scale-in print:border-0 print:shadow-none print:max-w-full print:p-0"
        id="certificate-modal"
      >
        {/* Close Button (Hidden in Print) */}
        <button
          onClick={() => {
            playClick();
            onClose();
          }}
          className="absolute right-6 top-6 w-11 h-11 flex items-center justify-center rounded-full bg-red-50 text-red-600 border-2 border-red-200 font-bold text-lg hover:bg-red-100 transition-all cursor-pointer shadow-sm print:hidden"
          id="close-cert-btn"
        >
          ✕
        </button>

        {/* Certificate Frame */}
        <div className="border-4 border-dashed border-indigo-200 p-4 md:p-6 rounded-2xl bg-indigo-50/10 print:border-4 print:p-10">
          
          {/* Certificate Header Icons */}
          <div className="flex justify-center gap-4 mb-4">
            <span className="text-4xl">🌟</span>
            <div className="w-16 h-16 bg-amber-400 border-4 border-amber-500 rounded-full flex items-center justify-center text-4xl shadow-md animate-bounce">
              🏅
            </div>
            <span className="text-4xl">🌟</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-indigo-950 font-sans tracking-tight uppercase mb-1">
            Diploma of Excellence
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-amber-500 font-sans mb-6">
            ROAD SAFETY CROSSING MASTER
          </h2>

          <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
            This certifies that the amazing explorer named below knows that <b>Red means Stop</b>, <b>Yellow means Wait</b>, and <b>Green means Cross</b> safely!
          </p>

          {/* Child Name Input / Display Area */}
          <div className="max-w-md mx-auto mb-8 print:mb-12">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 print:hidden">
              ✏️ Type your name here to personalize your certificate:
            </label>
            
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="YOUR NAME HERE"
              className="w-full border-b-2 border-dashed border-indigo-400 text-center text-2xl md:text-3xl font-black text-indigo-800 placeholder-indigo-200 outline-none uppercase py-2 tracking-wide focus:border-indigo-600 transition-colors print:border-b-2 print:border-black"
              maxLength={22}
              id="cert-name-input"
            />
          </div>

          {/* Verification Badge & Stats */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-[#E2E8F0] shadow-sm">
              <span className="text-2xl">⭐</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Total Stars</p>
                <p className="text-base font-black text-indigo-950">{stars} Stars</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-[#E2E8F0] shadow-sm">
              <span className="text-2xl">🛡️</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Certified Safe</p>
                <p className="text-base font-black text-emerald-600">100% Perfect</p>
              </div>
            </div>
          </div>

          {/* Decorative Seal / Signature */}
          <div className="flex justify-between items-end mt-8 px-4 md:px-8">
            <div className="text-left">
              <div className="w-24 border-b-2 border-slate-300 py-1 font-mono text-xs italic text-indigo-600">
                🦁 Leo the Lion
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Mascot Sponsor</p>
            </div>

            {/* Official Seal Emoji */}
            <div className="relative">
              <ShieldCheck className="w-14 h-14 text-emerald-500 fill-emerald-100 stroke-[2] drop-shadow-sm" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-emerald-700">
                OK!
              </div>
            </div>

            <div className="text-right">
              <div className="w-24 border-b-2 border-slate-300 py-1 font-mono text-xs italic text-indigo-600">
                👮 Officer Friendly
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Safety Inspector</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in Print) */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-[#E2E8F0] hover:bg-slate-50 bg-white text-slate-700 font-bold text-base shadow-sm transition-all cursor-pointer"
            id="close-cert-panel-btn"
          >
            Keep Playing 💖
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1.5 py-4 px-6 rounded-2xl border-b-4 border-indigo-700 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
            id="print-cert-btn"
          >
            <Printer className="w-5 h-5 shrink-0" />
            Print My Certificate 🖨️
          </button>
        </div>
      </div>
    </div>
  );
}
