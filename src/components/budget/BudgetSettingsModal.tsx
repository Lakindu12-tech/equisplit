import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { CategoryIcon } from '../common/CategoryIcon';
import { DataStore } from '../../services/store';
import { X, Settings2, Check, AlertCircle, Sparkles } from 'lucide-react';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentGroup, currentUser } = useApp();
  const groupCurrency = currentGroup?.currency || 'LKR';

  const [budgetInputs, setBudgetInputs] = useState<Record<Category, string>>({
    food: '',
    transport: '',
    lodging: '',
    entertainment: '',
    groceries: '',
    utilities: '',
    general: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentGroup?.budgets) {
      const initial: Record<Category, string> = {
        food: '',
        transport: '',
        lodging: '',
        entertainment: '',
        groceries: '',
        utilities: '',
        general: '',
      };

      for (const [cat, cents] of Object.entries(currentGroup.budgets)) {
        if (cents && cents > 0) {
          initial[cat as Category] = (cents / 100).toString();
        }
      }
      setBudgetInputs(initial);
    }
  }, [currentGroup?.id, isOpen]);

  if (!isOpen || !currentGroup) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedBudgets: Partial<Record<Category, number>> = {};
      for (const [cat, valStr] of Object.entries(budgetInputs)) {
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
          updatedBudgets[cat as Category] = Math.round(val * 100);
        }
      }

      await DataStore.getInstance().updateGroupBudgets(currentGroup.id, updatedBudgets, currentUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update budgets');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-lg glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15 text-[#dae2fd] shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Monthly Envelopes</h2>
              <p className="text-xs text-slate-400">Set budget limits for {currentGroup.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <p className="text-xs text-slate-400">
            When category spending reaches <strong>80%</strong> of the monthly limit, cards glow amber. At <strong>100%</strong>, they transition to danger red.
          </p>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {(Object.keys(CATEGORIES) as Category[]).map(cat => (
              <div
                key={cat}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    <CategoryIcon category={cat} size="sm" />
                  </div>
                  <span className="text-xs font-semibold text-white capitalize">{cat}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">{groupCurrency}</span>
                  <input
                    type="number"
                    step="1"
                    placeholder="No limit"
                    value={budgetInputs[cat] || ''}
                    onChange={e => setBudgetInputs({ ...budgetInputs, [cat]: e.target.value })}
                    className="w-28 px-2.5 py-1.5 bg-black/50 border border-white/10 focus:border-emerald-400 rounded-xl text-xs font-mono text-white text-right outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              id="btn-save-budgets"
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-lg shadow-emerald-500/25"
            >
              {isSaving ? 'Saving...' : 'Save Envelopes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
