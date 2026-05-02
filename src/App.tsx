import React, { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from './lib/supabase.ts';
import { Loader2, Zap } from 'lucide-react';

// Screens
import LandingScreen from './screens/LandingScreen.tsx';
import AuthScreen from './screens/AuthScreen.tsx';
import Dashboard from './screens/Dashboard.tsx';
import OnboardingFlow from './screens/onboarding/OnboardingFlow.tsx';

export default function App() {
  const [session, setSession] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'onboarding'>('landing');
  const [authError, setAuthError] = useState('');

  const getClient = () => {
    try {
      return getSupabase();
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFIG_MISSING') {
        setConfigMissing(true);
      }
      return null;
    }
  };

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (email: string, pass: string, isSignUp: boolean) => {
    setAuthError('');
    const supabase = getClient();
    if (!supabase) return;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message || 'Erro na autenticação');
    }
  };

  const logout = async () => {
    const supabase = getClient();
    if (supabase) await supabase.auth.signOut();
  };

  if (configMissing) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center border border-primary/20">
            <Zap className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold">Configuração do Supabase</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Adicione a URL e a Anon Key do Supabase nos <strong className="text-white">Secrets</strong> do AI Studio para ativar o banco de dados.
          </p>
          <div className="bg-white/5 p-4 rounded-xl font-mono text-left text-[10px] space-y-2 border border-white/5">
            <p className="text-primary">VITE_SUPABASE_URL</p>
            <p className="text-primary">VITE_SUPABASE_ANON_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  // Router Logic
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto border-x border-white/5 bg-dark-bg shadow-2xl relative">
      {session ? (
        <Dashboard session={session} onLogout={logout} />
      ) : (
        <>
          {currentView === 'landing' && (
            <LandingScreen 
              onStart={() => setCurrentView('onboarding')} 
              onLogin={() => setCurrentView('auth')} 
            />
          )}
          {currentView === 'onboarding' && (
            <OnboardingFlow 
              onComplete={(data) => {
                console.log('Onboarding data:', data);
                setCurrentView('auth');
              }}
              onBack={() => setCurrentView('landing')}
            />
          )}
          {currentView === 'auth' && (
            <AuthScreen 
              onBack={() => setCurrentView('landing')} 
              onAuth={handleAuth}
              error={authError}
            />
          )}
        </>
      )}
    </div>
  );
}
