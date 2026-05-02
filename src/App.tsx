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
  const [pendingProfileData, setPendingProfileData] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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

  const handleAuth = async (email: string, pass: string, isSignUp: boolean, fullName?: string) => {
    setAuthError('');
    const supabase = getClient();
    if (!supabase) return;

    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({ 
          email, 
          password: pass,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Esta conta já existe. Tenta fazer login em vez de te registares.');
          }
          throw error;
        }
        
        // Save profile data if we have it
        if (signUpData.user && pendingProfileData) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              name: fullName || pendingProfileData.name,
              email: email,
              profile_type: pendingProfileData.profile_type,
              province: pendingProfileData.province,
              gender: pendingProfileData.gender,
              age: parseInt(pendingProfileData.age),
              goal: pendingProfileData.goal,
              diet: pendingProfileData.diet,
              activity: pendingProfileData.activity,
              restrictions: pendingProfileData.restrictions,
              is_onboarded: true,
              total_scanned: 0,
              current_streak: 0
            });
          if (profileError) console.error('Error saving profile:', profileError);
        }

        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou palavra-passe incorretos. Verifica se a conta existe.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('O teu e-mail ainda não foi confirmado. Verifica a tua caixa de entrada.');
          }
          throw error;
        }
      }
    } catch (error: any) {
      setAuthError(error.message || 'Erro inesperado na autenticação');
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
    <div className="min-h-screen flex flex-col max-w-lg mx-auto border-x border-white/5 bg-[#0A0B0D] shadow-2xl relative font-sans">
      {session ? (
        <Dashboard session={session} onLogout={logout} />
      ) : (
        <>
          {currentView === 'landing' && (
            <LandingScreen 
              onStart={() => setCurrentView('onboarding')} 
              onLogin={() => {
                setAuthError('');
                setCurrentView('auth');
              }} 
            />
          )}
          {currentView === 'onboarding' && (
            <OnboardingFlow 
              onComplete={(mode, profileData) => {
                setAuthError('');
                setPendingProfileData(profileData);
                setAuthMode('signup');
                setCurrentView('auth');
              }}
              onBack={() => setCurrentView('landing')}
            />
          )}
          {currentView === 'auth' && (
            <AuthScreen 
              onBack={() => setCurrentView('landing')} 
              onAuth={handleAuth}
              onSwitchToSignUp={() => {
                setCurrentView('onboarding');
              }}
              error={authError}
              initialMode={authMode}
            />
          )}
        </>
      )}
    </div>
  );
}
