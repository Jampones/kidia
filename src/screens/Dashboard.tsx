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
  ChevronRight
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
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner' | 'history'>('chat');
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
    <div className="flex-1 flex flex-col h-full bg-dark-bg">
      <header className="px-6 py-5 bg-[#0A0B0D]/80 backdrop-blur-xl border-b border-white/[0.03] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4ADE80] flex items-center justify-center shadow-lg shadow-[#4ADE80]/20">
            <Zap size={20} className="text-[#0A0B0D]" />
          </div>
          <h1 className="font-black tracking-tight uppercase text-sm text-white">NutriLens</h1>
        </div>
        <div className="flex gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.03]">
          <TabButton active={activeTab === 'chat'} icon={<MessageSquare size={18} />} onClick={() => setActiveTab('chat')} />
          <TabButton active={activeTab === 'scanner'} icon={<Camera size={18} />} onClick={() => setActiveTab('scanner')} />
          <TabButton active={activeTab === 'history'} icon={<History size={18} />} onClick={() => setActiveTab('history')} />
          <button onClick={onLogout} className="p-2.5 text-white/10 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-primary text-black font-medium' : 'bg-white/5 border border-white/5 text-white/90'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="flex justify-start"><div className="bg-white/5 p-4 rounded-2xl border border-white/5 animate-pulse">Nutri está pensando...</div></div>}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-6 flex flex-col overflow-y-auto">
              {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-dashed border-white/20 mb-6 flex items-center justify-center cursor-pointer hover:border-primary transition-all" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="text-white/40" size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Scanner Visual</h3>
                  <p className="text-white/40 text-sm mb-8">Envie uma foto para análise nutricional de IA.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
                    <Camera size={20} /> CAPTURAR / ENVIAR
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <button onClick={() => { setPreviewUrl(null); setScannerResult(null); }} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white/80 hover:text-white"><X size={18} /></button>
                  </div>
                  {isAnalyzing && <div className="p-8 rounded-2xl flex flex-col items-center gap-4 bg-white/5 border border-white/5"><Loader2 className="text-primary animate-spin" /><p className="text-primary font-mono text-xs uppercase tracking-widest">Analisando...</p></div>}
                  {scannerResult && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4 pb-10">
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl text-center"><h4 className="text-white/40 font-mono uppercase text-[10px] mb-1">Identificado</h4><p className="text-xl font-bold uppercase tracking-tight">{scannerResult.name}</p></div>
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={<Zap size={14}/>} label="Calorias" value={scannerResult.calories} color="primary" />
                        <StatCard icon={<Dna size={14}/>} label="Proteína" value={scannerResult.protein} color="white" />
                        <StatCard icon={<Apple size={14}/>} label="Carbs" value={scannerResult.carbs} color="white" />
                        <StatCard icon={<Heart size={14}/>} label="Gordura" value={scannerResult.fat} color="white" />
                      </div>
                      <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl"><div className="flex items-center gap-2 mb-2 text-primary"><Activity size={16} /><span className="font-bold text-xs uppercase">Health Tip</span></div><p className="text-white/80 text-sm leading-relaxed italic">"{scannerResult.healthTip}"</p></div>
                      <button onClick={() => { setPreviewUrl(null); setScannerResult(null); }} className="btn-outline text-xs">Nova Análise</button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-6 flex flex-col overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Histórico</h2>
              <div className="space-y-3">
                {scanHistory.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{item.calories}</div>
                    <div className="flex-1"><p className="font-bold text-sm uppercase">{item.item_name}</p><p className="text-[10px] text-white/20">{new Date(item.created_at).toLocaleDateString()}</p></div>
                    <ChevronRight size={14} className="text-white/10" />
                  </div>
                ))}
                {!scanHistory.length && <p className="text-center text-white/20 py-10 text-sm">Nada por aqui ainda.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {activeTab === 'chat' && (
        <footer className="p-4 glass-header border-t-0 pb-8">
          <div className="flex gap-2 p-2 bg-white/5 border border-white/5 rounded-2xl items-center focus-within:border-primary/50 transition-all">
            <input type="text" placeholder="Pergunte ao nutri..." className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm placeholder:text-white/20" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
            <button onClick={handleSendMessage} disabled={isTyping} className="p-3 bg-primary text-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><Send size={18} /></button>
          </div>
        </footer>
      )}
    </div>
  );
}

function TabButton({ active, icon, onClick }: { active: boolean, icon: any, onClick: () => void }) {
  return <button onClick={onClick} className={`p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#4ADE80] text-[#0A0B0D] shadow-lg shadow-[#4ADE80]/20 scale-110' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}>{icon}</button>;
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 ${color === 'primary' ? 'text-primary' : 'text-white/40'}`}>{icon}<span className="text-[9px] uppercase font-bold tracking-widest">{label}</span></div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
