import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ArrowRight, Camera, BarChart3, Calendar, 
  User, Baby, Users, Heart, Zap, Check, Info, Bell, MapPin
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (mode: 'signup' | 'login' | 'guest', profileData: any) => void;
  onBack: () => void;
}

type StepType = 'intro' | 'mission' | 'profile_select' | 'quiz' | 'ready';

export default function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [view, setView] = useState<StepType>('intro');
  const [currentIntroStep, setCurrentIntroStep] = useState(0);
  const [profileData, setProfileData] = useState({
    profile_type: 'self',
    name: '',
    birth_date: '',
    age: 0,
    gender: 'Masculino',
    province: 'Luanda',
    weight: '',
    height: '',
    goal: 'eat_better',
    diet: 'omnivore',
    activity: 'moderate',
    restrictions: [] as string[],
    notifications: true
  });

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const PROVINCES = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", 
    "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", 
    "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", 
    "Namibe", "Uíge", "Zaire"
  ];

  const handleBirthDateChange = (date: string) => {
    const age = calculateAge(date);
    setProfileData(prev => ({ ...prev, birth_date: date, age }));
  };

  const [quizStep, setQuizStep] = useState(1);
  const totalQuizSteps = 6;

  // --- INTRO STEPS ---
  const INTRO_STEPS = [
    {
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop",
      icon: <Camera className="text-[#4ADE80]" size={20} />,
      title: "Fotografa qualquer refeição",
      description: "Usa a câmara ou galeria para analisar pratos angolanos e internacionais de forma instantânea.",
      buttonText: "Próximo"
    },
    {
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=2000&auto=format&fit=crop",
      icon: <BarChart3 className="text-[#4ADE80]" size={20} />,
      title: "Análise nutricional completa",
      description: "Recebe calorias, proteínas, ferro e vitaminas. Sabes se o prato é seguro para a tua saúde.",
      buttonText: "Próximo"
    },
    {
      image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=2000&auto=format&fit=crop",
      icon: <Calendar className="text-[#4ADE80]" size={20} />,
      title: "Plano alimentar personalizado",
      description: "Sugestões baseadas nos teus objectivos, cultura angolana e condições de saúde.",
      buttonText: "Começar"
    }
  ];

  const handleNextIntro = () => {
    if (currentIntroStep < INTRO_STEPS.length - 1) {
      setCurrentIntroStep(prev => prev + 1);
    } else {
      setView('mission');
    }
  };

  const handleSkip = () => {
    setProfileData(prev => ({
      ...prev,
      name: prev.name || 'Novo Utilizador',
      age: prev.age || '25',
    }));
    setView('ready');
  };

  // --- RENDERING VIEWS ---

  if (view === 'intro') {
    const step = INTRO_STEPS[currentIntroStep];
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden font-sans">
        <div className="absolute top-0 w-full h-[65%] z-0">
          <img src={step.image} className="w-full h-full object-cover" alt="Intro" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/30 to-transparent" />
        </div>
        <motion.div 
          key={currentIntroStep} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }}
          className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-8 pb-10 relative z-10 flex flex-col shadow-[0_-30px_60px_rgba(0,0,0,1)] border-t border-white/[0.02]"
        >
          <div className="flex gap-1.5 mb-6">
            {INTRO_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIntroStep ? 'w-8 bg-[#4ADE80]' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
          <div className="w-12 h-12 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-2xl flex items-center justify-center mb-6">{step.icon}</div>
          <h2 className="text-[28px] font-black text-white leading-tight mb-4">{step.title}</h2>
          <p className="text-white/40 text-[14px] leading-relaxed mb-10 font-medium">{step.description}</p>
          <div className="flex gap-4">
            <button onClick={() => currentIntroStep > 0 ? setCurrentIntroStep(prev => prev -1) : onBack()} className="w-16 h-16 bg-[#121417] border border-white/5 rounded-2xl flex items-center justify-center text-white/20"><ChevronLeft size={24} /></button>
            <button onClick={handleNextIntro} className="flex-1 h-16 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#4ADE80]/10">
              <span className="text-base uppercase">{step.buttonText}</span>
              <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
          <button 
            onClick={handleSkip} 
            className="mt-6 text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#4ADE80] transition-colors"
          >
            Pular Introdução
          </button>
        </motion.div>
      </div>
    );
  }

  if (view === 'mission') {
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden font-sans">
        <div className="absolute top-0 w-full h-[65%] z-0">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Mission" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/20 to-transparent" />
        </div>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-10 pb-12 relative z-10">
          <div className="mb-6"><div className="inline-flex px-3 py-1 border border-[#FFA500]/40 bg-[#FFA500]/5 rounded-full"><span className="text-[9px] font-black text-[#FFA500] uppercase tracking-[0.1em]">A NOSSA MISSÃO</span></div></div>
          <h2 className="text-[32px] font-black text-white leading-[1] mb-6">Comer bem com o que tens na mesa 🍽️</h2>
          <p className="text-white/40 text-[14px] leading-relaxed mb-10 font-medium">O kidiaNutri é o teu guia pessoal para comer melhor com os ingredientes locais, prevenindo a anemia e fortalecendo a tua saúde sem custos elevados.</p>
          <button onClick={() => setView('profile_select')} className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center shadow-xl shadow-[#4ADE80]/10">Isso é para mim! ❤️</button>
          <button onClick={handleSkip} className="mt-8 mx-auto text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#4ADE80] transition-colors">Pular Quiz</button>
        </motion.div>
      </div>
    );
  }

  if (view === 'profile_select') {
    const PROFILES = [
      { id: 'self', icon: <User size={22} />, title: "Para Mim", desc: "Energia, peso e saúde.", img: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=2000&auto=format&fit=crop" },
      { id: 'child', icon: <Baby size={22} />, title: "Para o meu Filho(a)", desc: "Crescimento e nutrição forte.", img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=2000&auto=format&fit=crop" },
      { id: 'elder', icon: <Users size={22} />, title: "Para o meu Avô/Avó", desc: "Vitalidade e envelhecimento activo.", img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2000&auto=format&fit=crop" },
      { id: 'pregnant', icon: <Heart size={22} />, title: "Grávida / Gestante", desc: "Nutrição segura para o bebé.", img: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2000&auto=format&fit=crop" },
      { id: 'other', icon: <Info size={22} />, title: "Outra Pessoa", desc: "Ajudar alguém próximo.", img: "https://images.unsplash.com/photo-1551884107-7bc838290382?q=80&w=2000&auto=format&fit=crop" }
    ];
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] relative overflow-hidden font-sans">
        <div className="absolute top-0 w-full h-[45%] z-0">
          <img src={PROFILES.find(p => p.id === profileData.profile_type)?.img} className="w-full h-full object-cover opacity-60" alt="Profile" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent" />
        </div>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="mt-auto bg-[#0A0B0D] rounded-t-[40px] px-8 pt-8 pb-10 relative z-10 flex flex-col shadow-[0_-30px_60px_rgba(0,0,0,1)] border-t border-white/[0.02] max-h-[75vh] overflow-y-auto">
          <button onClick={() => setView('mission')} className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 mb-6"><ChevronLeft size={20} /></button>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">Para quem vais cuidar hoje? 💚</h2>
          <p className="text-white/30 text-[11px] mb-6 font-medium">Escolhe o perfil para recomendações personalizadas</p>
          <div className="space-y-3 mb-8">
            {PROFILES.map((p) => (
              <button key={p.id} onClick={() => setProfileData(prev => ({ ...prev, profile_type: p.id }))} className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${profileData.profile_type === p.id ? 'border-[#4ADE80] bg-[#4ADE80]/5 shadow-lg shadow-[#4ADE80]/10' : 'border-white/[0.03] bg-[#121417]/40'}`}>
                <div className={`p-2.5 rounded-xl ${profileData.profile_type === p.id ? 'bg-[#4ADE80] text-black' : 'bg-white/5 text-white/20'}`}>{p.icon}</div>
                <div className="flex-1"><h4 className={`font-black text-xs uppercase tracking-tight ${profileData.profile_type === p.id ? 'text-[#4ADE80]' : 'text-white/70'}`}>{p.title}</h4><p className="text-[10px] text-white/30 leading-snug mt-0.5">{p.desc}</p></div>
                {profileData.profile_type === p.id && <div className="w-6 h-6 bg-[#4ADE80] rounded-full flex items-center justify-center text-black border-2 border-black animate-pulse"><Check size={14} strokeWidth={4} /></div>}
              </button>
            ))}
          </div>
          <button onClick={() => setQuizStep(1) || setView('quiz')} className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center shadow-xl shadow-[#4ADE80]/20">PRÓXIMO</button>
          <button onClick={handleSkip} className="mt-8 mx-auto text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#4ADE80] transition-colors">Pular Quiz</button>
        </motion.div>
      </div>
    );
  }

  if (view === 'quiz') {
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] p-7 font-sans">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => quizStep > 1 ? setQuizStep(prev => prev-1) : setView('profile_select')} className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-white/40"><ChevronLeft size={20} /></button>
          <div className="flex-1 px-8">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(quizStep / totalQuizSteps) * 100}%` }} className="h-full bg-[#4ADE80] rounded-full" />
            </div>
            <p className="text-center text-[10px] font-bold text-white/20 mt-2 uppercase tracking-widest">{quizStep}/{totalQuizSteps}</p>
          </div>
          <div className="w-10" />
        </div>

        <button 
          onClick={handleSkip} 
          className="mb-4 text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#4ADE80] transition-colors flex items-center justify-center gap-1"
        >
          Pular Quiz
        </button>

        <AnimatePresence mode="wait">
          {quizStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col overflow-y-auto pb-6">
              <div className="mb-6"><div className="w-12 h-12 bg-[#4ADE80]/10 rounded-2xl flex items-center justify-center border border-[#4ADE80]/20"><MapPin className="text-[#4ADE80]" size={24} /></div></div>
              <h2 className="text-2xl font-black text-white leading-tight mb-6">Quem estamos a cuidar?</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2 block tracking-[0.2em]">Nome Completo</label>
                  <input type="text" className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#4ADE80]/40 text-white" placeholder="Ex: Alexandra Kavesse" value={profileData.name} onChange={e => setProfileData(prev => ({...prev, name: e.target.value}))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2 block tracking-[0.2em]">Data de Nascimento</label>
                    <input type="date" max={new Date().toISOString().split('T')[0]} className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#4ADE80]/40 text-white" value={profileData.birth_date} onChange={e => handleBirthDateChange(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2 block tracking-[0.2em]">Província</label>
                    <select className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#4ADE80]/40 text-white appearance-none" value={profileData.province} onChange={e => setProfileData(prev => ({...prev, province: e.target.value}))}>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2 block tracking-[0.2em]">Peso (kg)</label>
                    <input type="number" step="0.1" className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#4ADE80]/40 text-white" placeholder="70" value={profileData.weight} onChange={e => setProfileData(prev => ({...prev, weight: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2 block tracking-[0.2em]">Altura (cm)</label>
                    <input type="number" className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#4ADE80]/40 text-white" placeholder="170" value={profileData.height} onChange={e => setProfileData(prev => ({...prev, height: e.target.value}))} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-3 block tracking-[0.2em]">Sexo</label>
                  <div className="flex gap-4">
                    {['Masculino', 'Feminino'].map(s => (
                      <button key={s} onClick={() => setProfileData(prev => ({...prev, gender: s}))} className={`flex-1 py-3.5 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${profileData.gender === s ? 'border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80]' : 'border-white/5 bg-white/5 text-white/30'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                disabled={!profileData.name || !profileData.birth_date || profileData.age > 100 || profileData.age < 0} 
                onClick={() => setQuizStep(2)} 
                className="w-full py-5 bg-[#4ADE80] text-black font-black rounded-2xl mt-8 disabled:opacity-30"
              >
                {profileData.age > 100 ? 'IDADE INVÁLIDA (>100)' : 'CONTINUAR'}
              </button>
            </motion.div>
          )}

          {quizStep === 2 && (
            <motion.div key="step2" className="flex-1 flex flex-col">
              <div className="mb-8"><div className="w-12 h-12 bg-[#4ADE80]/10 rounded-2xl flex items-center justify-center border border-[#4ADE80]/20"><Zap className="text-[#4ADE80]" size={24} /></div></div>
              <h2 className="text-3xl font-black text-white leading-tight mb-8">Qual é o teu principal objectivo?</h2>
              <div className="space-y-3">
                {[
                  { id: 'weight_loss', title: 'Perder peso', desc: 'Reduzir a gordura corporal', icon: '📉' },
                  { id: 'gain_muscle', title: 'Ganhar massa', desc: 'Aumentar a musculatura', icon: '💪' },
                  { id: 'maintain', title: 'Manter a forma', desc: 'Manter o peso actual', icon: '⚖️' },
                  { id: 'eat_better', title: 'Comer melhor', desc: 'Melhorar a qualidade de vida', icon: '🥗' },
                  { id: 'health', title: 'Controlar saúde', desc: 'Condição de saúde específica', icon: '❤️' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setProfileData(prev => ({...prev, goal: opt.id})); setQuizStep(3); }} className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${profileData.goal === opt.id ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/5 bg-[#121417]/50'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl grayscale transition-all ${profileData.goal === opt.id ? 'grayscale-0' : 'opacity-40'}`}>{opt.icon}</span>
                      <div><h4 className={`font-bold text-sm ${profileData.goal === opt.id ? 'text-[#4ADE80]' : 'text-white'}`}>{opt.title}</h4><p className="text-[10px] text-white/30 uppercase tracking-tight mt-0.5">{opt.desc}</p></div>
                    </div>
                    {profileData.goal === opt.id && <div className="w-5 h-5 bg-[#4ADE80] rounded-full flex items-center justify-center text-black shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {quizStep === 3 && (
            <motion.div key="step3" className="flex-1 flex flex-col">
              <h2 className="text-3xl font-black text-white leading-tight mb-8">Como preferes alimentar-te?</h2>
              <div className="space-y-3">
                {[
                  { id: 'omnivore', title: 'Como de tudo', desc: 'Sem restrições', icon: '🍽️' },
                  { id: 'vegetarian', title: 'Vegetariano', desc: 'Sem carne, mas como ovos', icon: '🥦' },
                  { id: 'vegan', title: 'Vegano', desc: 'Nenhum produto animal', icon: '🌱' },
                  { id: 'low_carb', title: 'Baixo carboidrato', desc: 'Mais proteína e gordura', icon: '🥩' },
                  { id: 'balanced', title: 'Equilibrado', desc: 'Foco em alimentos naturais', icon: '🍎' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setProfileData(prev => ({...prev, diet: opt.id})); setQuizStep(4); }} className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${profileData.diet === opt.id ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/5 bg-[#121417]/50'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl grayscale transition-all ${profileData.diet === opt.id ? 'grayscale-0' : 'opacity-40'}`}>{opt.icon}</span>
                      <div><h4 className={`font-bold text-sm ${profileData.diet === opt.id ? 'text-[#4ADE80]' : 'text-white'}`}>{opt.title}</h4><p className="text-[10px] text-white/30 uppercase tracking-tight mt-0.5">{opt.desc}</p></div>
                    </div>
                    {profileData.diet === opt.id && <div className="w-5 h-5 bg-[#4ADE80] rounded-full flex items-center justify-center text-black shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {quizStep === 4 && (
            <motion.div key="step4" className="flex-1 flex flex-col">
              <h2 className="text-3xl font-black text-white leading-tight mb-8">Qual é o teu nível de actividade?</h2>
              <div className="space-y-3">
                {[
                  { id: 'sedentary', title: 'Sedentário', desc: 'Pouco ou nenhum exercício', icon: '🪑' },
                  { id: 'light', title: 'Leve', desc: 'Caminhadas 1-3x por semana', icon: '🚶' },
                  { id: 'moderate', title: 'Moderado', desc: 'Exercício 3-5x por semana', icon: '🚴' },
                  { id: 'active', title: 'Activo', desc: 'Exercício intenso quase diário', icon: '🏃' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setProfileData(prev => ({...prev, activity: opt.id})); setQuizStep(5); }} className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${profileData.activity === opt.id ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/5 bg-[#121417]/50'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl grayscale transition-all ${profileData.activity === opt.id ? 'grayscale-0' : 'opacity-40'}`}>{opt.icon}</span>
                      <div><h4 className={`font-bold text-sm ${profileData.activity === opt.id ? 'text-[#4ADE80]' : 'text-white'}`}>{opt.title}</h4><p className="text-[10px] text-white/30 uppercase tracking-tight mt-0.5">{opt.desc}</p></div>
                    </div>
                    {profileData.activity === opt.id && <div className="w-5 h-5 bg-[#4ADE80] rounded-full flex items-center justify-center text-black shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {quizStep === 5 && (
            <motion.div key="step5" className="flex-1 flex flex-col">
              <h2 className="text-3xl font-black text-white leading-tight mb-4">Tens alguma restrição ou condição?</h2>
              <p className="text-white/20 text-xs mb-8">Selecciona todas que se aplicam</p>
              <div className="space-y-3 mb-8">
                {[
                  { id: 'gluten', title: 'Intolerância ao glúten' },
                  { id: 'lactose', title: 'Intolerância à lactose' },
                  { id: 'diabetes', title: 'Diabetes' },
                  { id: 'hypertension', title: 'Hipertensão' },
                  { id: 'none', title: 'Nenhuma restrição' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => {
                    const current = profileData.restrictions;
                    if (opt.id === 'none') setProfileData(prev => ({...prev, restrictions: ['none']}));
                    else setProfileData(prev => ({...prev, restrictions: current.includes(opt.id) ? current.filter(r => r !== opt.id) : [...current.filter(r => r !== 'none'), opt.id]}));
                  }} className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${profileData.restrictions.includes(opt.id) ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/5 bg-[#121417]/50'}`}>
                    <h4 className={`font-bold text-sm ${profileData.restrictions.includes(opt.id) ? 'text-[#4ADE80]' : 'text-white'}`}>{opt.title}</h4>
                    {profileData.restrictions.includes(opt.id) && <div className="w-5 h-5 bg-[#4ADE80] rounded-full flex items-center justify-center text-black shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
              <button disabled={!profileData.restrictions.length} onClick={() => setQuizStep(6)} className="w-full py-5 bg-[#4ADE80] text-black font-black rounded-2xl mt-auto shadow-lg shadow-[#4ADE80]/20 flex items-center justify-center gap-2">CONTINUAR <ArrowRight size={20} /></button>
            </motion.div>
          )}

          {quizStep === 6 && (
            <motion.div key="step6" className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#FFA500]/10 rounded-full flex items-center justify-center mb-8 border border-[#FFA500]/20"><Bell className="text-[#FFA500]" size={36} /></div>
              <h2 className="text-3xl font-black text-white leading-tight mb-4">Activar lembretes de refeição?</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-[280px]">Recebe notificações nos melhores horários. Café da manhã, almoço e jantar no horário certo para ti.</p>
              <div className="space-y-4 w-full">
                <button onClick={() => { setProfileData(p => ({...p, notifications: true})); setView('ready'); }} className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#4ADE80]/10"><Bell size={20} /> ACTIVAR NOTIFICAÇÕES</button>
                <button onClick={() => { setProfileData(p => ({...p, notifications: false})); setView('ready'); }} className="text-white/30 font-bold text-sm tracking-tight hover:text-white transition-colors">AGORA NÃO</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'ready') {
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] p-8 items-center justify-center text-center font-sans">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-[#4ADE80] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#4ADE80]/30"><Check size={48} strokeWidth={4} className="text-[#0A0B0D]" /></motion.div>
        <h2 className="text-4xl font-black text-white mb-4">Tudo pronto!</h2>
        <p className="text-white/40 mb-10 leading-relaxed font-medium">O teu perfil foi criado com sucesso. Vamos começar a cuidar da tua nutrição agora.</p>
        
        <div className="w-full bg-[#121417]/50 border border-white/5 rounded-3xl p-6 mb-10 space-y-4 text-left">
          <div className="flex items-center gap-3"><User size={16} className="text-[#4ADE80]" /><span className="text-white/40 text-xs font-bold uppercase tracking-tight">Utilizador:</span><span className="text-white font-bold ml-auto">{profileData.name}</span></div>
          <div className="flex items-center gap-3"><Zap size={16} className="text-[#4ADE80]" /><span className="text-white/40 text-xs font-bold uppercase tracking-tight">IMC Info:</span><span className="text-white font-bold ml-auto">{profileData.weight}kg • {profileData.height}cm</span></div>
          <div className="flex items-center gap-3"><Heart size={16} className="text-[#4ADE80]" /><span className="text-white/40 text-xs font-bold uppercase tracking-tight">Perfil:</span><span className="text-white font-bold ml-auto uppercase">{profileData.profile_type}</span></div>
        </div>

        <button onClick={() => onComplete('signup', profileData)} className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-[#4ADE80]/30 transition-transform active:scale-[0.97]">CRIAR CONTA E ENTRAR 🚀</button>
      </div>
    );
  }

  return null;
}
