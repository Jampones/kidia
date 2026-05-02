import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, Zap } from 'lucide-react';

interface AuthScreenProps {
  onBack: () => void;
  onAuth: (email: string, pass: string, isSignUp: boolean) => Promise<void>;
  error?: string;
}

export default function AuthScreen({ onBack, onAuth, error }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAuth(email, password, isSignUp);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-dark-bg">
      <button onClick={onBack} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors w-fit">
        <ChevronLeft size={24} />
      </button>

      <div className="mt-12 mb-10">
        <div className="w-14 h-14 bg-[#4ADE80] rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-[#4ADE80]/20">
          <Zap size={28} className="text-[#0A0B0D]" />
        </div>
        <h2 className="text-4xl font-black mb-3 tracking-tight text-white">
          {isSignUp ? 'Criar conta' : 'Aceder'}
        </h2>
        <p className="text-white/40 text-sm font-medium">
          {isSignUp ? 'Começa a tua jornada hoje.' : 'Bem-vindo de volta à tua nutrição.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2.5 block tracking-[0.2em]">Email</label>
          <input 
            type="email" 
            required
            className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4.5 text-sm focus:border-[#4ADE80]/50 focus:outline-none transition-all placeholder:text-white/10"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-black text-[#4ADE80] ml-1 mb-2.5 block tracking-[0.2em]">Senha</label>
          <input 
            type="password" 
            required
            className="w-full bg-[#121417] border border-white/5 rounded-2xl px-6 py-4.5 text-sm focus:border-[#4ADE80]/50 focus:outline-none transition-all placeholder:text-white/10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-[11px] font-bold text-center bg-red-400/5 py-4 rounded-2xl border border-red-400/10">
            {error}
          </p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-2xl mt-4 disabled:opacity-50 transition-transform active:scale-[0.97]"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : (isSignUp ? 'CADASTRAR' : 'ENTRAR AGORA')}
        </button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-white/40 uppercase font-bold tracking-widest hover:text-primary transition-colors"
        >
          {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
        </button>
      </div>
    </div>
  );
}
