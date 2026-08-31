import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatCents } from '../../utils/debtOptimizer';
import { 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  CreditCard,
  X
} from 'lucide-react';
import { Debt } from '../../types';

export const BalancesLedger: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentGroup, 
    simplifiedDebts, 
    rawDebts, 
    isSimplified, 
    setIsSimplified,
    settleDebt
  } = useApp();

  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<Debt | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  if (!currentGroup || !currentUser) return null;

  const activeDebts = isSimplified ? simplifiedDebts : rawDebts;

  const handleConfirmSettle = async () => {
    if (!selectedDebtToSettle) return;
    setIsSettling(true);
    try {
      await settleDebt(
        selectedDebtToSettle.from,
        selectedDebtToSettle.to,
        selectedDebtToSettle.amount
      );
      setSelectedDebtToSettle(null);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-emerald-400" />
            <span>Balances & Settlement Ledger</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track exact creditor-debtor paths and settle balances with one click.
          </p>
        </div>

        {/* Toggle: Simplified vs Raw Matrix */}
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 shrink-0">
          <button
            onClick={() => setIsSimplified(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isSimplified
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simplified ({simplifiedDebts.length})</span>
          </button>
          <button
            onClick={() => setIsSimplified(false)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              !isSimplified
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Detailed ({rawDebts.length})</span>
          </button>
        </div>
      </div>

      {/* Algorithmic Efficiency Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex items-start sm:items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-emerald-400 font-semibold">Minimum Cash Flow Engine Active:</strong>{' '}
          {isSimplified
            ? `Instead of everyone paying multiple people back and forth, debts are mathematically simplified into the fewest possible direct transfers. ${
                rawDebts.length > simplifiedDebts.length 
                  ? `(Reduced ${rawDebts.length} raw transactions down to ${simplifiedDebts.length} optimized settlements!)` 
                  : ''
              }`
            : 'Displaying direct unsimplified peer-to-peer balance graph.'}
        </p>
      </div>

      {/* Debt Cards Grid with Hardware-Accelerated Framer Motion */}
      {activeDebts.length === 0 ? (
        <div className="glass-3d-volumetric rounded-3xl p-12 text-center border border-white/10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">All Balances Settled</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            There are no pending debts in <strong className="text-slate-200">{currentGroup.name}</strong>. Great job keeping finances balanced!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {activeDebts.map((debt, index) => {
              const debtor = users.find(u => u.uid === debt.from);
              const creditor = users.find(u => u.uid === debt.to);
              const isUserDebtor = debt.from === currentUser.uid;
              const isUserCreditor = debt.to === currentUser.uid;
              const isUserInvolved = isUserDebtor || isUserCreditor;

              return (
                <motion.div
                  key={`${debt.from}-${debt.to}-${index}`}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 gpu-accel ${
                    isUserDebtor
                      ? 'glass-3d-debt'
                      : isUserCreditor
                      ? 'glass-3d-hero'
                      : 'glass-3d-volumetric'
                  }`}
                >
                  {/* Flow Row: Debtor -> Amount -> Creditor */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Debtor */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={debtor?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${debt.from}`}
                        alt={debtor?.displayName || 'Debtor'}
                        className="w-10 h-10 rounded-2xl object-cover border border-rose-400/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase font-bold text-rose-400 block tracking-wider">
                          Debtor
                        </span>
                        <span className="text-sm font-bold text-white truncate block">
                          {isUserDebtor ? 'You' : debtor?.displayName || 'Member'}
                        </span>
                      </div>
                    </div>

                    {/* Arrow & Amount */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-base font-extrabold font-mono text-white whitespace-nowrap">
                        {formatCents(debt.amount, currentGroup.currency)}
                      </span>
                      <div className="flex items-center text-emerald-400 mt-1">
                        <div className="w-8 sm:w-12 h-[1.5px] bg-gradient-to-r from-rose-400/60 to-emerald-400/60" />
                        <ArrowRight className="w-3.5 h-3.5 -ml-1" />
                      </div>
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-3 min-w-0 flex-row-reverse text-right">
                      <img
                        src={creditor?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${debt.to}`}
                        alt={creditor?.displayName || 'Creditor'}
                        className="w-10 h-10 rounded-2xl object-cover border border-emerald-400/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block tracking-wider">
                          Creditor
                        </span>
                        <span className="text-sm font-bold text-white truncate block">
                          {isUserCreditor ? 'You' : creditor?.displayName || 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settle Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-[11px] text-slate-400">
                      {isUserDebtor && 'You must pay this amount'}
                      {isUserCreditor && 'You are owed this amount'}
                      {!isUserInvolved && 'Third-party transfer'}
                    </span>

                    <button
                      onClick={() => setSelectedDebtToSettle(debt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isUserInvolved
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Settlement</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Settle Confirmation Modal */}
      {selectedDebtToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full max-w-md glass-3d-volumetric rounded-3xl p-6 border border-white/15 text-[#dae2fd] shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Confirm Settlement</span>
              </h3>
              <button
                onClick={() => setSelectedDebtToSettle(null)}
                className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-6 text-center">
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mb-2">
                {formatCents(selectedDebtToSettle.amount, currentGroup.currency)}
              </div>
              <p className="text-xs text-slate-300">
                Mark that{' '}
                <strong className="text-white">
                  {users.find(u => u.uid === selectedDebtToSettle.from)?.displayName || 'Debtor'}
                </strong>{' '}
                has paid{' '}
                <strong className="text-white">
                  {users.find(u => u.uid === selectedDebtToSettle.to)?.displayName || 'Creditor'}
                </strong>
                ?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedDebtToSettle(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSettling}
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-lg shadow-emerald-500/25"
              >
                {isSettling ? 'Recording...' : 'Confirm & Settle'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
