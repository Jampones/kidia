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
  Star
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0B0D] text-white">
      {/* Header */}
      {activeTab === 'home' && (
        <header className="px-6 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
              Olá, {userProfile?.name?.split(' ')[0] || 'Convidado'} 👋
            </h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
              Sábado, 02 De Maio
            </p>
          </div>
          <div className="relative">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 relative">
              <Bell size={20} className="text-white/40" />
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF4F4F] rounded-full border-2 border-[#0A0B0D]" />
          </div>
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
              <div className="p-6 bg-[#1a1710] border border-[#FFB800]/20 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FFB800]/10 rounded-xl flex items-center justify-center">
                    <Activity className="text-[#FFB800]" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[#FFB800] font-black text-xs uppercase tracking-widest">Dica do Especialista</h3>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-tight">Hoje</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs font-medium leading-relaxed italic">
                  "Beber água antes das refeições ajuda a controlar as porções e melhora a digestão. Tenta beber 2L por dia!"
                </p>
              </div>

              {/* Challenge Card */}
              <div className="p-6 bg-[#121417] border border-white/5 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🚭</div>
                    <h3 className="font-black text-sm">7 Dias Sem Açúcar</h3>
                  </div>
                  <span className="text-[#FF4F4F] font-black text-xs">3/7 dias</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-[#FF4F4F] rounded-full" />
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'plan' && (
            <div className="flex-1 flex items-center justify-center text-white/20">
              <p>Funcionalidade em desenvolvimento 📅</p>
            </div>
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
          <Overlay title="Assistente NutriLens" onClose={() => setShowChat(false)}>
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
  return (
    <div className="p-6 h-full flex flex-col">
       {!previewUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-[40px] bg-white/5 border border-dashed border-white/20 mb-8 flex items-center justify-center cursor-pointer hover:border-[#4ADE80] transition-all group" onClick={() => fileInputRef.current?.click()}>
              <Upload className="text-white/40 group-hover:text-[#4ADE80] transition-colors" size={40} />
            </div>
            <h3 className="text-2xl font-black mb-4">Câmera de Nutrição</h3>
            <p className="text-white/30 text-sm mb-12 max-w-[240px] font-medium leading-relaxed">
              Tira uma foto do teu prato para descobrirmos tudo o que ele tem.
            </p>
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-3xl shadow-2xl shadow-[#4ADE80]/10 flex items-center justify-center gap-3">
              <Camera size={24} strokeWidth={3} /> ABRIR CÂMERA
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onUpload} />
          </div>
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
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">NutriLens está a escrever...</span>
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

