import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseNaturalLanguageExpense } from '../../utils/nlpParser';
import { formatCents } from '../../utils/debtOptimizer';
import { Sparkles, ArrowRight, Check, Zap, AlertCircle } from 'lucide-react';
import { SmartAddDraft } from '../../types';

export const SmartAddBar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentGroup, 
    addExpense, 
    setIsAddExpenseOpen 
  } = useApp();

  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<SmartAddDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const groupMembers = currentGroup 
    ? users.filter(u => currentGroup.members.includes(u.uid)) 
    : [];

  useEffect(() => {
    if (!input.trim() || !currentUser || !currentGroup) {
      setDraft(null);
      return;
    }

    const parsed = parseNaturalLanguageExpense(input, groupMembers, currentUser.uid);
    setDraft(parsed);
  }, [input, currentGroup?.id, currentUser?.uid]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !currentGroup || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        groupId: currentGroup.id,
        title: draft.title,
        amount: draft.amount,
        payerId: draft.payerId,
        paidBy: draft.paidBy,
        date: new Date().toISOString().split('T')[0],
        category: draft.category,
        splitType: draft.splitType,
        splits: draft.splits,
        notes: `Smart Added via Natural Language: "${input}"`
      });

      setInput('');
      setDraft(null);
      setSuccessMsg(`✨ Created "${draft.title}" for ${formatCents(draft.amount, currentGroup.currency)}!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Smart add failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentGroup || !currentUser) return null;

  return (
    <div className="w-full space-y-2 mb-6">
      <form 
        onSubmit={handleQuickAdd}
        className="relative flex items-center p-1.5 rounded-2xl glass-3d-volumetric border border-emerald-500/30 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all shadow-lg"
      >
        <div className="pl-3 pr-2 text-emerald-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>

        <input
          id="smart-add-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Magic Smart Add: 'Dinner 12000 Kamal paid', 'Uber 2500 with Sarah'..."
          className="w-full bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-400 outline-none font-medium"
        />

        <div className="flex items-center gap-1.5 pr-1">
          {draft && (
            <button
              id="btn-smart-add-submit"
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-[0.97]"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>{isSubmitting ? 'Adding...' : 'Add Now'}</span>
            </button>
          )}
        </div>
      </form>

      {/* Live AI Parsing Preview Pill */}
      {draft && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-2 animate-fade-in shadow-md">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white truncate">"{draft.title}"</span>
            <span>•</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCents(draft.amount, currentGroup.currency)}
            </span>
            <span>•</span>
            <span className="text-slate-300 truncate">
              Paid by <strong>{users.find(u => u.uid === draft.payerId)?.displayName || 'You'}</strong>
            </span>
            <span>•</span>
            <span className="text-slate-400">
              Split across {Object.keys(draft.splits).length} members
            </span>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 shrink-0 uppercase bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
            Press Enter to Save
          </span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
