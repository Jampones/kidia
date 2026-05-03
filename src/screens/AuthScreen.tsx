import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onBack: () => void;
  onAuth: (email: string, pass: string, isSignUp: boolean, fullName?: string) => Promise<void>;
  onSwitchToSignUp?: () => void;
  error?: string;
  initialMode?: 'login' | 'signup';
}

export default function AuthScreen({ onBack, onAuth, onSwitchToSignUp, error, initialMode = 'login' }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !acceptedTerms) return;
    setLoading(true);
    await onAuth(email, password, isSignUp, fullName);
    setLoading(false);
  };

  if (showTerms) {
    return (
      <div className="flex-1 flex flex-col bg-[#0A0B0D] p-7 font-sans overflow-y-auto">
        <button 
          onClick={() => setShowTerms(false)} 
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/80 mb-8"
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-[28px] font-black text-white tracking-tight mb-6">
          {termsType === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
        </h2>

        <div className="space-y-6 text-white/50 text-sm leading-relaxed pb-10">
          <section>
            <h3 className="text-[#4ADE80] font-bold uppercase text-[11px] mb-2 tracking-widest">Nossa Missão</h3>
            <p>A Kidia Nutri é dedicada a melhorar a saúde dos angolanos através da tecnologia. Ao usares a nossa plataforma, assumes o compromisso de cuidar da tua saúde de forma consciente.</p>
          </section>

          <section>
            <h3 className="text-[#4ADE80] font-bold uppercase text-[11px] mb-2 tracking-widest">Dados e Privacidade</h3>
            <p>Utilizamos a inteligência artificial para analisar as tuas refeições. Os teus dados de perfil (idade, provincia e objectivos) são usados exclusivamente para personalizar as tuas recomendações nutricionais e nunca são partilhados com terceiros sem consentimento.</p>
          </section>

          <section>
            <h3 className="text-[#4ADE80] font-bold uppercase text-[11px] mb-2 tracking-widest">Responsabilidade</h3>
            <p>O kidiaNutri fornece orientações baseadas em dados científicos, mas não substitui a consulta com um nutricionista ou médico. Se tens condições de saúde graves, deves sempre seguir o conselho profissional.</p>
          </section>

          <section>
            <h3 className="text-[#4ADE80] font-bold uppercase text-[11px] mb-2 tracking-widest">Uso da Imagem</h3>
            <p>As fotos dos teus pratos são processadas pela nossa IA para extrair informações nutricionais. Guardamos o teu histórico de capturas para que possas acompanhar o teu progresso ao longo do tempo.</p>
          </section>
        </div>

        <button 
          onClick={() => setShowTerms(false)}
          className="w-full py-4 bg-[#4ADE80] text-[#0A0B0D] font-black rounded-xl mb-6 shadow-xl shadow-[#4ADE80]/10"
        >
          ENTENDI, VOLTAR
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0D] p-7 font-sans">
      {/* Circle Back Button */}
      <div className="flex justify-start mb-10 pt-2">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/80 hover:text-white transition-all transform active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="mb-10">
        <h2 className="text-[34px] font-black text-white tracking-tight mb-2 leading-tight">
          {isSignUp ? 'Cria a tua conta' : 'Bem-vindo de volta!'}
        </h2>
        <p className="text-white/40 text-[15px] font-medium leading-normal max-w-[280px]">
          {isSignUp 
            ? 'Começa hoje a tua jornada para uma vida mais saudável.' 
            : 'Faz login para continuar a cuidar da tua saúde.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <div>
            <label className="text-[11px] font-black text-white/50 ml-1 mb-2 block uppercase tracking-tight">Nome completo</label>
            <input 
              type="text" 
              required
              className="w-full bg-[#121417] border border-white/[0.03] rounded-[20px] px-6 py-5 text-sm font-medium focus:border-[#4ADE80]/40 focus:outline-none transition-all placeholder:text-white/10 text-white shadow-inner"
              placeholder="O teu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="text-[11px] font-black text-white/50 ml-1 mb-2 block uppercase tracking-tight">E-mail</label>
          <input 
            type="email" 
            required
            className="w-full bg-[#121417] border border-white/[0.03] rounded-[20px] px-6 py-5 text-sm font-medium focus:border-[#4ADE80]/40 focus:outline-none transition-all placeholder:text-white/10 text-white shadow-inner"
            placeholder="kavessealexandra@gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <label className="text-[11px] font-black text-white/50 ml-1 mb-2 block uppercase tracking-tight">Palavra-passe</label>
          <input 
            type="password" 
            required
            className="w-full bg-[#121417] border border-white/[0.03] rounded-[20px] px-6 py-5 text-sm font-medium focus:border-[#4ADE80]/40 focus:outline-none transition-all placeholder:text-white/10 text-white shadow-inner outline-none"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isSignUp && (
            <div className="flex justify-end mt-2">
              <button type="button" className="text-[11px] font-bold text-[#4ADE80] hover:opacity-80 transition-opacity">
                Esqueci-me da senha
              </button>
            </div>
          )}
        </div>

        {isSignUp && (
          <div className="flex items-start gap-3 pt-2">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-[4px] border-white/10 bg-[#121417] accent-[#4ADE80] focus:ring-0"
            />
            <p className="text-[11px] text-white/30 leading-relaxed font-medium">
              Ao criar uma conta, aceito os <button type="button" onClick={() => { setTermsType('terms'); setShowTerms(true); }} className="text-[#4ADE80] font-bold hover:underline">Termos de Uso</button> e a <button type="button" onClick={() => { setTermsType('privacy'); setShowTerms(true); }} className="text-[#4ADE80] font-bold hover:underline">Política de Privacidade</button> do Kidia Nutri.
            </p>
          </div>
        )}

        {error && (
          <div className="py-4 px-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-xs font-bold text-center">
              {error}
            </p>
          </div>
        )}

        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading || (isSignUp && !acceptedTerms)}
            className={`w-full py-5 rounded-[28px] font-black tracking-tight text-lg transition-all active:scale-[0.97] flex items-center justify-center ${
              (loading || (isSignUp && !acceptedTerms)) 
                ? 'bg-[#1A1C20] text-white/20 cursor-not-allowed border border-white/[0.02]' 
                : 'bg-[#00CC66] text-white shadow-xl shadow-[#00CC66]/20 hover:shadow-[#00CC66]/30'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Registar conta' : 'Entrar')}
          </button>
        </div>
      </form>

      <div className="mt-auto pt-8 text-center pb-6">
        <p className="text-[13px] text-white/40 font-medium tracking-tight">
          {isSignUp ? 'Já tens conta? ' : 'Não tens conta? '}
          <button 
            onClick={() => {
              if (!isSignUp && onSwitchToSignUp) {
                onSwitchToSignUp();
              } else {
                setIsSignUp(!isSignUp);
              }
            }}
            className="text-[#4ADE80] font-black hover:opacity-80 transition-opacity"
          >
            {isSignUp ? 'Faz login' : 'Regista-te agora'}
          </button>
        </p>
      </div>
    </div>
  );
}
