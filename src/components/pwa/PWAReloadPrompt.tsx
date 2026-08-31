import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X, WifiOff, CheckCircle2, DownloadCloud } from 'lucide-react';

export const PWAReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-sm w-[calc(100vw-3rem)]">
      <AnimatePresence>
        {(needRefresh || offlineReady) && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="pointer-events-auto p-4 sm:p-5 rounded-3xl glass-3d-volumetric border border-emerald-500/40 bg-black/80 shadow-2xl shadow-emerald-950/50 backdrop-blur-2xl text-[#dae2fd] relative overflow-hidden"
          >
            {/* Ambient Volumetric Glow Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/25 shrink-0 mt-0.5">
                {needRefresh ? (
                  <DownloadCloud className="w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>{needRefresh ? 'Update Available' : 'Offline Mode Ready'}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PWA
                    </span>
                  </h4>
                  <button
                    id="btn-pwa-dismiss-x"
                    onClick={close}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {needRefresh
                    ? 'A new version of EquiSplit is ready with performance upgrades.'
                    : 'EquiSplit is cached and ready to work fully offline.'}
                </p>

                {needRefresh && (
                  <div className="flex items-center gap-2.5 mt-3.5">
                    <button
                      id="btn-pwa-update-now"
                      type="button"
                      onClick={handleUpdate}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update Now</span>
                    </button>
                    <button
                      id="btn-pwa-dismiss"
                      type="button"
                      onClick={close}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
