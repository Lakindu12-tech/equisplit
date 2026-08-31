import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../constants/categories';
import { Category, CategoryInfo } from '../../types';
import { formatCents } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { PieChart, TrendingUp, DollarSign, Wallet } from 'lucide-react';

export const CategoryBreakdown: React.FC = () => {
  const { currentGroup, expenses, users } = useApp();

  if (!currentGroup) return null;

  const totalSpentCents = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<Category, number> = {
    food: 0,
    transport: 0,
    lodging: 0,
    entertainment: 0,
    groceries: 0,
    utilities: 0,
    general: 0,
  };

  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  // Member totals
  const memberSpentTotals: Record<string, number> = {};
  for (const uid of currentGroup.members) {
    memberSpentTotals[uid] = 0;
  }
  for (const exp of expenses) {
    memberSpentTotals[exp.payerId] = (memberSpentTotals[exp.payerId] || 0) + exp.amount;
  }

  const sortedCategories = (Object.keys(categoryTotals) as Category[])
    .filter(cat => categoryTotals[cat] > 0)
    .sort((a, b) => categoryTotals[b] - categoryTotals[a]);

  const groupMembers = users.filter(u => currentGroup.members.includes(u.uid));

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <PieChart className="w-6 h-6 text-emerald-400" />
          <span>Spending Analytics & Insights</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Detailed category breakdown and member expenditure distribution.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-3d-volumetric p-5 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Group Spent</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {formatCents(totalSpentCents, currentGroup.currency)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {expenses.length} recorded items
          </span>
        </div>

        <div className="glass-3d-volumetric p-5 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg / Member</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {formatCents(
              groupMembers.length > 0 ? Math.round(totalSpentCents / groupMembers.length) : 0,
              currentGroup.currency
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Per person target share
          </span>
        </div>

        <div className="glass-3d-volumetric p-5 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Categories</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {sortedCategories.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {sortedCategories.length > 0 ? `Top: ${sortedCategories[0]}` : 'No expenses yet'}
          </span>
        </div>
      </div>

      {/* Category Breakdown Progress */}
      <div className="glass-3d-volumetric rounded-3xl p-6 border border-white/15">
        <h3 className="text-base font-bold text-white mb-4">Category Distribution</h3>

        {sortedCategories.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No categorized expenses in this group yet.</p>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((catKey) => {
              const catAmount = categoryTotals[catKey];
              const pct = totalSpentCents > 0 ? (catAmount / totalSpentCents) * 100 : 0;
              const catMeta = CATEGORIES[catKey];

              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={catKey} size="sm" />
                      <span className="font-semibold text-white">{catMeta?.label || catKey}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {formatCents(catAmount, currentGroup.currency)}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Hardware-accelerated progress bar */}
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Expenditure Breakdown */}
      <div className="glass-3d-volumetric rounded-3xl p-6 border border-white/15">
        <h3 className="text-base font-bold text-white mb-4">Member Contributions (Paid Upfront)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {groupMembers.map((member) => {
            const paid = memberSpentTotals[member.uid] || 0;
            const pct = totalSpentCents > 0 ? (paid / totalSpentCents) * 100 : 0;

            return (
              <div
                key={member.uid}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-8 h-8 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white truncate block">{member.displayName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{pct.toFixed(0)}% of group</span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  {formatCents(paid, currentGroup.currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
