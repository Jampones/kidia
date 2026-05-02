import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onStart, onLogin }: LandingScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-dark-bg overflow-hidden relative">
      {/* Hero Image Section */}
      <div className="h-[65vh] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Grilled healthy food"
        />
        
        {/* Top Status Bar Decoration */}
        <div className="absolute top-0 w-full p-6 flex justify-between items-start z-20">
          <span className="font-bold text-sm">16:20</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-4 rounded-sm border border-white/40" />
            <div className="w-4 h-4 rounded-sm border border-white/40" />
            <div className="w-6 h-3 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-8 pb-12 -mt-20 relative z-20 flex-1 flex flex-col"
      >
        <div className="mb-6">
          <span className="badge-primary">
            Nutrição Personalizada
          </span>
        </div>

        <h1 className="text-4xl font-bold mb-4 tracking-tight">
          NutriLens
        </h1>
        
        <p className="text-white/60 leading-relaxed mb-10 text-sm max-w-[280px]">
          O teu guia nutricional pessoal. Fotografa qualquer prato e descobre tudo sobre a tua alimentação.
        </p>

        <div className="mt-auto space-y-4">
          <button 
            onClick={onStart}
            className="btn-primary"
          >
            Começar a jornada
            <ArrowRight size={18} />
          </button>

          <button className="btn-outline">
            <Compass size={18} />
            Testar sem conta (limitado)
          </button>

          <p className="text-center text-xs text-white/40 pt-4">
            Já tenho conta — <button onClick={onLogin} className="text-primary font-bold hover:underline">Entrar</button>
          </p>
        </div>
      </motion.div>
      
      {/* Home Indicator Decoration */}
      <div className="w-32 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />
    </div>
  );
}
