import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MessageSquare, 
  Send, 
  Upload, 
  Zap, 
  Activity, 
  X,
  Loader2,
  Apple,
  Dna,
  Heart,
  LogOut,
  History,
  ChevronRight,
  Bell,
  Calendar,
  Users,
  Check,
  User,
  Coffee,
  Flame,
  Droplets,
  Target,
  Edit3,
  AlertCircle,
  Type,
  Moon,
  Globe,
  Share2,
  Star,
  RefreshCcw,
  Sun,
  Plus,
  Image as ImageIcon,
  Scan,
  Maximize,
  Eye,
  Utensils,
  Info
} from 'lucide-react';
import { askNutritionAssistant, analyzeFoodImage } from '../services/geminiService.ts';
import { getSupabase } from '../lib/supabase.ts';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface DashboardProps {
  session: SupabaseUser;
  onLogout: () => void;
}

interface Message { role: 'user' | 'model'; text: string; }
interface AnalysisResult { name: string; calories: string; protein: string; carbs: string; fat: string; healthTip: string; }

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'community' | 'profile'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu assistente de nutrição Neon. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannerResult, setScannerResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { 
    loadChatHistory(); 
    loadScanHistory(); 
    loadUserProfile();
  }, []);

  const getClient = () => getSupabase();

  const loadUserProfile = async () => {
    const { data } = await getClient()
      .from('profiles')
      .select('*')
      .eq('id', session.id)
      .single();
    if (data) setUserProfile(data);
  };

  const loadChatHistory = async () => {
    const { data } = await getClient().from('chat_messages').select('*').eq('user_id', session.id).order('created_at', { ascending: true });
    if (data && data.length) setMessages(data.map((m: any) => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })));
  };

  const loadScanHistory = async () => {
    const { data } = await getClient().from('scan_history').select('*').eq('user_id', session.id).order('created_at', { ascending: false });
    if (data) setScanHistory(data);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text: userMsg }]); setIsTyping(true);
    await getClient().from('chat_messages').insert({ user_id: session.id, text: userMsg, sender: 'user' });
    try {
      const response = await askNutritionAssistant(userMsg, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), userProfile);
      const aiMsg = response || 'Erro no sistema';
      setMessages(prev => [...prev, { role: 'model', text: aiMsg }]);
      await getClient().from('chat_messages').insert({ user_id: session.id, text: aiMsg, sender: 'specialist' });
    } catch (error) { setMessages(prev => [...prev, { role: 'model', text: 'Falha na conexão.' }]); }
    finally { setIsTyping(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setPreviewUrl(reader.result as string); processImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setIsAnalyzing(true); setScannerResult(null);
    try {
      const result = await analyzeFoodImage(base64, userProfile);
      setScannerResult(result);
      await getClient().from('scan_history').insert({
        user_id: session.id, date: new Date().toISOString().split('T')[0], item_name: result.name,
        calories: parseFloat(result.calories) || 0, protein: parseFloat(result.protein) || 0,
        carbs: parseFloat(result.carbs) || 0, fat: parseFloat(result.fat) || 0, recommendation: result.healthTip
      });
      loadScanHistory();
    } catch (error) { console.error(error); }
    finally { setIsAnalyzing(false); }
  };

  const [activePlanDay, setActivePlanDay] = useState<'hoje' | 'amanhã' | 'depois'>('hoje');
  const [expandedMeal, setExpandedMeal] = useState<string | null>('almoço');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0B0D] text-white">
      {/* Header */}
      {(activeTab === 'home' || activeTab === 'plan') && (
        <header className="px-6 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
              {activeTab === 'home' ? `Olá, ${userProfile?.name?.split(' ')[0] || 'Convidado'} 👋` : 'Plano alimentar'}
            </h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
              {activeTab === 'home' ? 'Sábado, 02 De Maio' : 'Alimentação equilibrada - 2000 kcal/dia'}
            </p>
          </div>
          {activeTab === 'home' ? (
            <div className="relative">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 relative">
                <Bell size={20} className="text-white/40" />
              </div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF4F4F] rounded-full border-2 border-[#0A0B0D]" />
            </div>
          ) : (
            <button className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 border-2 border-[#4ADE80] rounded-2xl text-[#4ADE80] gap-1 group active:scale-95 transition-all">
              <RefreshCcw size={16} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[7px] font-black uppercase text-center leading-[1.1] px-1">Receber Plano</span>
            </button>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
              
              {/* Streak Card */}
              <div className="p-5 rounded-[28px] bg-[#1a2e24] border border-[#4ADE80]/20 flex items-center justify-between shadow-xl shadow-[#4ADE80]/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FFB800]/10 rounded-2xl flex items-center justify-center">
                    <Flame className="text-[#FFB800]" size={24} fill="#FFB800" fillOpacity={0.2} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#4ADE80] mb-0.5">0 Dias Seguidos Cuidando de Ti!</h3>
                    <p className="text-[#4ADE80]/40 text-[10px] font-bold">Continua assim — és incrível!</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-[#4ADE80] text-[#0A0B0D] text-[10px] font-black rounded-full shadow-lg shadow-[#4ADE80]/20">
                  Manter
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#121417] border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-xl font-black block mb-0.5">0</span>
                  <div className="flex items-center justify-center gap-1.5 text-white/20">
                    <Coffee size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Refeições</span>
                  </div>
                </div>
                <div className="bg-[#121417] border-2 border-[#4ADE80]/30 rounded-2xl p-4 text-center shadow-lg shadow-[#4ADE80]/5">
                  <span className="text-xl font-black block mb-0.5">0</span>
                  <div className="flex items-center justify-center gap-1.5 text-white/20">
                    <Droplets size={10} className="text-[#FFD600]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">kcal hoje</span>
                  </div>
                </div>
                <div className="bg-[#121417] border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-xl font-black block mb-0.5">Comer</span>
                  <div className="flex items-center justify-center gap-1.5 text-white/20">
                    <Target size={10} className="text-[#FF4F4F]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Objectivo</span>
                  </div>
                </div>
              </div>

              {/* Calorie Progress */}
              <div className="bg-[#121417] border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-black text-sm">Calorias hoje</h3>
                  <div className="text-right">
                    <span className="text-white/20 text-[10px] font-bold block uppercase tracking-widest">0 / 2000 kcal</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6">
                  <div className="w-1/12 h-full bg-[#4ADE80] rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Proteína', val: '62g', color: '#4ADE80', bg: '#4ADE80/10' },
                    { label: 'Carbs', val: '138g', color: '#FFB800', bg: '#FFB800/10' },
                    { label: 'Gordura', val: '48g', color: '#00D1FF', bg: '#00D1FF/10' },
                    { label: 'Fibras', val: '18g', color: '#A855F7', bg: '#A855F7/10' }
                  ].map(m => (
                    <div key={m.label} className="p-2 border rounded-xl flex flex-col items-center justify-center" style={{ borderColor: `${m.color}20` }}>
                      <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: m.color }} />
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter mb-1">{m.label}</span>
                      <span className="text-[11px] font-black">{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <button 
                onClick={() => setShowScanner(true)}
                className="w-full p-6 bg-[#4ADE80] rounded-[32px] flex items-center justify-between group shadow-2xl shadow-[#4ADE80]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-[#0A0B0D]/10 rounded-2xl flex items-center justify-center">
                    <Camera className="text-[#0A0B0D]" size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0A0B0D] text-base leading-tight">Consultar Análise da Nossa Equipa</h3>
                    <p className="text-[#0A0B0D]/50 text-[10px] font-bold leading-tight mt-1">Fotografa a tua refeição e recebe a análise completa</p>
                  </div>
                </div>
                <ChevronRight className="text-[#0A0B0D]" size={20} strokeWidth={3} />
              </button>

              {/* Specialist Tip */}
              <div className="p-6 bg-[#1a1710] border border-[#FFB800]/20 rounded-[32px] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FFB800]/10 rounded-xl flex items-center justify-center">
                    <Zap className="text-[#FFB800]" size={20} fill="#FFB800" fillOpacity={0.2} />
                  </div>
                  <div>
                    <h3 className="text-[#FFB800] font-black text-xs uppercase tracking-widest">Dica do Especialista</h3>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-tight">Hoje</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs font-medium leading-relaxed italic">
                  "Beber água antes das refeições ajuda a controlar as porções e o corpo vai agradecer!"
                </p>
              </div>

              {/* Today's Plan Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Plano de hoje</h3>
                  <button onClick={() => setActiveTab('plan')} className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">Ver tudo</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                  <MealThumbCard 
                    image="https://feed.continente.pt/media/i0zd0jpo/ovo-estrelado.jpg"
                    time="07:00"
                    label="Café da manhã"
                    name="Sandes de Ovo"
                    kcal="320 kcal"
                  />
                  <MealThumbCard 
                    image="https://static.novavaga.co.ao/global/image.jpg?brand=NJ&type=generate&guid=539a3c46-08bb-4efd-b7e5-6fc4f7635e2d"
                    time="12:30"
                    label="Almoço"
                    name="Mufete Completo"
                    kcal="620 kcal"
                    active
                  />
                  <MealThumbCard 
                    image="https://www.receitasdeculinaria.tv/wp-content/uploads/2022/09/calulu-de-peixe-misto.jpg"
                    time="19:00"
                    label="Jantar"
                    name="Calulu de Peixe"
                    kcal="480 kcal"
                  />
                </div>
              </div>

              {/* Habit Challenges Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Desafios de Hábito</h3>
                  <button className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">Ver todos</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ChallengeThumbCard 
                    icon={<div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">🚭</div>}
                    title="7 dias"
                    status="Em progresso"
                    color="#FF4F4F"
                    active
                  />
                  <ChallengeThumbCard 
                    icon={<div className="w-10 h-10 rounded-full bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF]"><Droplets size={20} /></div>}
                    title="14 dias"
                    status="Participar"
                    color="#00D1FF"
                  />
                </div>
              </div>

              {/* Recent Analysis Section */}
              <div className="space-y-4 pb-12">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Últimas análises</h3>
                  <button className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">Ver tudo</button>
                </div>
                <div className="space-y-3">
                  <AnalysisRow 
                    image="https://static.novavaga.co.ao/global/image.jpg?brand=NJ&type=generate&guid=539a3c46-08bb-4efd-b7e5-6fc4f7635e2d"
                    name="Mufete com Funge"
                    info="620 kcal • Almoço"
                    date="01/05/2026"
                    score={91}
                  />
                  <AnalysisRow 
                    image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS00w2w7pazlruPBQVQ_FjRfAFNdPeLXQ5JVg&s"
                    name="Frango com Quiabo e Arroz"
                    info="580 kcal • Almoço"
                    date="02/05/2026"
                    score={88}
                  />
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 pt-2 pb-12">
              
              {/* Day Selector */}
              <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/[0.03]">
                <button 
                  onClick={() => setActivePlanDay('hoje')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activePlanDay === 'hoje' ? 'bg-[#4ADE80] text-[#0A0B0D]' : 'text-white/30 hover:text-white'}`}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setActivePlanDay('amanhã')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activePlanDay === 'amanhã' ? 'bg-[#4ADE80] text-[#0A0B0D]' : 'text-white/30 hover:text-white'}`}
                >
                  Amanhã
                </button>
                <button 
                  onClick={() => setActivePlanDay('depois')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activePlanDay === 'depois' ? 'bg-[#4ADE80] text-[#0A0B0D]' : 'text-white/30 hover:text-white'}`}
                >
                  Depois
                </button>
              </div>

              {/* Stats Card */}
              <div className="bg-[#121417] border border-white/5 rounded-[32px] p-8 shadow-xl">
                 <div className="flex justify-between items-center mb-8">
                    <div className="text-center">
                      <span className="text-2xl font-black block leading-none">1600</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1 block">kcal no plano</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="text-center">
                      <span className="text-2xl font-black block leading-none">2000</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1 block">kcal objectivo</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="text-center">
                      <span className="text-2xl font-black block leading-none text-[#FF4F4F]">-400</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1 block">diferença</span>
                    </div>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[80%] h-full bg-[#4ADE80] rounded-full shadow-[0_0_12px_rgba(74,222,128,0.5)]" />
                 </div>
              </div>

              {/* Meals List */}
              <div className="space-y-3">
                 <MealCard 
                    icon={<Sun size={18} />} 
                    label="Café da manhã" 
                    time="07:00" 
                    kcal="320 kcal" 
                    isOpen={expandedMeal === 'café'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'café' ? null : 'café')}
                    details={{
                      image: "https://feed.continente.pt/media/i0zd0jpo/ovo-estrelado.jpg",
                      title: "Sandes de Ovo Nutritiva",
                      description: "Pão de água fresco com ovo mexido ou estrelado com pouco óleo. O início perfeito para um dia com energia estável.",
                      tags: ['Proteína', 'Saciedade', 'Rápido', 'Pequeno Almoço'],
                      prepTime: "5 min preparo",
                      macros: { protein: '18g', carbs: '35g', fat: '12g' },
                      micros: { vitamins: 'Vitamina D, B12, Colina', minerals: 'Fósforo, Ferro' },
                      ingredients: ['1 Pão de água ou integral', '2 Ovos frescos', 'Fio de azeite ou óleo', 'Sal e pimenta preta'],
                      health: {
                        recommendedFor: 'Estudantes e trabalhadores que precisam de concentração e evitar fome no meio da manhã.',
                        avoidIf: 'Indivíduos com restrição severa de colesterol devem usar apenas as claras.',
                        general: 'A colina presente na gema do ovo é essencial para a memória e saúde cerebral.'
                      },
                      steps: [
                        'Aqueça levemente o pão para ficar crocante.',
                        'Numa frigideira antiaderente, coloque um fio de óleo.',
                        'Prepare os ovos (estrelados ou mexidos) temperando com pouco sal.',
                        'Coloque os ovos no pão e feche.',
                        'Acompanhe com um chá de gengibre ou café sem açúcar.'
                      ]
                    }}
                 />
                 
                 <MealCard 
                    icon={<Sun size={18} />} 
                    label="Almoço" 
                    time="12:30" 
                    kcal="620 kcal" 
                    isOpen={expandedMeal === 'almoço'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'almoço' ? null : 'almoço')}
                    details={{
                      image: "https://static.novavaga.co.ao/global/image.jpg?brand=NJ&type=generate&guid=539a3c46-08bb-4efd-b7e5-6fc4f7635e2d",
                      title: "Mufete Completo",
                      description: "Peixe grelhado (tilápia ou cacusso), funge de milho, feijão de óleo de palma e banana da terra. O prato mais nutritivo de Angola!",
                      tags: ['Proteína', 'Ferro', 'Energia', 'Tradicional'],
                      prepTime: "35 min preparo",
                      macros: { protein: '45g', carbs: '82g', fat: '18g' },
                      micros: { vitamins: 'Vitamina B12, B6, Vitamina D', minerals: 'Ferro, Selénio, Óleo de Palma (Betacaroteno)' },
                      ingredients: ['Peixe Tilápia ou Cacuso', 'Farinha de Milho', 'Feijão Manteiga', 'Óleo de Palma', 'Banana Pão', 'Cebola, Alho, Sal'],
                      health: {
                        recommendedFor: 'Atletas, pessoas em fase de crescimento e para prevenir anemia ferropriva.',
                        avoidIf: 'Pessoas com ácido úrico elevado (Gota) devem moderar a porção de feijão.',
                        general: 'O óleo de palma angolano é uma das melhores fontes naturais de Betacaroteno (Vitamina A).'
                      },
                      steps: [
                        'Tempere o peixe com sal, alho e limão, e grelhe na brasa.',
                        'Cozinhe o feijão até ficar macio e tempere com óleo de palma.',
                        'Prepare o funge mexendo a farinha de milho em água quente até dar o ponto.',
                        'Cozas as bananas em água e sal.',
                        'Prepare o molho de cebola, malagueta e vinagrete para acompanhar.'
                      ]
                    }}
                 />

                 <MealCard 
                    icon={<Moon size={18} />} 
                    label="Jantar" 
                    time="19:00" 
                    kcal="480 kcal" 
                    isOpen={expandedMeal === 'jantar'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'jantar' ? null : 'jantar')}
                    details={{
                      image: "https://www.receitasdeculinaria.tv/wp-content/uploads/2022/09/calulu-de-peixe-misto.jpg",
                      title: "Calulu de Peixe",
                      description: "Tradicional calulu de peixe misto acompanhado com funge. Prato rico em ómega-3 e fibras vegetais das folhas.",
                      tags: ['Ómega-3', 'Nutritivo', 'Tradicional', 'Fibras'],
                      prepTime: "45 min preparo",
                      macros: { protein: '38g', carbs: '65g', fat: '12g' },
                      micros: { vitamins: 'Vitamina K, Vitamina E, Magnésio', minerals: 'Cálcio, Potássio' },
                      ingredients: ['Peixe Fresco e Seco', 'Folhas de Rama de Batata ou Espinafre', 'Gongo ou Quiabos', 'Óleo de Palma', 'Cebola, Tomate'],
                      health: {
                        recommendedFor: 'Saúde cardiovascular e controle do colesterol devido às gorduras saudáveis e fibras.',
                        avoidIf: 'Indivíduos sensíveis ao excesso de oxalatos (presentes em algumas folhas verdes).',
                        general: 'As folhas verdes do calulu são excelentes para a saúde óssea devido ao alto teor de minerais.'
                      },
                      steps: [
                        'Coloque o peixe de molho se for seco. Limpe o peixe fresco.',
                        'Faça um refogado de cebola e tomate no óleo de palma.',
                        'Adicione o peixe e as folhas verdes em camadas.',
                        'Adicione os quiabos e deixe cozer em lume brando até as folhas murcharem.',
                        'Acompanhe com funge de milho ou bombó.'
                      ]
                    }}
                 />

                 <MealCard 
                    icon={<Coffee size={18} />} 
                    label="Lanche" 
                    time="15:30" 
                    kcal="220 kcal" 
                    isOpen={expandedMeal === 'lanche'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'lanche' ? null : 'lanche')}
                    details={{
                      image: "https://www.receitaafetiva.com.br/wp-content/uploads/2019/06/receita-de-arroz-doce-com-leite-condensado-12.jpg",
                      title: "Arroz Doce Tradicional",
                      description: "O conforto num prato. Arroz cozido em leite cremoso com um toque de canela para aquecer o coração.",
                      tags: ['Energia', 'Cremoso', 'Tradicional', 'Doce'],
                      prepTime: "25 min preparo",
                      macros: { protein: '6g', carbs: '45g', fat: '4g' },
                      micros: { vitamins: 'Vitamina B2, Cálcio', minerals: 'Zinco, Fósforo' },
                      ingredients: ['1 chávena de Arroz', '2 chávenas de Leite', 'Casca de limão ou laranja', 'Pau de canela', 'Canela em pó'],
                      health: {
                        recommendedFor: 'Pessoas que precisam de um aporte extra de energia rápida ou pós-treino moderado.',
                        avoidIf: 'Diabéticos devem substituir o açúcar por adoçante culinário ou evitar.',
                        general: 'A canela ajuda a regular ligeiramente os picos de insulina causados pelo arroz.'
                      },
                      steps: [
                        'Coza o arroz em água com a casca de limão e o pau de canela até a água secar.',
                        'Adicione o leite aos poucos, mexendo sempre.',
                        'Deixe cozinhar em lume brando até o arroz ficar muito macio e o leite cremoso.',
                        'Adoce a gosto no final do processo.',
                        'Sirva polvilhado com canela em pó por cima.'
                      ]
                    }}
                 />
              </div>

              {/* Personalized Plan CTA */}
              <button className="w-full p-6 bg-[#FFB800] rounded-[32px] flex items-center justify-between group shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-[#0A0B0D]/10 rounded-2xl flex items-center justify-center">
                    <Calendar className="text-[#0A0B0D]" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0A0B0D] text-sm leading-tight">Receber Plano Personalizado</h3>
                    <p className="text-[#0A0B0D]/50 text-[9px] font-bold leading-tight mt-1 uppercase tracking-tight">Plano semanal adaptado ao teu perfil e objectivos</p>
                  </div>
                </div>
                <ChevronRight className="text-[#0A0B0D]" size={20} strokeWidth={3} />
              </button>

              {/* Nutritional Tip card */}
              <div className="p-6 bg-[#1a1710] border border-[#FFB800]/20 rounded-[32px]">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#FFB800]/10 rounded-2xl flex items-center justify-center">
                       <Zap className="text-[#FFB800]" size={20} fill="#FFB800" fillOpacity={0.2} />
                    </div>
                    <span className="text-[#FFB800] font-black text-xs uppercase tracking-widest">Dica nutricional</span>
                 </div>
                 <p className="text-white/60 text-xs font-medium leading-[1.6]">
                    O Mufete angolano é considerado um dos pratos mais completos nutricionalmente! Rico em proteína do peixe, ferro do feijão e energia do funge — perfeito para um almoço de alta performance.
                 </p>
              </div>

            </motion.div>
          )}

          {activeTab === 'community' && (
            <div className="flex-1 flex items-center justify-center text-white/20">
              <p>Comunidade a chegar em breve 👥</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6 pt-4 pb-12">
               {/* User Header */}
               <div className="flex flex-col items-center gap-4 py-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[36px] bg-white/5 border-2 border-white/5 flex items-center justify-center overflow-hidden">
                      <User size={48} className="text-white/20" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#4ADE80] rounded-2xl flex items-center justify-center text-[#0A0B0D] shadow-xl border-4 border-[#0A0B0D]">
                      <Edit3 size={16} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tight">{userProfile?.name || 'Utilizador'}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-[#4ADE80]/10 text-[#4ADE80] text-[10px] font-black rounded-full uppercase tracking-widest border border-[#4ADE80]/10">Plano {userProfile?.subscription_plan || 'Grátis'}</span>
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">{userProfile?.province}</span>
                    </div>
                  </div>
               </div>

               {/* Health Data Grid */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Dados de Saúde & Quiz</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ProfileDataCard label="Peso" value={`${userProfile?.weight || '--'} kg`} icon={<Zap size={14} className="text-[#4ADE80]" />} />
                    <ProfileDataCard label="Altura" value={`${userProfile?.height || '--'} cm`} icon={<Target size={14} className="text-[#00D1FF]" />} />
                    <ProfileDataCard label="Objectivo" value={userProfile?.goal === 'weight_loss' ? 'Perder Peso' : 'Comer Melhor'} icon={<Activity size={14} className="text-[#FFB800]" />} />
                    <ProfileDataCard label="Dieta" value={userProfile?.diet === 'omnivore' ? 'Omnívoro' : 'Equilibrado'} icon={<Heart size={14} className="text-[#A855F7]" />} />
                  </div>
                  
                  {/* Restrictions / Allergies */}
                  <div className="p-5 bg-[#121417] border border-white/5 rounded-3xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <AlertCircle size={16} className="text-red-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-white/60">Alergias & Restrições</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {userProfile?.restrictions && userProfile.restrictions.length > 0 ? (
                         userProfile.restrictions.map((r: string) => (
                           <span key={r} className="px-3 py-1.5 bg-white/5 text-white/60 text-[11px] font-bold rounded-xl border border-white/5">{r}</span>
                         ))
                       ) : (
                         <p className="text-[11px] text-white/20 font-medium italic">Nenhuma restrição registada.</p>
                       )}
                    </div>
                  </div>
               </div>

               {/* App Settings */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Configurações do App</h3>
                  <div className="bg-[#121417] border border-white/5 rounded-[32px] overflow-hidden">
                    <SettingItem icon={<Bell size={18} />} label="Notificações de Refeição" value="Ativo" />
                    <SettingItem icon={<Type size={18} />} label="Modo Acessibilidade" value="Letras Médias" />
                    <SettingItem icon={<Moon size={18} />} label="Tema" value="Escuro" />
                    <SettingItem icon={<Globe size={18} />} label="Idioma" value="Português (AO)" />
                    <SettingItem icon={<Share2 size={18} />} label="Partilhar App" onClick={() => {}} />
                    <SettingItem icon={<Star size={18} />} label="Avaliar na Loja" last onClick={() => {}} />
                  </div>
               </div>

               <div className="pt-4 space-y-3">
                  <button onClick={onLogout} className="w-full py-5 bg-red-500/5 border border-red-500/10 text-red-500 font-black rounded-3xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
                    <LogOut size={18} /> SAIR DA CONTA
                  </button>
                  <button className="w-full py-4 text-white/10 text-[9px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors">
                    Remover todos os dados da conta
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-[#0A0B0D]/90 backdrop-blur-xl border-t border-white/[0.03] z-[60]">
        <div className="flex items-center justify-between">
          <NavButton active={activeTab === 'home'} icon={<HomeIcon active={activeTab === 'home'} />} label="Início" onClick={() => setActiveTab('home')} />
          <NavButton active={activeTab === 'plan'} icon={<Calendar size={22} />} label="Plano" onClick={() => setActiveTab('plan')} />
          
          {/* Floating Camera Button */}
          <div className="relative -mt-12">
            <button 
              onClick={() => setShowScanner(true)}
              className="w-16 h-16 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-2xl shadow-[#4ADE80]/30 hover:scale-110 active:scale-95 transition-all"
            >
              <Camera className="text-[#0A0B0D]" size={30} strokeWidth={2.5} />
            </button>
          </div>
          
          <NavButton active={activeTab === 'community'} icon={<Users size={22} />} label="Nossa Terra" onClick={() => setActiveTab('community')} />
          <NavButton active={activeTab === 'profile'} icon={<User size={22} />} label="Perfil" onClick={() => setActiveTab('profile')} />
        </div>
      </footer>

      {/* Overlays */}
      <AnimatePresence>
        {showScanner && (
          <Overlay title="Análise Nutricional" onClose={() => { setShowScanner(false); setPreviewUrl(null); setScannerResult(null); }}>
             <ScannerContent 
                previewUrl={previewUrl} 
                isAnalyzing={isAnalyzing} 
                scannerResult={scannerResult} 
                onUpload={handleFileUpload}
                onClose={() => { setShowScanner(false); setPreviewUrl(null); setScannerResult(null); }}
                fileInputRef={fileInputRef}
             />
          </Overlay>
        )}
        {showChat && (
          <Overlay title="Assistente kidiaNutri" onClose={() => setShowChat(false)}>
             <ChatContent 
                messages={messages} 
                isTyping={isTyping} 
                input={input} 
                setInput={setInput} 
                onSend={handleSendMessage} 
                chatEndRef={chatEndRef} 
             />
          </Overlay>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      {!showChat && !showScanner && (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-32 right-6 w-14 h-14 bg-[#121417] border border-white/10 rounded-full flex items-center justify-center shadow-2xl z-50 text-[#4ADE80]"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <div className={`relative ${active ? 'text-[#4ADE80]' : 'text-white/20'}`}>
      <Activity size={22} />
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4ADE80] rounded-full" />}
    </div>
  );
}

function MealCard({ icon, label, time, kcal, isOpen, onToggle, details }: { icon: any, label: string, time: string, kcal: string, isOpen: boolean, onToggle: () => void, details?: any }) {
  return (
    <div className={`bg-[#121417] border border-white/5 rounded-[32px] overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-2xl' : 'shadow-sm'}`}>
      <button onClick={onToggle} className="w-full p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOpen ? 'bg-[#FFB800]/20 text-[#FFB800]' : 'bg-white/5 text-white/20'}`}>
              {icon}
           </div>
           <div className="text-left">
              <h4 className="text-sm font-black text-white">{label}</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{time}</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className={`text-[12px] font-black ${isOpen ? 'text-[#4ADE80]' : 'text-white/30'}`}>{kcal}</span>
           <ChevronRight size={18} className={`text-white/10 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      {isOpen && details && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-1 py-1 pb-4">
           <div className="bg-[#0A0B0D] rounded-[28px] overflow-hidden m-2 border border-white/[0.05]">
             <div className="relative aspect-video">
                <img src={details.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex gap-1.5">
                   {details.tags.slice(0, 2).map((t: string) => (
                    <span key={t} className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-xl">
                      {t}
                    </span>
                   ))}
                </div>
             </div>

             <div className="p-6">
                <h3 className="text-xl font-black text-white leading-tight mb-2">{details.title}</h3>
                <p className="text-white/40 text-xs font-medium leading-relaxed italic mb-6">
                  {details.description}
                </p>

                {/* Advanced Nutritional Info Grid */}
                {details.macros && (
                  <div className="grid grid-cols-3 gap-3 mb-8">
                     <NutriMetric label="Proteína" value={details.macros.protein} color="#4ADE80" />
                     <NutriMetric label="Carbos" value={details.macros.carbs} color="#FFB800" />
                     <NutriMetric label="Gordura" value={details.macros.fat} color="#00D1FF" />
                  </div>
                )}

                {/* Micronutrients */}
                {details.micros && (
                  <div className="space-y-4 mb-8 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.03]">
                     <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-[#FFB800]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Micronutrientes Chave</span>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[11px] text-white/60 font-medium leading-tight">
                           <span className="text-white font-black uppercase tracking-tighter mr-1">Vitaminas:</span> {details.micros.vitamins}
                        </p>
                        <p className="text-[11px] text-white/60 font-medium leading-tight">
                           <span className="text-white font-black uppercase tracking-tighter mr-1">Minerais:</span> {details.micros.minerals}
                        </p>
                     </div>
                  </div>
                )}

                {/* Health Advice Section */}
                {details.health && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-[#FF4F4F]" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-[#FF4F4F]">Conselho de Saúde</h4>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="p-4 bg-[#4ADE80]/5 border border-[#4ADE80]/10 rounded-2xl">
                          <span className="text-[9px] font-black text-[#4ADE80] uppercase tracking-widest block mb-1">Indicado Para:</span>
                          <p className="text-[11px] text-[#4ADE80]/70 font-medium italic leading-relaxed">{details.health.recommendedFor}</p>
                       </div>
                       <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Cuidado se:</span>
                          <p className="text-[11px] text-red-500/70 font-medium italic leading-relaxed">{details.health.avoidIf}</p>
                       </div>
                       <div className="flex items-start gap-3 px-1">
                          <Info size={14} className="text-white/20 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-white/30 font-medium leading-relaxed italic">{details.health.general}</p>
                       </div>
                    </div>
                  </div>
                )}

                {/* Ingredients & Prep Steps */}
                <div className="space-y-6 pt-6 border-t border-white/[0.03]">
                  {details.ingredients && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-1 h-1 bg-[#FFB800] rounded-full" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Composição Principal</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {details.ingredients.map((ing: string) => (
                           <span key={ing} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white/40">{ing}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.steps && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="w-1 h-1 bg-[#4ADE80] rounded-full" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Modo de Preparo</span>
                      </div>
                      <div className="space-y-3">
                        {details.steps.map((step: string, idx: number) => (
                          <div key={idx} className="flex gap-4">
                             <span className="text-[10px] font-black text-[#4ADE80] opacity-30 mt-0.5">{String(idx+1).padStart(2, '0')}</span>
                             <p className="text-[11px] text-white/50 leading-relaxed font-medium">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/20">
                       <History size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{details.prepTime}</span>
                    </div>
                    <button className="px-6 py-4 bg-[#4ADE80] text-[#0A0B0D] text-[10px] font-black rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#4ADE80]/10">
                       <Plus size={16} strokeWidth={4} /> Adicionar ao diário
                    </button>
                  </div>
                </div>
             </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}

function NutriMetric({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
       <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">{label}</span>
       <span className="text-sm font-black" style={{ color }}>{value}</span>
    </div>
  );
}

function MealThumbCard({ image, time, label, name, kcal, active }: { image: string, time: string, label: string, name: string, kcal: string, active?: boolean }) {
  return (
    <div className={`relative min-w-[160px] h-56 rounded-[32px] overflow-hidden group border-2 transition-all ${active ? 'border-[#4ADE80] shadow-2xl shadow-[#4ADE80]/10 scale-105 z-10' : 'border-white/5 opacity-80'}`}>
      <img src={image} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex flex-col gap-0.5">
           <span className="text-[#4ADE80] text-[8px] font-black uppercase tracking-widest">{time}</span>
           <span className="text-white/40 text-[7px] font-bold uppercase tracking-tighter">{label}</span>
           <h4 className="text-xs font-black text-white leading-tight mt-1 line-clamp-1 uppercase">{name}</h4>
           <span className="text-[#FFB800] text-[10px] font-black mt-1">{kcal}</span>
        </div>
      </div>
    </div>
  );
}

function ChallengeThumbCard({ icon, title, status, color, active }: { icon: any, title: string, status: string, color: string, active?: boolean }) {
  return (
    <div className="p-6 bg-[#121417] border border-white/5 rounded-[32px] relative overflow-hidden group" style={{ borderColor: active ? `${color}40` : '' }}>
       <div className="flex flex-col items-center gap-3 relative z-10">
          {icon}
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</span>
          <button 
            className="w-full py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
            style={{ 
              backgroundColor: active ? `${color}20` : 'transparent', 
              color: color,
              border: `1.5px solid ${active ? 'transparent' : `${color}40`}`
            }}
          >
            {status}
          </button>
       </div>
       <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: color }} />
    </div>
  );
}

function AnalysisRow({ image, name, info, date, score }: { image: string, name: string, info: string, date: string, score: number }) {
  return (
    <div className="p-4 bg-[#121417] border border-white/5 rounded-[32px] flex items-center gap-4 group hover:bg-white/[0.02] transition-colors">
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
        <img src={image} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{name}</h4>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{info}</p>
        <p className="text-[8px] font-bold text-white/10 uppercase mt-1">{date}</p>
      </div>
      <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center relative bg-black/20 group-hover:border-[#4ADE80]/30 transition-colors">
        <span className="text-sm font-black text-[#4ADE80]">{score}</span>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4ADE80] animate-spin-slow opacity-0 group-hover:opacity-50" />
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`${active ? 'text-[#4ADE80]' : 'text-white/20'} transition-all`}>{icon}</div>
      <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-[#4ADE80]' : 'text-white/20'}`}>{label}</span>
    </button>
  );
}

function SettingItem({ icon, label, value, last, onClick }: { icon: any, label: string, value?: string, last?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full p-5 flex items-center justify-between group transition-colors hover:bg-white/[0.02] ${!last ? 'border-b border-white/[0.03]' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="text-white/30 group-hover:text-[#4ADE80] transition-colors">{icon}</div>
        <span className="text-sm font-bold text-white/80">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-[#4ADE80] transition-colors">{value}</span>}
        <ChevronRight size={14} className="text-white/10 group-hover:text-[#4ADE80]" />
      </div>
    </button>
  );
}

function ProfileDataCard({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="p-5 bg-[#121417] border border-white/5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <Edit3 size={10} className="text-white" />
      </div>
      <div className="mb-2">{icon}</div>
      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-sm font-black text-white tracking-tight">{value}</span>
    </div>
  );
}

function Overlay({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0A0B0D] z-[100] flex flex-col">
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
        <h2 className="text-base font-black uppercase tracking-widest">{title}</h2>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl border border-white/5 text-white/40"><X size={20} /></button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
}

function ScannerContent({ previewUrl, isAnalyzing, scannerResult, onUpload, onClose, fileInputRef }: any) {
  const [selectedMealType, setSelectedMealType] = useState('almoço');

  const mealTypes = [
    { id: 'café', label: 'Café da manhã', time: '7:00 - 10:00', ex: 'Ex: Papaia, pão, ovos', icon: <Sun size={18} /> },
    { id: 'almoço', label: 'Almoço', time: '11:30 - 14:00', ex: 'Ex: Mufete, arroz e feijão', icon: <Sun size={18} className="text-[#4ADE80]" /> },
    { id: 'jantar', label: 'Jantar', time: '18:00 - 21:00', ex: 'Ex: Calulu, sopa', icon: <Moon size={18} /> },
    { id: 'lanche', label: 'Lanche', time: 'Qualquer hora', ex: 'Ex: Amendoim, fruta', icon: <Coffee size={18} /> },
  ];

  return (
    <div className="p-6 h-full flex flex-col space-y-8">
       {!previewUrl ? (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">Analisar refeição</h2>
              <p className="text-white/30 text-sm font-medium">Fotografa o teu prato para uma análise completa</p>
            </div>

            {/* Main Capture Card */}
            <div className="relative rounded-[40px] overflow-hidden aspect-[4/3] bg-[#121417] border border-white/5 group shadow-2xl">
              <img 
                src="https://static.novavaga.co.ao/global/image.jpg?brand=NJ&type=generate&guid=539a3c46-08bb-4efd-b7e5-6fc4f7635e2d" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" 
                alt="Background"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 bg-[#4ADE80]/10 rounded-full flex items-center justify-center border-4 border-[#4ADE80] mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)] active:scale-90 transition-transform"
                >
                  <Camera className="text-[#4ADE80]" size={32} strokeWidth={2.5} />
                </button>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Fotografa o teu prato</h3>
                <p className="text-white/40 text-[10px] font-bold leading-relaxed max-w-[220px]">
                  Aponta a câmara para a refeição e recebe a análise nutricional completa em segundos
                </p>

                <div className="flex gap-4 mt-8 w-full">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-[#4ADE80]/10 border-2 border-[#4ADE80] rounded-[24px] flex items-center justify-center gap-2 text-[#4ADE80] font-black text-xs uppercase tracking-widest shadow-xl">
                    <Camera size={16} /> Câmara
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-[#FFB800]/10 border-2 border-[#FFB800] rounded-[24px] flex items-center justify-center gap-2 text-[#FFB800] font-black text-xs uppercase tracking-widest shadow-xl">
                    <ImageIcon size={16} /> Galeria
                  </button>
                </div>
              </div>
            </div>

            {/* Meal Type Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Tipo de refeição</h3>
              <div className="grid grid-cols-2 gap-3">
                {mealTypes.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setSelectedMealType(type.id)}
                    className={`p-5 rounded-[28px] border-2 text-left transition-all ${selectedMealType === type.id ? 'bg-[#4ADE80]/5 border-[#4ADE80]' : 'bg-[#121417] border-white/5 opacity-60'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={selectedMealType === type.id ? 'text-[#4ADE80]' : 'text-white/20'}>{type.icon}</div>
                    </div>
                    <h4 className={`text-xs font-black ${selectedMealType === type.id ? 'text-[#4ADE80]' : 'text-white'}`}>{type.label}</h4>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">{type.time}</p>
                    <p className="text-[8px] font-medium text-white/40 italic mt-1">{type.ex}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="p-8 bg-[#121417] border border-white/5 rounded-[32px] space-y-5">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Como obter a melhor análise</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Sun size={18} className="text-[#4ADE80]" />
                  <span className="text-xs font-bold text-white/60">Boa iluminação melhora muito a precisão</span>
                </div>
                <div className="flex items-center gap-4">
                  <Maximize size={18} className="text-[#4ADE80]" />
                  <span className="text-xs font-bold text-white/60">Enquadra todo o prato na foto</span>
                </div>
                <div className="flex items-center gap-4">
                  <Eye size={18} className="text-[#4ADE80]" />
                  <span className="text-xs font-bold text-white/60">Evita sombras ou reflexos</span>
                </div>
                <div className="flex items-center gap-4">
                  <Utensils size={18} className="text-[#4ADE80]" />
                  <span className="text-xs font-bold text-white/60">Funciona com pratos angolanos e internacionais</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-4 pb-20">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-[32px] flex items-center justify-center gap-3 shadow-2xl shadow-[#4ADE80]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Camera size={22} strokeWidth={3} /> ABRIR CÂMERA
              </button>
              <button className="w-full py-6 border-2 border-[#4ADE80] text-[#4ADE80] font-black rounded-[32px] flex items-center justify-center gap-3 hover:bg-[#4ADE80]/5 transition-all">
                <Scan size={22} strokeWidth={3} /> IDENTIFICAR PRODUTO RAPIDAMENTE
              </button>
            </div>

            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onUpload} />
          </>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-[32px] overflow-hidden border border-white/10 aspect-square bg-[#121417] shadow-2xl">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-transparent opacity-60" />
            </div>
            
            {isAnalyzing && (
              <div className="p-10 rounded-[32px] flex flex-col items-center gap-6 bg-white/5 border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#4ADE80]/10 overflow-hidden">
                  <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-[#4ADE80]" />
                </div>
                <Loader2 className="text-[#4ADE80] animate-spin" size={40} strokeWidth={3} />
                <div className="text-center">
                  <p className="text-[#4ADE80] font-black text-xs uppercase tracking-[0.2em]">Digitando Componentes...</p>
                  <p className="text-white/20 text-[10px] font-bold uppercase mt-1">A IA está a dissecar a tua refeição</p>
                </div>
              </div>
            )}

            {scannerResult && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6 pb-20">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[32px] text-center shadow-xl">
                  <h4 className="text-white/20 font-black uppercase text-[10px] tracking-widest mb-2">Refeição Identificada</h4>
                  <p className="text-3xl font-black uppercase tracking-tight text-[#4ADE80]">{scannerResult.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center">
                    <Zap size={24} className="text-[#4ADE80] mb-3" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Calorias</span>
                    <span className="text-2xl font-black">{scannerResult.calories}</span>
                  </div>
                  <div className="p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center">
                    <Activity size={24} className="text-[#00D1FF] mb-3" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Proteína</span>
                    <span className="text-2xl font-black">{scannerResult.protein}</span>
                  </div>
                </div>

                <div className="p-8 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-[32px] shadow-lg">
                  <div className="flex items-center gap-3 mb-4 text-[#4ADE80]">
                    <Zap size={20} strokeWidth={3} />
                    <span className="font-black text-xs uppercase tracking-widest">Dica Neon</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed font-medium italic">
                    "{scannerResult.healthTip}"
                  </p>
                </div>

                <button onClick={onClose} className="w-full py-6 border border-white/10 text-white/40 font-black rounded-[32px] text-xs uppercase tracking-widest hover:text-[#4ADE80] hover:border-[#4ADE80]/40 transition-all">
                  Concluir Análise
                </button>
              </motion.div>
            )}
          </div>
        )}
    </div>
  );
}

function ChatContent({ messages, isTyping, input, setInput, onSend, chatEndRef }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m: any, i: number) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[24px] p-5 text-sm leading-relaxed font-medium ${m.role === 'user' ? 'bg-[#4ADE80] text-[#0A0B0D] font-black' : 'bg-white/5 border border-white/5 text-white/90'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 animate-pulse flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">kidiaNutri está a escrever...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <footer className="p-6 pt-0 pb-12">
        <div className="flex gap-2 p-2 bg-white/5 border border-white/5 rounded-[28px] items-center focus-within:border-[#4ADE80]/50 transition-all shadow-xl">
          <input 
            type="text" 
            placeholder="Faz a tua pergunta ao Nutri..." 
            className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm placeholder:text-white/20 font-medium" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onSend()} 
          />
          <button 
            onClick={onSend} 
            disabled={isTyping} 
            className="w-12 h-12 bg-[#4ADE80] text-[#0A0B0D] rounded-full flex items-center justify-center shadow-lg shadow-[#4ADE80]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={20} strokeWidth={3} />
          </button>
        </div>
      </footer>
    </div>
  );
}

