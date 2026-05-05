import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  CheckCircle2,
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
interface AnalysisResult { 
  name: string; 
  calories: string; 
  protein: string; 
  carbs: string; 
  fat: string; 
  healthTip: string; 
  suggestion: string; 
}

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'community' | 'profile'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu assistente de nutrição Neon. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTimer, setAnalysisTimer] = useState(0);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [hoursToReset, setHoursToReset] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeMealType, setActiveMealType] = useState<string | null>(null);
  const [scannerResult, setScannerResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentDateStr = useMemo(() => {
    const d = new Date();
    const weekday = d.toLocaleDateString('pt-PT', { weekday: 'long' });
    const day = d.toLocaleDateString('pt-PT', { day: '2-digit' });
    const month = d.toLocaleDateString('pt-PT', { month: 'long' });
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    
    return `${capitalize(weekday)}, ${day} de ${capitalize(month)}`;
  }, []);

  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([
    { id: 'water', title: 'Beber Água', target: 8, current: 0, icon: <Droplets />, color: '#00D1FF' },
    { id: 'nosugar', title: 'Sem Açúcar', target: 1, current: 0, icon: <Apple />, color: '#FF4F4F' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { 
    loadChatHistory(); 
    loadScanHistory(); 
    loadUserProfile();
  }, []);

  const getClient = () => getSupabase();

  useEffect(() => {
    let timer: any;
    if (analysisTimer > 0) {
      timer = setInterval(() => {
        setAnalysisTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [analysisTimer]);

  const checkDailyLimit = () => {
    if (session.email === 'admin@gmail.com') return true;
    
    const today = new Date().toISOString().split('T')[0];
    const scansToday = scanHistory.filter(scan => {
      const scanDate = scan.date || (scan.created_at ? scan.created_at.split('T')[0] : null);
      return scanDate === today;
    }).length;
    
    if (scansToday >= 2) {
      setDailyLimitReached(true);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
      setHoursToReset(diff);
      return false;
    }
    return true;
  };

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

  const loadUserBadges = async () => {
    const { data } = await getClient().from('user_badges').select('*').eq('user_id', session.id);
    if (data) setUserBadges(data);
  };

  const startDailyQuiz = async () => {
    setShowQuiz(true);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    const { generateDailyQuiz } = await import('../services/geminiService.ts');
    const questions = await generateDailyQuiz(userProfile);
    setQuizQuestions(questions);
  };

  const updateChallenge = (id: string) => {
    setActiveChallenges(prev => prev.map(c => {
      if (c.id === id) {
        const next = c.current + 1;
        if (next >= c.target) {
          setShowSuccessToast(`Desafio ${c.title} Concluído!`);
          setTimeout(() => setShowSuccessToast(null), 3000);
          return { ...c, current: c.target };
        }
        return { ...c, current: next };
      }
      return c;
    }));
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
    if (!file) return;

    if (!checkDailyLimit()) return;
    if (analysisTimer > 0) {
      setShowSuccessToast(`Aguarde ${analysisTimer}s para nova análise`);
      setTimeout(() => setShowSuccessToast(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => { setPreviewUrl(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const confirmScan = (mealType?: string) => {
    if (previewUrl) {
      setActiveMealType(mealType || null);
      processImage(previewUrl, mealType);
    }
  };

  const processImage = async (base64: string, mealType?: string) => {
    setIsAnalyzing(true); 
    setScannerResult(null);
    setAnalysisError(null);
    setAnalysisTimer(30);

    try {
      const result = await analyzeFoodImage(base64, userProfile, mealType);
      if (!result || !result.name) {
        throw new Error("Não foi possível identificar o prato.");
      }
      setScannerResult(result);
      
      // Save scan history immediately if successful
      const { data: scanData } = await getClient().from('scan_history').insert({
        user_id: session.id,
        item_name: result.name,
        calories: parseFloat(result.calories),
        protein: parseFloat(result.protein),
        carbs: parseFloat(result.carbs),
        fat: parseFloat(result.fat),
        health_tip: result.healthTip,
        date: new Date().toISOString().split('T')[0]
      }).select();

      if (scanData) setScanHistory(prev => [scanData[0], ...prev]);
    } catch (error: any) { 
      console.error(error); 
      setAnalysisError(error.message || "Erro na análise. Tente novamente.");
    }
    finally { 
      setIsAnalyzing(false); 
    }
  };

  const addMealToDiary = async (meal: any) => {
    try {
      const caloriesValue = typeof meal.calories === 'string' ? parseFloat(meal.calories.replace(/[^\d.]/g, '')) : (meal.macros?.protein ? parseFloat(meal.macros.protein) : 0); // Simplified extraction
      
      // Better extraction for macros if they are in the 'macros' object
      const protein = meal.macros?.protein || meal.protein;
      const carbs = meal.macros?.carbs || meal.carbs;
      const fat = meal.macros?.fat || meal.fat;

      const pVal = typeof protein === 'string' ? parseFloat(protein.replace(/[^\d.]/g, '')) : 0;
      const cVal = typeof carbs === 'string' ? parseFloat(carbs.replace(/[^\d.]/g, '')) : 0;
      const fVal = typeof fat === 'string' ? parseFloat(fat.replace(/[^\d.]/g, '')) : 0;
      const calVal = typeof meal.calories === 'string' ? parseFloat(meal.calories.replace(/[^\d.]/g, '')) : 0 || (pVal * 4 + cVal * 4 + fVal * 9);

      await getClient().from('scan_history').insert({
        user_id: session.id, 
        date: new Date().toISOString().split('T')[0], 
        item_name: meal.name || meal.title,
        calories: calVal || 0, 
        protein: pVal || 0,
        carbs: cVal || 0, 
        fat: fVal || 0, 
        recommendation: meal.healthTip || meal.health?.general || ''
      });
      
      loadScanHistory();
      setShowSuccessToast("Refeição adicionada ao diário!");
      setTimeout(() => setShowSuccessToast(null), 3000);
    } catch (error) {
      console.error("Error adding to diary:", error);
    }
  };

  const [activePlanDay, setActivePlanDay] = useState<'hoje' | 'amanhã' | 'depois'>('hoje');
  const [expandedMeal, setExpandedMeal] = useState<string | null>('almoço');
  const [isProcessingPlan, setIsProcessingPlan] = useState(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<any>(null);

  const mealData: Record<string, any> = {
    'café': {
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
    },
    'almoço': {
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
        'Tempere o peixe with sal, alho e limão, e grelhe na brasa.',
        'Cozinhe o feijão até ficar macio e tempere com óleo de palma.',
        'Prepare o funge mexendo a farinha de milho em água quente até dar o ponto.',
        'Cozas as bananas em água e sal.',
        'Prepare o molho de cebola, malagueta e vinagrete para acompanhar.'
      ]
    },
    'jantar': {
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
    },
    'lanche': {
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
    }
  };

  const openMealDetail = (mealId: string) => {
    const data = mealData[mealId];
    if (data) {
      setSelectedMealForDetail(data);
    }
  };

  const handleRequestPersonalizedPlan = () => {
    setIsProcessingPlan(true);
    // Simular o "processamento pesado" de IA por 4 segundos
    setTimeout(() => {
      setIsProcessingPlan(false);
      setShowPricing(true);
    }, 4500);
  };

  const handleUpgrade = (planName: string) => {
    const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o plano ${planName} do kidiaNutri.`);
    window.open(`https://wa.me/244946188658?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-main transition-colors duration-300">
      {/* Header */}
      {(activeTab === 'home' || activeTab === 'plan') && (
        <header className="px-6 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
              {activeTab === 'home' ? `Olá, ${userProfile?.name?.split(' ')[0] || 'Convidado'} 👋` : 'Plano alimentar'}
            </h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
              {activeTab === 'home' ? currentDateStr : 'Alimentação equilibrada - 2000 kcal/dia'}
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
                    image={mealData['café'].image}
                    time="07:00"
                    label="Café da manhã"
                    name={mealData['café'].title}
                    kcal="320 kcal"
                    onClick={() => openMealDetail('café')}
                  />
                  <MealThumbCard 
                    image={mealData['almoço'].image}
                    time="12:30"
                    label="Almoço"
                    name={mealData['almoço'].title}
                    kcal="620 kcal"
                    active
                    onClick={() => openMealDetail('almoço')}
                  />
                  <MealThumbCard 
                    image={mealData['jantar'].image}
                    time="19:00"
                    label="Jantar"
                    name={mealData['jantar'].title}
                    kcal="480 kcal"
                    onClick={() => openMealDetail('jantar')}
                  />
                </div>
              </div>

              {/* Daily Quiz Section */}
              <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#4ADE80]/10 to-[#00D1FF]/10 border border-[#4ADE80]/20 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4ADE80]/20 rounded-xl">
                      <Star size={20} className="text-[#4ADE80]" fill="#4ADE80" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest">Quiz do Dia</h3>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">+50 Pontos Neon</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs font-medium leading-relaxed">
                    Testa os teus conhecimentos sobre a nossa culinária e ganha emblemas exclusivos!
                  </p>
                  <button 
                    onClick={startDailyQuiz}
                    className="w-full py-4 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#4ADE80]/20"
                  >
                    Começar Quiz Agora
                  </button>
                </div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#4ADE80]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              </div>

              {/* Habit Challenges Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Desafios de Hábito</h3>
                  <button className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">Ver todos</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activeChallenges.map(challenge => (
                    <ChallengeThumbCard 
                      key={challenge.id}
                      icon={challenge.icon}
                      title={challenge.title}
                      status={challenge.current >= challenge.target ? "Concluído" : `${challenge.current}/${challenge.target}`}
                      color={challenge.color}
                      active={challenge.current > 0}
                      progress={(challenge.current / challenge.target) * 100}
                      onClick={() => updateChallenge(challenge.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Emblems Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Meus Emblemas</h3>
                </div>
                <div className="space-y-3">
                   <BadgeRow icon={<Zap size={20} />} title="Explorador Neon" date="01/05" color="#4ADE80" />
                   <BadgeRow icon={<Target size={20} />} title="Foco Absoluto" date="02/05" color="#FF4F4F" />
                </div>
              </div>

              {/* Recent Analysis Section */}

              {/* Recent Analysis Section */}
              <div className="space-y-4 pb-12">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-black tracking-tight">Últimas análises</h3>
                  <button className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">Ver tudo</button>
                </div>
                <div className="space-y-3">
                  <AnalysisRow 
                    image={mealData['almoço'].image}
                    name={mealData['almoço'].title}
                    info="620 kcal • Almoço"
                    date="01/05/2026"
                    score={91}
                    onClick={() => openMealDetail('almoço')}
                  />
                  <AnalysisRow 
                    image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS00w2w7pazlruPBQVQ_FjRfAFNdPeLXQ5JVg&s"
                    name="Frango com Quiabo e Arroz"
                    info="580 kcal • Almoço"
                    date="02/05/2026"
                    score={88}
                    onClick={() => {
                      // Custom detail for the chicken dish
                      setSelectedMealForDetail({
                        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS00w2w7pazlruPBQVQ_FjRfAFNdPeLXQ5JVg&s",
                        title: "Frango com Quiabo e Arroz",
                        description: "Prato caseiro rico em fibras e proteínas, uma delícia tradicional.",
                        tags: ['Proteína', 'Fibras', 'Caseiro'],
                        prepTime: "40 min preparo",
                        macros: { protein: '32g', carbs: '58g', fat: '14g' },
                        micros: { vitamins: 'Vitamina C, B6', minerals: 'Zinco, Magnésio' },
                        ingredients: ['Frango', 'Quiabo fresco', 'Arroz branco', 'Cebola', 'Alho', 'Tomate'],
                        health: {
                          recommendedFor: 'Refeição equilibrada para o dia a dia.',
                          avoidIf: 'Indivíduos com sensibilidade ao quiabo.',
                          general: 'O quiabo é excelente para a saúde digestiva.'
                        },
                        steps: ['Prepare o arroz normalmente.', 'Refogue o frango com temperos.', 'Adicione o quiabo e deixe cozinhar até ficar macio.', 'Sirva com arroz.']
                      });
                    }}
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
                    details={mealData['café']}
                 />
                 
                 <MealCard 
                    icon={<Sun size={18} />} 
                    label="Almoço" 
                    time="12:30" 
                    kcal="620 kcal" 
                    isOpen={expandedMeal === 'almoço'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'almoço' ? null : 'almoço')}
                    details={mealData['almoço']}
                 />

                 <MealCard 
                    icon={<Moon size={18} />} 
                    label="Jantar" 
                    time="19:00" 
                    kcal="480 kcal" 
                    isOpen={expandedMeal === 'jantar'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'jantar' ? null : 'jantar')}
                    details={mealData['jantar']}
                 />

                 <MealCard 
                    icon={<Coffee size={18} />} 
                    label="Lanche" 
                    time="15:30" 
                    kcal="220 kcal" 
                    isOpen={expandedMeal === 'lanche'}
                    onToggle={() => setExpandedMeal(expandedMeal === 'lanche' ? null : 'lanche')}
                    details={mealData['lanche']}
                 />
              </div>

              {/* Personalized Plan CTA */}
              <button 
                onClick={handleRequestPersonalizedPlan}
                className="w-full p-6 bg-[#FFB800] rounded-[32px] flex items-center justify-between group shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
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
                    <SettingItem 
                      icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} 
                      label="Tema" 
                      value={theme === 'dark' ? 'Escuro' : 'Claro'} 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    />
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
      <footer className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-app-bg/90 backdrop-blur-xl border-t border-border-custom z-[60]">
        <div className="flex items-center justify-between">
          <NavButton active={activeTab === 'home'} icon={<HomeIcon active={activeTab === 'home'} />} label="Início" onClick={() => setActiveTab('home')} />
          <NavButton active={activeTab === 'plan'} icon={<Calendar size={22} />} label="Plano" onClick={() => setActiveTab('plan')} />
          
          {/* Floating Camera Button */}
          <div className="relative -mt-12">
            <button 
              onClick={() => setShowScanner(true)}
              className="w-16 h-16 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-2xl shadow-[#4ADE80]/30 hover:scale-110 active:scale-95 transition-all"
            >
              <Camera className="text-app-bg" size={30} strokeWidth={2.5} />
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
                analysisError={analysisError}
                scannerResult={scannerResult} 
                onUpload={handleFileUpload}
                onConfirm={confirmScan}
                onAddToDiary={addMealToDiary}
                onClose={() => { setShowScanner(false); setPreviewUrl(null); setScannerResult(null); setAnalysisError(null); }}
                fileInputRef={fileInputRef}
                dailyLimitReached={dailyLimitReached}
                hoursToReset={hoursToReset}
                analysisTimer={analysisTimer}
                onUpgrade={() => handleUpgrade('Premium')}
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
        {selectedMealForDetail && (
          <Overlay title="Informação Detalhada" onClose={() => setSelectedMealForDetail(null)}>
            <div className="bg-[#0A0B0D] min-h-full">
               <div className="relative aspect-video">
                  <img src={selectedMealForDetail.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-1.5">
                     {selectedMealForDetail.tags.slice(0, 2).map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-xl">
                        {t}
                      </span>
                     ))}
                  </div>
               </div>

               <div className="p-6">
                  <h3 className="text-xl font-black text-white leading-tight mb-2">{selectedMealForDetail.title}</h3>
                  <p className="text-white/40 text-xs font-medium leading-relaxed italic mb-6">
                    {selectedMealForDetail.description}
                  </p>

                  {/* Advanced Nutritional Info Grid */}
                  {selectedMealForDetail.macros && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                       <NutriMetric label="Proteína" value={selectedMealForDetail.macros.protein} color="#4ADE80" />
                       <NutriMetric label="Carbos" value={selectedMealForDetail.macros.carbs} color="#FFB800" />
                       <NutriMetric label="Gordura" value={selectedMealForDetail.macros.fat} color="#00D1FF" />
                    </div>
                  )}

                  {/* Micronutrients */}
                  {selectedMealForDetail.micros && (
                    <div className="space-y-4 mb-8 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.03]">
                       <div className="flex items-center gap-2 mb-1">
                          <Zap size={14} className="text-[#FFB800]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Micronutrientes Chave</span>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[11px] text-white/60 font-medium leading-tight">
                             <span className="text-white font-black uppercase tracking-tighter mr-1">Vitaminas:</span> {selectedMealForDetail.micros.vitamins}
                          </p>
                          <p className="text-[11px] text-white/60 font-medium leading-tight">
                             <span className="text-white font-black uppercase tracking-tighter mr-1">Minerais:</span> {selectedMealForDetail.micros.minerals}
                          </p>
                       </div>
                    </div>
                  )}

                  {/* Health Advice Section */}
                  {selectedMealForDetail.health && (
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-2">
                        <Heart size={16} className="text-[#FF4F4F]" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[#FF4F4F]">Conselho de Saúde</h4>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="p-4 bg-[#4ADE80]/5 border border-[#4ADE80]/10 rounded-2xl">
                            <span className="text-[9px] font-black text-[#4ADE80] uppercase tracking-widest block mb-1">Indicado Para:</span>
                            <p className="text-[11px] text-[#4ADE80]/70 font-medium italic leading-relaxed">{selectedMealForDetail.health.recommendedFor}</p>
                         </div>
                         <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Cuidado se:</span>
                            <p className="text-[11px] text-red-500/70 font-medium italic leading-relaxed">{selectedMealForDetail.health.avoidIf}</p>
                         </div>
                         <div className="flex items-start gap-3 px-1">
                            <Info size={14} className="text-white/20 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-white/30 font-medium leading-relaxed italic">{selectedMealForDetail.health.general}</p>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Ingredients & Prep Steps */}
                  <div className="space-y-6 pt-6 border-t border-white/[0.03]">
                    {selectedMealForDetail.ingredients && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                           <div className="w-1 h-1 bg-[#FFB800] rounded-full" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Composição Principal</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedMealForDetail.ingredients.map((ing: string) => (
                             <span key={ing} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white/40">{ing}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedMealForDetail.steps && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="w-1 h-1 bg-[#4ADE80] rounded-full" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Modo de Preparo</span>
                        </div>
                        <div className="space-y-3">
                          {selectedMealForDetail.steps.map((step: string, idx: number) => (
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
                         <span className="text-[10px] font-bold uppercase tracking-widest">{selectedMealForDetail.prepTime}</span>
                      </div>
                      <button 
                        onClick={() => addMealToDiary(selectedMealForDetail)}
                        className="px-6 py-4 bg-[#4ADE80] text-[#0A0B0D] text-[10px] font-black rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#4ADE80]/10"
                      >
                         <Plus size={16} strokeWidth={4} /> Adicionar ao diário
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          </Overlay>
        )}

        {showPricing && (
          <PricingOverlay 
            onClose={() => setShowPricing(false)} 
            onUpgrade={handleUpgrade}
          />
        )}

        {showQuiz && (
          <Overlay title="Quiz do Dia" onClose={() => { setShowQuiz(false); setSelectedAnswer(null); setShowExplanation(false); }}>
            <div className="bg-[#0A0B0D] min-h-full p-8">
                {quizQuestions.length > 0 ? (
                  currentQuizIndex < quizQuestions.length ? (
                    <div className="space-y-8 max-w-sm mx-auto">
                       <div className="space-y-3">
                          <div className="flex gap-1.5 mb-6">
                            {[0, 1, 2].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < currentQuizIndex ? 'bg-[#4ADE80]' : (i === currentQuizIndex ? 'bg-[#4ADE80]/30 animate-pulse' : 'bg-white/5')}`} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4ADE80]">Pergunta {currentQuizIndex + 1}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{quizScore} ACERTOS</span>
                          </div>
                          <h2 className="text-xl font-black leading-tight text-white">{quizQuestions[currentQuizIndex].question}</h2>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                          {quizQuestions[currentQuizIndex].options.map((option: string, idx: number) => {
                            const isSelected = selectedAnswer === idx;
                            const isCorrect = idx === quizQuestions[currentQuizIndex].correctIndex;
                            const showResult = selectedAnswer !== null;
                            
                            let borderColor = 'border-white/10';
                            let bgColor = 'bg-white/5';
                            let iconColor = 'bg-white/5 text-white/40';

                            if (showResult) {
                              if (isCorrect) {
                                borderColor = 'border-[#4ADE80] scale-[1.02]';
                                bgColor = 'bg-[#4ADE80]/10';
                                iconColor = 'bg-[#4ADE80] text-[#0A0B0D]';
                              } else if (isSelected) {
                                borderColor = 'border-[#FF4F4F]';
                                bgColor = 'bg-[#FF4F4F]/10';
                                iconColor = 'bg-[#FF4F4F] text-white';
                              }
                            }

                            return (
                              <button 
                                key={idx}
                                disabled={showResult}
                                onClick={() => {
                                  setSelectedAnswer(idx);
                                  if (idx === quizQuestions[currentQuizIndex].correctIndex) {
                                    setQuizScore(prev => prev + 1);
                                  }
                                  setShowExplanation(true);
                                }}
                                className={`w-full p-5 sm:p-6 border rounded-[28px] text-left transition-all group relative overflow-hidden ${borderColor} ${bgColor}`}
                              >
                                 <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-colors shrink-0 ${iconColor}`}>
                                      {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>{option}</span>
                                 </div>
                                 {showResult && isCorrect && (
                                   <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                     <CheckCircle2 size={20} className="text-[#4ADE80]" />
                                   </div>
                                 )}
                              </button>
                            );
                          })}
                       </div>

                       {showExplanation && (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="p-6 bg-[#4ADE10]/5 border border-[#4ADE10]/20 rounded-[32px] space-y-3"
                         >
                           <div className="flex items-center gap-2 text-[#4ADE80]">
                             <Zap size={16} strokeWidth={3} />
                             <span className="font-black text-[10px] uppercase tracking-widest">Explicação Kidia</span>
                           </div>
                           <p className="text-white/70 text-xs leading-relaxed font-medium">
                             {quizQuestions[currentQuizIndex].explanation}
                           </p>
                           <button 
                             onClick={() => {
                               setSelectedAnswer(null);
                               setShowExplanation(false);
                               setCurrentQuizIndex(prev => prev + 1);
                             }}
                             className="w-full py-4 mt-2 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                           >
                             Próxima Pergunta
                           </button>
                         </motion.div>
                       )}
                    </div>
                  ) : (
                    <div className="text-center space-y-8 py-10 max-w-sm mx-auto">
                       <div className="w-32 h-32 bg-[#4ADE80]/20 rounded-full mx-auto flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-[#4ADE80]/20 rounded-full animate-ping" />
                          <Flame size={64} className="text-[#4ADE80]" fill="#4ADE80" />
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-3xl font-black text-white">Excelente!</h2>
                          <p className="text-white/40 text-sm font-medium">Completaste o Quiz do Kidia.</p>
                          <div className="text-[#4ADE80] text-xl font-black mt-4">{quizScore}/3 ACERTOS</div>
                       </div>
                       <button 
                         onClick={() => {
                           setShowQuiz(false);
                           setSelectedAnswer(null);
                           setShowExplanation(false);
                           setShowSuccessToast("Emblema Desbloqueado!");
                           setTimeout(() => setShowSuccessToast(null), 3000);
                         }}
                         className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-[28px] text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#4ADE80]/20"
                       >
                         Coletar Emblema & Voltar
                       </button>
                    </div>
                  )
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center gap-6 h-full">
                    <Loader2 className="animate-spin text-[#4ADE80]" size={40} />
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-center px-8">Consultando a nossa base de dados angolana...</p>
                  </div>
                )}
            </div>
          </Overlay>
        )}

        {showSuccessToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-6 right-6 z-[200] bg-[#4ADE80] text-[#0A0B0D] p-4 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <div className="bg-[#0A0B0D]/10 p-2 rounded-xl">
              <Zap size={20} strokeWidth={3} />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">{showSuccessToast}</span>
          </motion.div>
        )}

        {isProcessingPlan && (
          <ProcessingPlanOverlay userProfile={userProfile} />
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

function ProcessingPlanOverlay({ userProfile }: { userProfile: any }) {
  const [step, setStep] = useState(0);
  const dataPoints = [
    { label: 'Analizando perfil', value: userProfile?.name || 'Utilizador' },
    { label: 'Calibrando metas', value: userProfile?.goal || 'Saúde' },
    { label: 'Calculando macros', value: '2450 kcal/dia' },
    { label: 'Processando restrições', value: userProfile?.restrictions?.length ? 'Ativo' : 'Nenhuma' },
    { label: 'Integrando rede neural', value: 'Gemini 2.0 Flash' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % dataPoints.length);
    }, 800);
    return () => clearInterval(interval);
  }, [dataPoints.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0B0D] flex flex-col items-center justify-center p-12 overflow-hidden">
      {/* Background Matrix/Data Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
         <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[radial-gradient(circle,rgba(74,222,128,0.2)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-4 border-[#4ADE80] border-t-transparent rounded-full mx-auto mb-12 shadow-[0_0_50px_rgba(74,222,128,0.3)]"
        />
        
        <h2 className="text-3xl font-black mb-2 animate-pulse">Criando o Teu Futuro...</h2>
        <p className="text-white/30 text-xs font-black uppercase tracking-[0.3em] mb-12">A processar o teu plano alimentar perfeito</p>

        <div className="space-y-4 text-left">
           {dataPoints.map((dp, i) => (
             <motion.div 
               key={i}
               initial={{ x: -20, opacity: 0 }}
               animate={{ 
                 x: step === i ? 0 : -20, 
                 opacity: step === i ? 1 : 0.2,
                 scale: step === i ? 1.05 : 1
               }}
               className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5"
             >
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{dp.label}</span>
                <span className="text-xs font-black text-[#4ADE80]">{dp.value}</span>
             </motion.div>
           ))}
        </div>

        <div className="mt-12 flex gap-1 justify-center">
           {[...Array(3)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ opacity: [0.2, 1, 0.2] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
               className="w-2 h-2 bg-[#4ADE80] rounded-full"
             />
           ))}
        </div>
      </div>
    </div>
  );
}

function PricingOverlay({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: (name: string) => void }) {
  return (
    <div className="fixed inset-0 z-[101] bg-[#0A0B0D]/95 backdrop-blur-2xl flex flex-col p-8 pt-20">
      <button onClick={onClose} className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/30">
        <Plus className="rotate-45" />
      </button>

      <div className="mb-12 text-center">
        <div className="inline-flex px-4 py-1.5 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-full mb-6 text-[#FFB800] text-[10px] font-black uppercase tracking-widest">
          Acesso Restrito 🛡️
        </div>
        <h2 className="text-3xl font-black mb-4 leading-tight">O teu plano gratuito não permite isto!</h2>
        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
          Para receberes planos personalizados gerados por IA, precisas de atualizar para uma conta PRO.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-12 no-scrollbar">
        <PlanCard 
          name="Premium Mensal"
          price="5.000 Kz"
          period="/ mês"
          features={['Plano Alimentar IA', 'Chat Ilimitado', 'Análise de Fotos Pro', 'Dicas Exclusivas']}
          onSelect={() => onUpgrade('Premium Mensal')}
        />
        <PlanCard 
          name="Premium Trimestral"
          price="12.000 Kz"
          period="/ 3 meses"
          highlight
          features={['Tudo do Mensal', '25% de Desconto', 'Suporte Prioritário', 'Guia de Receitas PDF']}
          onSelect={() => onUpgrade('Premium Trimestral')}
        />
        <PlanCard 
          name="Elite Anual"
          price="40.000 Kz"
          period="/ ano"
          features={['Plano Vitalício', 'Mentoria 1-on-1', 'Acesso Antecipado', 'Kit Boas Vindas']}
          onSelect={() => onUpgrade('Elite Anual')}
        />
      </div>
    </div>
  );
}

function PlanCard({ name, price, period, features, highlight, onSelect }: any) {
  return (
    <div className={`p-8 rounded-[40px] border-2 transition-all relative overflow-hidden group ${highlight ? 'bg-[#4ADE80] border-[#4ADE80] text-[#0A0B0D]' : 'bg-white/5 border-white/5 text-white'}`}>
       {highlight && (
         <div className="absolute top-4 right-4 bg-black/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Melhor Valor</div>
       )}
       <h3 className="text-sm font-black uppercase tracking-widest mb-2 opacity-60">{name}</h3>
       <div className="flex items-baseline gap-1 mb-8">
          <span className="text-3xl font-black">{price}</span>
          <span className="text-[10px] font-bold opacity-40">{period}</span>
       </div>
       <div className="space-y-4 mb-10">
          {features.map((f: string) => (
            <div key={f} className="flex items-center gap-3">
               <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${highlight ? 'border-black/10 bg-black/5' : 'border-white/10 bg-white/5'}`}>
                  <Plus size={12} className={highlight ? 'text-black' : 'text-[#4ADE80]'} />
               </div>
               <span className="text-xs font-bold opacity-80">{f}</span>
            </div>
          ))}
       </div>
       <button 
        onClick={onSelect}
        className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${highlight ? 'bg-black text-white shadow-2xl' : 'bg-[#4ADE80] text-[#0A0B0D]'}`}
       >
         ATUALIZAR AGORA
       </button>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <div className={`relative ${active ? 'text-[#4ADE80]' : 'text-text-muted'}`}>
      <Activity size={22} />
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4ADE80] rounded-full" />}
    </div>
  );
}

function MealCard({ icon, label, time, kcal, isOpen, onToggle, details }: { icon: any, label: string, time: string, kcal: string, isOpen: boolean, onToggle: () => void, details?: any }) {
  return (
    <div className={`bg-card-custom border border-border-custom rounded-[32px] overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-2xl' : 'shadow-sm'}`}>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
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

function MealThumbCard({ image, time, label, name, kcal, active, onClick }: { image: string, time: string, label: string, name: string, kcal: string, active?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`relative min-w-[160px] h-56 rounded-[32px] overflow-hidden group border-2 transition-all cursor-pointer ${active ? 'border-[#4ADE80] shadow-2xl shadow-[#4ADE80]/10 scale-105 z-10' : 'border-white/5 opacity-80'}`}>
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

interface ChallengeProps {
  icon: any;
  title: string;
  status: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  progress?: number;
  key?: any;
}

function ChallengeThumbCard({ icon, title, status, color, active, onClick, progress }: ChallengeProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 bg-[#121417] border rounded-[32px] relative overflow-hidden group cursor-pointer transition-all active:scale-95 ${active ? 'shadow-xl' : ''}`} 
      style={{ borderColor: active ? `${color}40` : 'rgba(255,255,255,0.05)', backgroundColor: active ? `${color}05` : '' }}
    >
       <div className="flex flex-col items-center gap-3 relative z-10">
          {icon}
          <div className="text-center">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">{title}</span>
            {progress !== undefined && (
              <div className="text-[9px] font-black text-white/60 mb-2">{progress}% Concluído</div>
            )}
          </div>
          <button 
            className="w-full py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
            style={{ 
              backgroundColor: active ? color : 'transparent', 
              color: active ? '#000' : color,
              border: `1.5px solid ${active ? 'transparent' : `${color}40`}`
            }}
          >
            {status}
          </button>
       </div>
       <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: color }} />
       {progress !== undefined && (
         <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
           <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
         </div>
       )}
    </div>
  );
}

function BadgeRow({ icon, title, date, color }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card-custom border border-border-custom rounded-3xl group">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
      <div>
        <h4 className="font-black text-xs uppercase tracking-widest text-text-main/80">{title}</h4>
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Desbloqueado em {date}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <Star size={16} className="text-[#FFB800]" fill="#FFB800" />
      </div>
    </div>
  );
}

function AnalysisRow({ image, name, info, date, score, onClick }: { image: string, name: string, info: string, date: string, score: number, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="p-4 bg-[#121417] border border-white/5 rounded-[32px] flex items-center gap-4 group hover:bg-white/[0.02] transition-colors cursor-pointer">
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
      <div className={`${active ? 'text-[#4ADE80]' : 'text-text-muted'} transition-all`}>{icon}</div>
      <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-[#4ADE80]' : 'text-text-muted'}`}>{label}</span>
    </button>
  );
}

function SettingItem({ icon, label, value, last, onClick }: { icon: any, label: string, value?: string, last?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full p-5 flex items-center justify-between group transition-colors hover:bg-white/[0.02] ${!last ? 'border-b border-border-custom' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="text-text-muted group-hover:text-[#4ADE80] transition-colors">{icon}</div>
        <span className="text-sm font-bold text-text-main/80">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-[#4ADE80] transition-colors">{value}</span>}
        <ChevronRight size={14} className="text-text-muted/40 group-hover:text-[#4ADE80]" />
      </div>
    </button>
  );
}

function ProfileDataCard({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="p-5 bg-card-custom border border-border-custom rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <Edit3 size={10} className="text-text-main" />
      </div>
      <div className="mb-2">{icon}</div>
      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</span>
      <span className="text-sm font-black text-text-main tracking-tight">{value}</span>
    </div>
  );
}

function Overlay({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-app-bg z-[100] flex flex-col">
      <header className="px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-between border-b border-border-custom">
        <h2 className="text-sm sm:text-base font-black uppercase tracking-widest truncate mr-4 text-text-main">{title}</h2>
        <button onClick={onClose} className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-border-custom text-text-muted shrink-0"><X size={20} /></button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
}

function ScannerContent({ 
  previewUrl, 
  isAnalyzing, 
  analysisError, 
  scannerResult, 
  onUpload, 
  onConfirm, 
  onAddToDiary, 
  onClose, 
  fileInputRef,
  dailyLimitReached,
  hoursToReset,
  analysisTimer,
  onUpgrade
}: any) {
  const [selectedMealType, setSelectedMealType] = useState('almoço');
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (dailyLimitReached && !scannerResult) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-32 h-32 bg-[#FF4F4F]/10 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[#FF4F4F]/20 rounded-full animate-ping" />
          <Moon size={64} className="text-[#FF4F4F]" fill="#FF4F4F" fillOpacity={0.2} />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white leading-tight">O Teu Dia Acabou</h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
            Atingiste o limite de 2 análises diárias. Volta daqui a <span className="text-white font-black">{hoursToReset} horas</span> ou faz o Upgrade agora.
          </p>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={onUpgrade}
            className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-[28px] text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#4ADE80]/20 flex items-center justify-center gap-2"
          >
            <Star size={18} fill="#000" /> Upgrade Ilimitado
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-5 bg-white/5 border border-white/10 text-white/60 font-black rounded-[28px] text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Fechar e Esperar
          </button>
        </div>
      </div>
    );
  }

  const mealTypes = [
    { id: 'café', label: 'Café da manhã', time: '7:00 - 10:00', ex: 'Ex: Papaia, pão, ovos', icon: <Sun size={18} /> },
    { id: 'almoço', label: 'Almoço', time: '11:30 - 14:00', ex: 'Ex: Mufete, arroz e feijão', icon: <Sun size={18} className="text-[#4ADE80]" /> },
    { id: 'jantar', label: 'Jantar', time: '18:00 - 21:00', ex: 'Ex: Calulu, sopa', icon: <Moon size={18} /> },
    { id: 'lanche', label: 'Lanche', time: 'Qualquer hora', ex: 'Ex: Amendoim, fruta', icon: <Coffee size={18} /> },
  ];

  return (
    <div className="p-4 h-full flex flex-col space-y-6">
       {/* Hidden Inputs */}
       <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onUpload} />
       <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={onUpload} />

       {!previewUrl ? (
          <>
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-white px-1">Analisar refeição</h2>
              <p className="text-white/30 text-[11px] font-medium px-1">Fotografa o teu prato para uma análise completa</p>
            </div>

            {/* Main Capture Card */}
            <div className="relative rounded-[32px] overflow-hidden aspect-video bg-[#121417] border border-white/5 group shadow-xl">
              <img 
                src="https://static.novavaga.co.ao/global/image.jpg?brand=NJ&type=generate&guid=539a3c46-08bb-4efd-b7e5-6fc4f7635e2d" 
                className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" 
                alt="Background"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/20 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-16 h-16 bg-[#4ADE80]/10 rounded-full flex items-center justify-center border-2 border-[#4ADE80] mb-4 shadow-[0_0_20px_rgba(74,222,128,0.2)] active:scale-90 transition-transform"
                >
                  <Camera className="text-[#4ADE80]" size={24} strokeWidth={2.5} />
                </button>
                <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight">Fotografa o teu prato</h3>
                <p className="text-white/40 text-[9px] font-bold leading-relaxed max-w-[200px]">
                  Aponta a câmara para a refeição e recebe a análise nutricional completa
                </p>

                <div className="flex gap-3 mt-5 w-full max-w-xs sm:flex transition-all">
                  <button onClick={() => cameraInputRef.current?.click()} className="flex-1 py-3 bg-[#4ADE80]/10 border border-[#4ADE80] rounded-[18px] flex items-center justify-center gap-2 text-[#4ADE80] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">
                    <Camera size={14} /> Câmara
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-[#FFB800]/10 border border-[#FFB800] rounded-[18px] flex items-center justify-center gap-2 text-[#FFB800] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">
                    <ImageIcon size={14} /> Galeria
                  </button>
                </div>
              </div>
            </div>

            {/* Meal Type Selection */}
            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Tipo de refeição</h3>
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setSelectedMealType(type.id)}
                    className={`p-3.5 rounded-[24px] border-2 text-left transition-all active:scale-95 ${selectedMealType === type.id ? 'bg-[#4ADE80]/5 border-[#4ADE80]' : 'bg-[#121417] border-white/5 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={selectedMealType === type.id ? 'text-[#4ADE80]' : 'text-white/20'}>{type.icon}</div>
                      {selectedMealType === type.id && <div className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full" />}
                    </div>
                    <h4 className={`text-[11px] font-black ${selectedMealType === type.id ? 'text-[#4ADE80]' : 'text-white'}`}>{type.label}</h4>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">{type.time}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="p-5 bg-[#121417] border border-white/5 rounded-[28px] space-y-4">
              <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Instruções de Sucesso</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 text-white/40">
                  <Sun size={14} className="text-[#4ADE80] shrink-0" />
                  <span className="text-[10px] font-bold leading-tight">Boa luz aumenta precisão</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <Maximize size={14} className="text-[#4ADE80] shrink-0" />
                  <span className="text-[10px] font-bold leading-tight">Enquadra todo o prato</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <Eye size={14} className="text-[#4ADE80] shrink-0" />
                  <span className="text-[10px] font-bold leading-tight">Evita sombras ou brilho</span>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                  <Utensils size={14} className="text-[#4ADE80] shrink-0" />
                  <span className="text-[10px] font-bold leading-tight">Sabor de Angola & Mundo</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2.5 pt-2 pb-20">
              <button 
                disabled={analysisTimer > 0}
                onClick={() => cameraInputRef.current?.click()}
                className={`w-full py-4 ${analysisTimer > 0 ? 'bg-white/5 text-white/20' : 'bg-[#4ADE80] text-[#0A0B0D]'} font-black rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-[#4ADE80]/10 hover:scale-[1.01] active:scale-[0.98] transition-all text-xs`}
              >
                {analysisTimer > 0 ? (
                  <>Aguarde {analysisTimer}s...</>
                ) : (
                  <><Camera size={18} strokeWidth={3} /> CAPTURAR AGORA</>
                )}
              </button>
              <button 
                disabled={analysisTimer > 0}
                onClick={() => fileInputRef.current?.click()} 
                className="w-full py-4 border border-[#4ADE80]/30 text-[#4ADE80] font-black rounded-[28px] flex items-center justify-center gap-3 hover:bg-[#4ADE80]/5 transition-all text-[10px] uppercase tracking-widest disabled:opacity-30"
              >
                <Scan size={18} strokeWidth={3} /> Identificação Rápida
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6 pb-24">
            <div className="relative rounded-[32px] overflow-hidden border border-white/10 aspect-square bg-[#121417] shadow-2xl">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-transparent opacity-60" />
              
              {!isAnalyzing && !scannerResult && (
                <button 
                  onClick={() => { onClose(); }} // Simple exit or logic to reset
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {!scannerResult && !isAnalyzing && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3">
                <button 
                  onClick={() => onConfirm(selectedMealType)}
                  className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-[#4ADE80]/20 hover:scale-[1.01] active:scale-[0.95] transition-all text-sm uppercase tracking-widest"
                >
                  <Scan size={22} strokeWidth={3} className="animate-pulse" /> IDENTIFICAR AGORA
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-4 bg-white/5 text-white/40 font-black rounded-[28px] text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                >
                  Tente outra foto
                </button>
              </motion.div>
            )}

            {analysisError && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 rounded-[32px] bg-red-500/10 border border-red-500/20 text-center space-y-4">
                <AlertCircle size={32} className="text-red-500 mx-auto" />
                <div>
                  <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-1">Erro na Análise</p>
                  <p className="text-white/60 text-[10px] font-medium leading-relaxed">{analysisError}</p>
                </div>
                <button 
                  onClick={onConfirm}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-[24px] text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            )}

            {isAnalyzing && (
              <div className="p-8 rounded-[32px] flex flex-col items-center gap-5 bg-white/5 border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#4ADE80]/10 overflow-hidden">
                  <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-[#4ADE80]" />
                </div>
                <Loader2 className="text-[#4ADE80] animate-spin" size={32} strokeWidth={3} />
                <div className="text-center">
                  <p className="text-[#4ADE80] font-black text-[10px] uppercase tracking-[0.2em]">Digitando Componentes...</p>
                  <p className="text-white/20 text-[9px] font-bold uppercase mt-1">A IA está a dissecar a tua refeição</p>
                </div>
              </div>
            )}

            {scannerResult && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8 pb-24">
                <div className="p-6 sm:p-8 bg-white/5 border border-white/5 rounded-[32px] text-center shadow-xl">
                  <h4 className="text-white/20 font-black uppercase text-[10px] tracking-widest mb-2">Refeição Identificada</h4>
                  <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#4ADE80] break-words">{scannerResult.name}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-5 sm:p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center text-center">
                    <Zap size={24} className="text-[#4ADE80] mb-3" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Calorias</span>
                    <span className="text-xl sm:text-2xl font-black break-words w-full px-1">{scannerResult.calories}</span>
                  </div>
                  <div className="p-5 sm:p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center text-center">
                    <Activity size={24} className="text-[#00D1FF] mb-3" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Proteína</span>
                    <span className="text-xl sm:text-2xl font-black break-words w-full px-1">{scannerResult.protein}</span>
                  </div>
                  <div className="p-5 sm:p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center text-center">
                    <Flame size={24} className="text-[#FFB800] mb-3" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Carbos</span>
                    <span className="text-xl sm:text-2xl font-black break-words w-full px-1">{scannerResult.carbs}</span>
                  </div>
                  <div className="p-5 sm:p-6 bg-[#121417] border border-white/5 rounded-[32px] flex flex-col items-center text-center">
                    <Droplets size={24} className="text-[#A855F7] mb-3" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Gordura</span>
                    <span className="text-xl sm:text-2xl font-black break-words w-full px-1">{scannerResult.fat}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="p-6 sm:p-8 bg-[#4ADE80]/5 border border-[#4ADE80]/10 rounded-[32px] shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-[#4ADE80]">
                      <Zap size={20} strokeWidth={3} />
                      <span className="font-black text-xs uppercase tracking-widest">Dica Nutricional Kidia</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed font-medium">
                      {scannerResult.healthTip}
                    </p>
                  </div>

                  <div className="p-6 sm:p-8 bg-[#FFB800]/5 border border-[#FFB800]/10 rounded-[32px] shadow-lg">
                    <div className="flex items-center gap-3 mb-3 text-[#FFB800]">
                      <Utensils size={20} strokeWidth={3} />
                      <span className="font-black text-xs uppercase tracking-widest">Sugestão Kidia</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed font-medium italic">
                      {scannerResult.suggestion}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    onAddToDiary(scannerResult);
                    onClose();
                  }}
                  className="w-full py-6 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-[32px] text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all mb-3 shadow-xl shadow-[#4ADE80]/20"
                >
                  Confirmar e Adicionar
                </button>
                <button onClick={onClose} className="w-full py-6 border border-white/10 text-white/40 font-black rounded-[32px] text-xs uppercase tracking-widest hover:text-[#4ADE80] hover:border-[#4ADE80]/40 transition-all">
                  Descartar
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

