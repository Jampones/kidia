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
      {/* Hero Image Section */}
      <div className="h-[55vh] w-full relative">
        <img 
          src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Grilled healthy food"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-black/20" />
      </div>

      {/* Content Section - Dark Card Style */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 bg-[#0A0B0D] rounded-t-[40px] px-8 pt-10 pb-12 -mt-16 relative z-20 flex flex-col"
      >
        <div className="mb-6 self-start">
          <div className="px-5 py-2 border-2 border-[#1E6B44] bg-[#0F2A1D] rounded-full">
            <span className="text-[10px] font-bold text-[#4ADE80] uppercase tracking-[0.2em] font-sans">
              Nutrição Personalizada
            </span>
          </div>
        </div>

        <h1 className="text-[42px] font-bold mb-4 tracking-[-0.03em] leading-tight text-white">
          NutriLens
        </h1>
        
        <p className="text-white/60 leading-relaxed mb-10 text-[15px] font-medium">
          O teu guia nutricional pessoal. Fotografa qualquer prato e descobre tudo sobre a tua alimentação.
        </p>

        <div className="mt-auto space-y-4">
          <button 
            onClick={onStart}
            className="w-full py-5 bg-[#4ADE80] text-black font-bold rounded-[22px] flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-xl shadow-[#4ADE80]/10"
          >
            <span className="text-lg">Começar a jornada</span>
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>

          <button className="w-full py-5 bg-[#121417] border border-white/5 text-white/40 font-semibold rounded-[22px] flex items-center justify-center gap-3 transition-all hover:bg-white/5">
            <Compass size={20} className="text-white/60" />
            <span className="text-sm">Testar sem conta (limitado)</span>
          </button>

          <div className="text-center pt-4">
            <p className="text-[13px] text-white/40 font-medium tracking-tight">
              Já tenho conta — <button onClick={onLogin} className="text-[#4ADE80] font-bold hover:underline">Entrar</button>
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Minimalistic Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full z-30" />
    </div>
  );
}
