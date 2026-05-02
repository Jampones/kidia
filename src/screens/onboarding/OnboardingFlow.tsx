import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowRight, Camera, BarChart3, Calendar, Heart, User, Baby, Users } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (profileData: any) => void;
  onBack: () => void;
}

const STEPS = [
  {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop",
    icon: <Camera className="text-[#4ADE80]" size={20} />,
    title: "Fotografa qualquer refeição",
    description: "Usa a câmara ou galeria para analisar pratos angolanos e internacionais. A nossa equipa identifica os ingredientes e os nutrientes de forma instantânea.",
    buttonText: "Próximo",
    indicator: 0
  },
  {
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=2000&auto=format&fit=crop",
    icon: <BarChart3 className="text-[#4ADE80]" size={20} />,
    title: "Análise nutricional completa",
    description: "Recebe calorias, proteínas, ferro, vitaminas e minerais. Sabes se o prato é bom contra a anemia, se é adequado para diabetes ou hipertensão.",
    buttonText: "Próximo",
    indicator: 1
  },
  {
    image: "https://images.unsplash.com/photo-1506084868730-342b1f8505b0?q=80&w=2000&auto=format&fit=crop",
    icon: <Calendar className="text-[#4ADE80]" size={20} />,
    title: "Plano alimentar personalizado",
    description: "Recebe sugestões de refeições angolanas e internacionais para cada momento do dia, baseadas nos teus objectivos e condições de saúde.",
    buttonText: "Criar conta",
    indicator: 2
  }
];

export default function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const [showMission, setShowMission] = useState(false);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowMission(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  if (showProfileSelection) {
    return <ProfileSelection onComplete={onComplete} />;
  }

  if (showMission) {
    return (
      <MissionScreen 
        onContinue={() => setShowProfileSelection(true)} 
        onBack={() => setShowMission(false)}
      />
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden">
      <div className="absolute top-0 w-full h-[60%] z-0">
        <img 
          src={step.image} 
          className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
          alt="Onboarding step"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-black/20" />
      </div>

      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-8 pb-10 relative z-10 flex flex-col"
      >
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step.indicator ? 'w-8 bg-[#4ADE80]' : 'w-4 bg-white/10'}`} 
            />
          ))}
        </div>

        <div className="w-12 h-12 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-2xl flex items-center justify-center mb-6">
          {step.icon}
        </div>

        <h2 className="text-[28px] font-black text-white leading-tight mb-4">
          {step.title}
        </h2>
        
        <p className="text-white/40 text-[14px] leading-relaxed mb-10 font-medium">
          {step.description}
        </p>

        <div className="flex gap-4">
          <button 
            onClick={prevStep}
            className="w-16 h-16 bg-[#121417] border border-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={nextStep}
            className="flex-1 h-16 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
          >
            <span className="text-base uppercase tracking-tight">{step.buttonText}</span>
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MissionScreen({ onContinue, onBack }: { onContinue: () => void, onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden">
      <div className="absolute top-0 w-full h-[60%] z-0">
        <img 
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Mission"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-black/20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-10 pb-12 relative z-10 flex flex-col"
      >
        <div className="mb-6">
          <div className="inline-flex px-4 py-1.5 border-[1.5px] border-[#FFA500] bg-[#FFA500]/10 rounded-full">
            <span className="text-[10px] font-black text-[#FFA500] uppercase tracking-[0.1em]">A NOSSA MISSÃO</span>
          </div>
        </div>

        <h2 className="text-[32px] font-black text-white leading-[1.1] mb-6">
          Comer bem com o que tens na mesa 🍽️
        </h2>
        
        <p className="text-white/40 text-[14px] leading-relaxed mb-10 font-medium">
          O NutriLens é o teu guia nutricional pessoal, criado para te ajudar a comer melhor com o que tens na mesa, prevenindo problemas como a anemia e fortalecendo a tua saúde, sem precisares de um nutricionista particular agora.
        </p>

        <button 
          onClick={onContinue}
          className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
        >
          Isso é para mim! ❤️
        </button>
      </motion.div>
    </div>
  );
}

function ProfileSelection({ onComplete }: { onComplete: (data: any) => void }) {
  const [selected, setSelected] = useState('self');

  const PROFILES = [
    { id: 'self', icon: <User size={24} />, title: "Para Mim", desc: "Quero ter mais energia, controlar o peso e viver com saúde." },
    { id: 'child', icon: <Baby size={24} />, title: "Para o meu Filho(a)", desc: "Cuide da alimentação do seu filho e garanta que ele cresça forte e saudável." },
    { id: 'elder', icon: <Users size={24} />, title: "Para o meu Avô/Avó", desc: "Dê mais qualidade de vida e vitalidade para quem você ama. Nutrição para um envelhecimento activo." }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden">
       <div className="absolute top-0 w-full h-[50%] z-0">
        <img 
          src="https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-60"
          alt="Profile selection background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-black/20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-10 pb-12 relative z-10 flex flex-col"
      >
        <h2 className="text-[28px] font-black text-white leading-tight mb-2">
          Para quem vais cuidar hoje? 💚
        </h2>
        <p className="text-white/40 text-[13px] mb-8 font-medium">Escolhe o perfil para personalizar as recomendações</p>

        <div className="space-y-4 mb-8">
          {PROFILES.map((p) => (
            <button 
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${selected === p.id ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/5 bg-[#121417]'}`}
            >
              <div className={`p-3 rounded-xl ${selected === p.id ? 'bg-[#4ADE80] text-black' : 'bg-white/5 text-white/40'}`}>
                {p.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${selected === p.id ? 'text-[#4ADE80]' : 'text-white'}`}>{p.title}</h4>
                <p className="text-[11px] text-white/40 leading-snug mt-1">{p.desc}</p>
              </div>
              {selected === p.id && <div className="w-6 h-6 bg-[#4ADE80] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#4ADE80]/20">
                <ArrowRight size={14} strokeWidth={3} />
              </div>}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onComplete({ profile_type: selected })}
          className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
        >
          PRÓXIMO
        </button>
      </motion.div>
    </div>
  );
}
