import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Category, Expense } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { formatCents } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { X, Edit, Calendar, DollarSign, Check, AlertCircle } from 'lucide-react';

export const EditExpenseModal: React.FC = () => {
  const { 
    editingExpense, 
    setEditingExpense, 
    updateExpense, 
    currentGroup 
  } = useApp();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmountStr((editingExpense.amount / 100).toFixed(2));
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNotes(editingExpense.notes || '');
      setError(null);
    }
  }, [editingExpense]);

  if (!editingExpense || !currentGroup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountCents = Math.round(parsed * 100);
    setIsLoading(true);

    try {
      // Re-calculate equal split if equal split mode
      let updatedSplits = editingExpense.splits;
      if (editingExpense.splitType === 'EQUAL') {
        const memberCount = Object.keys(editingExpense.splits).length || currentGroup.members.length;
        const splitPerMember = Math.floor(amountCents / memberCount);
        const remainder = amountCents % memberCount;
        const members = Object.keys(editingExpense.splits).length > 0 
          ? Object.keys(editingExpense.splits) 
          : currentGroup.members;

        updatedSplits = {};
        members.forEach((uid, index) => {
          updatedSplits[uid] = splitPerMember + (index < remainder ? 1 : 0);
        });
      }

      await updateExpense(editingExpense, {
        title: title.trim(),
        amount: amountCents,
        category,
        date,
        notes: notes.trim(),
        splits: updatedSplits,
      });

      setEditingExpense(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full max-w-lg glass-3d-volumetric rounded-3xl p-6 border border-white/15 text-[#dae2fd] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30">
              <Edit className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Expense</h2>
              <p className="text-xs text-slate-400">Update details with audit trail</p>
            </div>
          </div>
          <button 
            onClick={() => setEditingExpense(null)}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ({currentGroup.currency})</label>
              <input
                type="number"
                step="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl text-sm font-mono text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm' 
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-slate-400'
                    }`}
                  >
                    <CategoryIcon category={cat.id} size="sm" />
                    <span className="text-[10px] font-medium truncate w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl text-xs text-white outline-none"
              placeholder="Add optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingExpense(null)}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? 'Saving...' : 'Save & Log Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
