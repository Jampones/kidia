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
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <Zap size={24} className="text-black" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {isSignUp ? 'Criar sua conta' : 'Bem-vindo de volta'}
        </h2>
        <p className="text-white/40 text-sm">
          {isSignUp ? 'Comece sua jornada nutricional hoje.' : 'Aceda ao seu perfil e histórico.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1 mb-2 block tracking-widest font-mono">Email</label>
          <input 
            type="email" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary focus:outline-none transition-all"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1 mb-2 block tracking-widest font-mono">Senha</label>
          <input 
            type="password" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary focus:outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-3 rounded-xl border border-red-400/20">
            {error}
          </p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
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
