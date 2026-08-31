import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  X, 
  ShieldCheck, 
  Link as LinkIcon, 
  LogOut, 
  Check, 
  Sparkles, 
  Mail, 
  Lock, 
  AlertCircle 
} from 'lucide-react';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    firebaseUser, 
    linkAccountWithGoogle, 
    linkAccountWithEmail, 
    updateUserDisplayName,
    logout 
  } = useApp();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLink, setShowEmailLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const isAnonymous = firebaseUser?.isAnonymous;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await updateUserDisplayName(name.trim());
      setIsEditingName(false);
      setSuccess('Display name updated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    }
  };

  const handleLinkGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await linkAccountWithGoogle();
      setSuccess('Account successfully linked with Google!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await linkAccountWithEmail(email, password);
      setShowEmailLink(false);
      setSuccess('Account successfully upgraded with Email!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative z-10 w-full max-w-md h-full glass-3d-volumetric p-6 flex flex-col border-l border-white/15 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Profile & Account</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative mb-4">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.displayName}
              className="w-20 h-20 rounded-2xl border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/20 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#060e20] flex items-center justify-center presence-glow-online">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>

          {!isEditingName ? (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{currentUser.displayName}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-emerald-400 hover:underline font-mono"
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateName} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1 bg-black/40 border border-emerald-400/50 rounded-xl text-sm text-white outline-none"
              />
              <button
                type="submit"
                className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="text-xs text-slate-400 mt-1 font-mono">{currentUser.email || 'Anonymous Session'}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active & Online</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Upgrade Anonymous Account Section */}
        {isAnonymous && (
          <div className="mt-6 p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-teal-950/20 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Permanent Account</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You are currently using an Instant Guest account. Upgrade to preserve all your expenses, groups, and settlements across all devices!
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link with Google (Keep all data)</span>
              </button>

              {!showEmailLink ? (
                <button
                  type="button"
                  onClick={() => setShowEmailLink(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Link with Email & Password</span>
                </button>
              ) : (
                <form onSubmit={handleLinkEmail} className="mt-3 space-y-2 pt-2 border-t border-white/10">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl"
                    >
                      Save & Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailLink(false)}
                      className="px-3 py-2 bg-white/10 text-slate-300 text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* UID & Info */}
        <div className="mt-6 space-y-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 block font-mono">User ID</span>
            <span className="text-xs text-slate-200 font-mono break-all">{currentUser.uid}</span>
          </div>
        </div>

        {/* Logout Footer */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            id="btn-logout"
            type="button"
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
