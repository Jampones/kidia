import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onStart, onLogin }: LandingScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] overflow-hidden relative">
      {/* Hero Image Section - Full Background vibe */}
      <div className="absolute inset-0 h-[60vh] w-full">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Gourmet grilled food"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent" />
      </div>

      {/* Content Section - The Dark Overlay Card */}
      <motion.div 
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-auto bg-[#0A0B0D] rounded-t-[44px] px-8 pt-12 pb-14 relative z-20 flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.4)]"
      >
        <div className="mb-8 self-start">
          <div className="px-5 py-2.5 border-2 border-[#1E6B44] bg-[#0F2A1D] rounded-full">
            <span className="text-[11px] font-extrabold text-[#4ADE80] uppercase tracking-[0.25em] font-sans">
              Nutrição Personalizada
            </span>
          </div>
        </div>

        <h1 className="text-[48px] font-black mb-4 tracking-[-0.04em] leading-none text-white font-sans">
          NutriLens
        </h1>
        
        <p className="text-white/50 leading-relaxed mb-12 text-[16px] font-medium max-w-[340px]">
          O teu guia nutricional pessoal. Fotografa qualquer prato e descobre tudo sobre a tua alimentação.
        </p>

        <div className="space-y-4">
          <button 
            onClick={onStart}
            className="w-full py-5 bg-[#4ADE80] text-black font-extrabold rounded-[26px] flex items-center justify-center gap-3 transition-transform active:scale-[0.97] shadow-2xl shadow-[#4ADE80]/20"
          >
            <span className="text-lg">Começar a jornada</span>
            <ArrowRight size={22} strokeWidth={3} />
          </button>

          <button className="w-full py-5 bg-[#121417]/40 border border-white/5 text-white/40 font-bold rounded-[26px] flex items-center justify-center gap-3 transition-all hover:bg-white/10 active:scale-[0.98]">
            <Compass size={20} className="text-white/60" />
            <span className="text-sm">Testar sem conta (limitado)</span>
          </button>

          <div className="text-center pt-6">
            <p className="text-[14px] text-white/40 font-semibold tracking-tight">
              Já tenho conta — <button onClick={onLogin} className="text-[#4ADE80] font-black hover:underline transition-all">Entrar</button>
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Minimalistic Home Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/15 rounded-full z-30" />
    </div>
  );
}
