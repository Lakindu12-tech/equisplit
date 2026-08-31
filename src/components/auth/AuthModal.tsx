import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Layers
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    signupWithEmail, 
    loginAnonymously 
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'guest'>('guest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';
    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return 'Provider disabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable Anonymous, Email/Password, or Google.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Invalid email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists with this email.';
    }
    return msg || 'Authentication error occurred.';
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Please provide your name');
          setIsLoading(false);
          return;
        }
        await signupWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginAnonymously(guestName.trim() || undefined);
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060e20]/80 backdrop-blur-xl">
      {/* Dynamic Ambient Volumetric Lighting */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-md relative z-10 glass-3d-volumetric rounded-3xl p-8 border border-white/15 text-[#dae2fd] shadow-2xl shadow-black/80"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 border border-emerald-400/40 mb-4 shadow-lg shadow-emerald-500/20">
            <Layers className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            EquiSplit <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono">v2.0 PRO</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Intelligent expense sharing & deterministic debt optimization
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 border border-white/10 rounded-2xl mb-6">
          <button
            id="auth-tab-guest"
            type="button"
            onClick={() => { setMode('guest'); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'guest' 
                ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Instant Guest
          </button>
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signin' 
                ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signup' 
                ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google 1-Click Auth */}
        <button
          id="btn-google-login"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full mb-6 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/15 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0b1326] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest absolute">
            or with {mode === 'guest' ? 'instant access' : 'credentials'}
          </span>
        </div>

        {/* Dynamic Form Content */}
        <AnimatePresence mode="wait">
          {mode === 'guest' ? (
            <motion.form
              key="guest-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleGuestLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Nickname / Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-guest-name"
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Saman Perera"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/60 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                🚀 Instant Zero-Friction Access: Test live multi-user sync immediately. You can upgrade to a permanent Google/Email account anytime without losing data!
              </p>

              <button
                id="btn-guest-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>{isLoading ? 'Starting Session...' : 'Enter EquiSplit Instant Session'}</span>
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleEmailAuth}
              className="space-y-4"
            >
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-auth-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Kamal Silva"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-emerald-400/60 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-emerald-400/60 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-emerald-400/60 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>{isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Account' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
