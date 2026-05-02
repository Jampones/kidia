/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MessageSquare, 
  Send, 
  Upload, 
  Zap, 
  Activity, 
  ChevronRight, 
  X,
  Loader2,
  Apple,
  Dna,
  Heart
} from 'lucide-react';
import { askNutritionAssistant, analyzeFoodImage } from './services/geminiService.ts';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AnalysisResult {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  healthTip: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu assistente de nutrição Neon. Como posso ajudar com sua dieta hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannerResult, setScannerResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Map history for Gemini API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await askNutritionAssistant(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Desculpe, tive um erro no sistema.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Falha na conexão com a IA.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    setScannerResult(null);
    try {
      const result = await analyzeFoodImage(base64);
      setScannerResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setPreviewUrl(null);
    setScannerResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div id="neon-app" className="min-h-screen flex flex-col max-w-lg mx-auto border-x border-white/5 bg-dark-bg">
      {/* Header */}
      <header className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 glass-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green flex items-center justify-center neon-glow">
            <Zap size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono neon-text">NeonNutri</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">IA Ativa</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-2 rounded-md transition-all ${activeTab === 'chat' ? 'bg-neon-green text-black' : 'text-white/40 hover:text-white'}`}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`p-2 rounded-md transition-all ${activeTab === 'scanner' ? 'bg-neon-green text-black' : 'text-white/40 hover:text-white'}`}
          >
            <Camera size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-4 overflow-y-auto"
            >
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-neon-green text-black font-medium' 
                        : 'glass-card neon-border text-white/90'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass-card neon-border p-4 rounded-2xl">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 p-6 flex flex-col overflow-y-auto"
            >
              {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-neon-green/30 mb-6 flex items-center justify-center group hover:border-neon-green transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="text-neon-green group-hover:scale-110 transition-transform" size={40} />
                  </div>
                  <h3 className="text-xl font-bold neon-text mb-2 tracking-tight">Scanner Visual</h3>
                  <p className="text-white/40 text-sm mb-8 px-8">Envie uma foto da sua refeição para análise instantânea da IA.</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-neon-green text-black font-bold rounded-xl flex items-center justify-center gap-2 neon-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Camera size={20} />
                    CAPTURAR / ENVIAR
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden neon-border aspect-video bg-black/50">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Food preview" />
                    <button 
                      onClick={resetScanner}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white/80 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {isAnalyzing && (
                    <div className="glass-card neon-border p-8 rounded-2xl flex flex-col items-center justify-center gap-4">
                      <Loader2 className="text-neon-green animate-spin" size={32} />
                      <p className="text-neon-green font-mono text-xs uppercase tracking-widest animate-pulse">Analisando Bio-dados...</p>
                    </div>
                  )}

                  {scannerResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-5 glass-card neon-border rounded-2xl">
                        <h4 className="text-neon-green font-mono uppercase text-xs mb-1 tracking-widest">Identificado</h4>
                        <p className="text-2xl font-bold uppercase">{scannerResult.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={<Zap size={14}/>} label="Calorias" value={scannerResult.calories} color="neon-green" />
                        <StatCard icon={<Dna size={14}/>} label="Proteína" value={scannerResult.protein} color="white" />
                        <StatCard icon={<Apple size={14}/>} label="Carbs" value={scannerResult.carbs} color="white" />
                        <StatCard icon={<Heart size={14}/>} label="Gordura" value={scannerResult.fat} color="white" />
                      </div>

                      <div className="p-5 glass-card bg-neon-green/10 border-neon-green/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-neon-green">
                          <Activity size={16} />
                          <span className="font-bold text-xs uppercase tracking-wider">Health Insights</span>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed italic">
                          "{scannerResult.healthTip}"
                        </p>
                      </div>

                      <button 
                        onClick={resetScanner}
                        className="w-full py-4 border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all rounded-xl font-mono text-xs uppercase tracking-widest"
                      >
                        Nova Análise
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input area for Chat */}
      {activeTab === 'chat' && (
        <footer className="p-4 bg-dark-bg/80 backdrop-blur-xl border-t border-white/5 pb-8">
          <div className="flex gap-2 p-2 glass-card neon-border rounded-2xl items-center">
            <input 
              type="text" 
              placeholder="Pergunte ao nutri..."
              className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm placeholder:text-white/20"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isTyping}
              className="p-3 bg-neon-green text-black rounded-xl neon-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="p-4 glass-card border-white/5 rounded-2xl flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 ${color === 'neon-green' ? 'text-neon-green' : 'text-white/40'}`}>
        {icon}
        <span className="text-[10px] uppercase font-mono tracking-tighter">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

