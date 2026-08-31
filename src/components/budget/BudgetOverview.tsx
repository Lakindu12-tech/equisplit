import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { formatCents } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { SpatialCard } from '../common/SpatialCard';
import { BudgetSettingsModal } from './BudgetSettingsModal';
import { 
  PieChart, 
  AlertTriangle, 
  Settings2, 
  TrendingUp, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const BudgetOverview: React.FC = () => {
  const { currentGroup, expenses } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!currentGroup) return null;

  const groupCurrency = currentGroup.currency || 'LKR';
  const budgets = currentGroup.budgets || {};

  // Compute this month's spending per category
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthExpenses = expenses.filter(e => (e.date || '').startsWith(currentMonthKey));

  const categorySpending: Record<Category, number> = {
    food: 0,
    transport: 0,
    lodging: 0,
    entertainment: 0,
    groceries: 0,
    utilities: 0,
    general: 0,
  };

  for (const exp of currentMonthExpenses) {
    categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
  }

  // Active categories that have either a budget or spending
  const activeCategories = (Object.keys(CATEGORIES) as Category[]).filter(
    cat => (budgets[cat] && budgets[cat]! > 0) || categorySpending[cat] > 0
  );

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Monthly Envelope Budgets
            </h3>
            <p className="text-[11px] text-slate-400">Smart 80% threshold tracking with dynamic ambient alerts</p>
          </div>
        </div>

        <button
          id="btn-open-budget-settings"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all active:scale-95"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Set Envelopes</span>
        </button>
      </div>

      {activeCategories.length === 0 ? (
        <div className="p-6 rounded-3xl glass-panel-subtle border border-white/10 text-center flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400">No monthly budgets configured for this group yet.</p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
          >
            Configure Monthly Budgets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCategories.map(cat => {
            const spent = categorySpending[cat] || 0;
            const limit = budgets[cat] || 0;
            const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 150) : 0;
            const isWarning = limit > 0 && percent >= 80 && percent < 100;
            const isOverBudget = limit > 0 && percent >= 100;

            const radius = 24;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;

            let cardGlow = 'rgba(16, 185, 129, 0.15)'; // Emerald
            let ringColor = '#34d399'; // Emerald-400
            let borderColor = 'border-white/10';

            if (isOverBudget) {
              cardGlow = 'rgba(239, 68, 68, 0.25)'; // Red
              ringColor = '#ef4444';
              borderColor = 'border-rose-500/40 bg-rose-950/20';
            } else if (isWarning) {
              cardGlow = 'rgba(245, 158, 11, 0.25)'; // Amber 80% Warning
              ringColor = '#f59e0b';
              borderColor = 'border-amber-500/40 bg-amber-950/20';
            }

            return (
              <SpatialCard
                key={cat}
                depth={15}
                glowColor={cardGlow}
                className={`p-4 rounded-3xl border transition-all ${borderColor} glass-3d-volumetric flex items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                    <CategoryIcon category={cat} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white capitalize truncate">{cat}</span>
                      {isOverBudget && (
                        <span className="p-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px]" title="Over Budget!">
                          <ShieldAlert className="w-3 h-3" />
                        </span>
                      )}
                      {isWarning && (
                        <span className="p-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px]" title="80% Budget Warning">
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-white block mt-0.5">
                      {formatCents(spent, groupCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {limit > 0 ? `of ${formatCents(limit, groupCurrency)}` : 'No limit set'}
                    </span>
                  </div>
                </div>

                {/* SVG Progress Ring */}
                {limit > 0 ? (
                  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-white/10 fill-transparent"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke={ringColor}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out fill-transparent"
                      />
                    </svg>
                    <span
                      className={`absolute font-mono text-[11px] font-bold ${
                        isOverBudget ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10 shrink-0">
                    Active
                  </div>
                )}
              </SpatialCard>
            );
          })}
        </div>
      )}

      {/* Settings Modal */}
      <BudgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
