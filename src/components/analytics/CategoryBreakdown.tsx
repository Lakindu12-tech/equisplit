import React from 'react';
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
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <PieChart className="w-6 h-6 text-emerald-400" />
          <span>Spending Analytics & Insights</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed category breakdown and member expenditure distribution.
        </p>
      </div>

      {/* Top Cards: Total Spent, Avg per member, Category Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl glass-panel">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Group Spend</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {formatCents(totalSpentCents, currentGroup.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across {expenses.length} total entries
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-muted-foreground mb-1">
            <Wallet className="w-4 h-4 text-teal-400" />
            <span>Average Per Person</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {groupMembers.length > 0
              ? formatCents(Math.round(totalSpentCents / groupMembers.length), currentGroup.currency)
              : '$0.00'
            }
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Split evenly across {groupMembers.length} members
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Active Categories</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {sortedCategories.length} <span className="text-sm font-normal text-muted-foreground">/ 7</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {sortedCategories[0] ? `Top: ${CATEGORIES[sortedCategories[0]].label}` : 'No expenses yet'}
          </div>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white">Expense Distribution by Category</h3>

        {sortedCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No expenses categorized yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((catKey) => {
              const cat = CATEGORIES[catKey];
              const amount = categoryTotals[catKey];
              const percentage = totalSpentCents > 0 
                ? ((amount / totalSpentCents) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={catKey} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon category={catKey} size="sm" />
                      <span className="font-semibold text-white">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {percentage}%
                      </span>
                      <span className="font-bold font-mono text-white">
                        {formatCents(amount, currentGroup.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color,
                        boxShadow: `0 0 10px ${cat.color}88`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Expenditure Breakdown */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-6">Payer Contribution Share</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {groupMembers.map((member) => {
            const paid = memberSpentTotals[member.uid] || 0;
            const pct = totalSpentCents > 0 ? ((paid / totalSpentCents) * 100).toFixed(0) : '0';

            return (
              <div key={member.uid} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={member.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white truncate">{member.displayName}</div>
                    <div className="text-xs text-muted-foreground">{pct}% of total spend</div>
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {formatCents(paid, currentGroup.currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
