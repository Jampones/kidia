import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onStart, onLogin }: LandingScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] h-screen overflow-hidden relative font-sans">
      {/* Background Image Container */}
      <div className="absolute top-0 w-full h-[65%] z-0">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Gourmet Food Reference"
        />
        {/* Deep gradient to blend image with the card better */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/20 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Card - Ultra Compact for maximum image visibility */}
      <motion.div 
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-7 pb-6 relative z-10 flex flex-col shadow-[0_-30px_60px_rgba(0,0,0,1)] border-t border-white/[0.02]"
      >
        <div className="mb-4 flex justify-start">
          <div className="px-3 py-1 border border-[#1E6B44] bg-[#0F2A1D]/80 rounded-full">
            <span className="text-[8px] font-black text-[#4ADE80] uppercase tracking-[0.15em]">
              Nutrição Personalizada
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1.5 tracking-tight text-white">
          NutriLens
        </h1>
        
        <p className="text-white/40 leading-snug mb-7 text-xs font-medium max-w-[240px]">
          O teu guia nutricional pessoal. Fotografa qualquer prato e descobre tudo sobre a tua alimentação.
        </p>

        <div className="space-y-2.5">
          <button 
            onClick={onStart}
            className="w-full py-3 bg-[#4ADE80] text-[#0A0B0D] font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#4ADE80]/5"
          >
            <span className="text-sm">Começar a jornada</span>
            <ArrowRight size={16} strokeWidth={3} />
          </button>

          <button className="w-full py-3 bg-[#121417] border border-white/5 text-white/30 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <Compass size={14} className="text-white/20" />
            <span className="text-[11px] uppercase tracking-wider">Testar sem conta</span>
          </button>

          <div className="text-center pt-3">
            <p className="text-[11px] text-white/30 font-semibold">
              Já tenho conta — <button onClick={onLogin} className="text-[#4ADE80] font-black hover:opacity-80 transition-opacity">Entrar</button>
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Home Indicator */}
      <div className="w-32 h-1 bg-white/10 rounded-full mx-auto mb-2 mt-4" />
    </div>
  );
}
