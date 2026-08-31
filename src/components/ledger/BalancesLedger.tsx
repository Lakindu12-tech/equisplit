import React, { useState } from 'react';
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

  if (!currentGroup) return null;

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
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-emerald-400" />
            <span>Balances & Settlement Ledger</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track exact creditor-debtor paths and settle balances with one click.
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setIsSimplified(true)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSimplified 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simplified ({simplifiedDebts.length})</span>
          </button>
          <button
            onClick={() => setIsSimplified(false)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              !isSimplified 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Detailed ({rawDebts.length})
          </button>
        </div>
      </div>

      {/* Algorithm Explainer Box */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-emerald-300 font-semibold">Minimum Cash Flow Engine Active: </strong>
          {isSimplified ? (
            <span>
              Instead of everyone paying multiple people back and forth, debts are mathematically simplified into the fewest possible direct transfers. 
              {rawDebts.length > simplifiedDebts.length && (
                <span className="text-white font-medium ml-1">
                  (Reduced {rawDebts.length} raw transactions down to {simplifiedDebts.length} optimized settlements!)
                </span>
              )}
            </span>
          ) : (
            <span>
              Displaying all bilateral pairwise debts directly derived from individual expense shares before simplification.
            </span>
          )}
        </div>
      </div>

      {/* Debts Matrix Grid */}
      {activeDebts.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">All Balances Settled</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            There are no pending debts in <strong className="text-slate-200">{currentGroup.name}</strong>. Great job keeping finances balanced!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDebts.map((debt, idx) => {
            const debtor = users.find(u => u.uid === debt.from);
            const creditor = users.find(u => u.uid === debt.to);
            const isMeInvolved = debt.from === currentUser.uid || debt.to === currentUser.uid;

            return (
              <div 
                key={idx}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between gap-6 ${
                  debt.from === currentUser.uid 
                    ? 'glass-card-debt' 
                    : debt.to === currentUser.uid 
                    ? 'glass-card-glow' 
                    : 'glass-panel'
                }`}
              >
                {/* Transfer Visualizer */}
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Debtor */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={debtor?.avatarUrl} 
                      alt="" 
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-500/40" 
                    />
                    <div>
                      <div className="text-xs text-rose-400 font-mono font-semibold uppercase tracking-wider">
                        Debtor
                      </div>
                      <div className="text-sm font-bold text-white">
                        {debt.from === currentUser.uid ? 'You' : debtor?.displayName}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Arrow with Amount */}
                  <div className="flex-1 flex flex-col items-center px-2">
                    <span className="text-sm font-extrabold font-mono text-white mb-1">
                      {formatCents(debt.amount, currentGroup.currency)}
                    </span>
                    <div className="w-full flex items-center gap-1">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-rose-500/50 via-amber-500/50 to-emerald-500/50" />
                      <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                  </div>

                  {/* Creditor */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-xs text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                        Creditor
                      </div>
                      <div className="text-sm font-bold text-white">
                        {debt.to === currentUser.uid ? 'You' : creditor?.displayName}
                      </div>
                    </div>
                    <img 
                      src={creditor?.avatarUrl} 
                      alt="" 
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40" 
                    />
                  </div>

                </div>

                {/* Settle Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-muted-foreground">
                    {isMeInvolved 
                      ? (debt.from === currentUser.uid ? 'You must pay this amount' : 'You will receive this payment') 
                      : 'Third-party transfer'
                    }
                  </span>

                  <button
                    onClick={() => setSelectedDebtToSettle(debt)}
                    className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Settlement</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Settle Up Confirmation Modal */}
      {selectedDebtToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-white/20 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Confirm Settlement</span>
              </h3>
              <button
                onClick={() => setSelectedDebtToSettle(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3">
              <div className="text-xs text-muted-foreground uppercase font-mono">
                Amount to settle
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {formatCents(selectedDebtToSettle.amount, currentGroup.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-white">
                  {users.find(u => u.uid === selectedDebtToSettle.from)?.displayName}
                </strong>
                {' '}pays{' '}
                <strong className="text-white">
                  {users.find(u => u.uid === selectedDebtToSettle.to)?.displayName}
                </strong>
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              This will record a direct settlement transaction in Firestore and reduce both members' balances to zero.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDebtToSettle(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-settle"
                onClick={handleConfirmSettle}
                disabled={isSettling}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isSettling ? 'Recording...' : 'Mark as Settled'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
