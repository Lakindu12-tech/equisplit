import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatCents, normalizePaidBy } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { SpatialCard } from '../common/SpatialCard';
import { SmartAddBar } from './SmartAddBar';
import { ReceiptModal } from '../receipts/ReceiptModal';
import { BudgetOverview } from '../budget/BudgetOverview';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Plus, 
  Scale, 
  Calendar, 
  Layers, 
  Receipt,
  Search,
  Users
} from 'lucide-react';
import { Expense } from '../../types';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentGroup, 
    expenses, 
    netBalances, 
    simplifiedDebts, 
    setIsAddExpenseOpen,
    setIsCreateGroupOpen,
    setEditingExpense,
    deleteExpense,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState<Expense | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  if (!currentUser) return null;

  if (!currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
          <Layers className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to EquiSplit v4.0 🇱🇰</h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Ultimate Financial Engine with OCR Receipt Itemization, Envelope Budgeting, Recurring Bills, QR Invites, and Bank CSV Importer.
        </p>
        <button
          id="btn-create-first-group"
          onClick={() => setIsCreateGroupOpen(true)}
          className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create First Group</span>
        </button>
      </div>
    );
  }

  const myBalanceObj = netBalances[currentUser.uid] || { totalPaid: 0, totalOwed: 0, netBalance: 0 };
  const myNetCents = myBalanceObj.netBalance;
  const isPositive = myNetCents > 0;
  const isNegative = myNetCents < 0;
  const isZero = myNetCents === 0;

  const totalGroupSpentCents = expenses.reduce((sum, e) => sum + e.amount, 0);
  const groupMembers = users.filter(u => currentGroup.members.includes(u.uid));

  // Client-side search filtering
  const filteredExpenses = expenses.filter(exp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(q) ||
      exp.category.toLowerCase().includes(q) ||
      (exp.searchKeywords && exp.searchKeywords.some(k => k.includes(q)))
    );
  });

  const displayedExpenses = filteredExpenses.slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* Magic Natural Language Smart Add Bar */}
      <SmartAddBar />

      {/* Top Banner: Spatial 3D Hero Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main User Balance Spatial Hero */}
        <SpatialCard
          depth={30}
          glowColor={isPositive ? 'rgba(16, 185, 129, 0.25)' : isNegative ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.1)'}
          className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 border transition-all ${
            isPositive
              ? 'glass-3d-hero'
              : isNegative
              ? 'glass-3d-debt'
              : 'glass-3d-volumetric'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-300">
              Personal Net Balance
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Group:</span>
              <span className="font-semibold text-white truncate max-w-[150px]">{currentGroup.name}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono ${
                    isPositive
                      ? 'text-emerald-400'
                      : isNegative
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {formatCents(myNetCents, currentGroup.currency)}
                </span>
                {isPositive && <TrendingUp className="w-6 h-6 text-emerald-400" />}
                {isNegative && <TrendingDown className="w-6 h-6 text-rose-400" />}
                {isZero && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-300 mt-2">
                {isPositive && `Overall, other group members owe you a total of ${formatCents(myNetCents, currentGroup.currency)}.`}
                {isNegative && `Overall, you owe other group members a total of ${formatCents(Math.abs(myNetCents), currentGroup.currency)}.`}
                {isZero && 'All your group expenses and debts are completely settled!'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('ledger')}
              className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all shadow-md"
            >
              <span>View Settlement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Micro Balance Split */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-slate-400 block font-mono">Total You Paid</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {formatCents(myBalanceObj.totalPaid, currentGroup.currency)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-slate-400 block font-mono">Your Total Share</span>
              <span className="text-lg font-bold font-mono text-white">
                {formatCents(myBalanceObj.totalOwed, currentGroup.currency)}
              </span>
            </div>
          </div>
        </SpatialCard>

        {/* Group Total Spent & Quick Actions */}
        <SpatialCard
          depth={20}
          className="glass-3d-volumetric rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/15"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-400">
                Group Spending
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {expenses.length} Total
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-mono text-white">
                {formatCents(totalGroupSpentCents, currentGroup.currency)}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Total expenditure across all {groupMembers.length} group members.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              id="btn-dashboard-add-expense"
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Expense</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Settle Up Debts</span>
            </button>
          </div>
        </SpatialCard>
      </div>

      {/* Group Members Presence Rail */}
      <div className="glass-panel-subtle rounded-3xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Group Members</span>
            <span className="text-[11px] font-mono text-slate-400">({groupMembers.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groupMembers.map((member) => {
            const memberBalance = netBalances[member.uid]?.netBalance || 0;
            const isMe = member.uid === currentUser.uid;

            return (
              <div
                key={member.uid}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 relative overflow-hidden"
              >
                <div className="relative shrink-0">
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-9 h-9 rounded-xl object-cover border border-white/20"
                  />
                  <span 
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#060e20] ${
                      member.isOnline ? 'bg-emerald-500 presence-glow-online' : 'bg-slate-500'
                    }`} 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-white truncate block">
                    {isMe ? 'You' : member.displayName}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-medium truncate block ${
                      memberBalance > 0
                        ? 'text-emerald-400'
                        : memberBalance < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatCents(memberBalance, currentGroup.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Envelope Budgets with 80% Ambient Warnings */}
      <BudgetOverview />

      {/* Expenses Header with Search Filter */}
      <div className="glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Expenses & Transactions</h3>
            <p className="text-xs text-slate-400">Real-time synchronized group transactions with Multi-Payer & Receipts</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Rapid Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400"
              />
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {displayedExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">No expenses found matching your query.</p>
                <p className="text-xs text-slate-500 mt-1">Use the Quick Add bar above or click "+ Add" to create one.</p>
              </div>
            ) : (
              displayedExpenses.map((expense) => {
                const paidBy = normalizePaidBy(expense);
                const payerCount = Object.keys(paidBy).length;
                const isMultiPayer = payerCount > 1;
                const singlePayer = users.find(u => u.uid === expense.payerId);
                const isPaidByMe = !isMultiPayer && expense.payerId === currentUser.uid;
                const myPaidCents = paidBy[currentUser.uid] || 0;
                const myOwedCents = expense.splits[currentUser.uid] || 0;

                return (
                  <SpatialCard
                    key={expense.id}
                    depth={15}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 gpu-accel"
                  >
                    {/* Left: Category Icon + Title + Multi-Payer Tag */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                        <CategoryIcon category={expense.category} size="md" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{expense.title}</h4>
                          {expense.receiptUrl && (
                            <button
                              onClick={() => setSelectedReceiptExpense(expense)}
                              title="View Attached Receipt"
                              className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {isMultiPayer ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <Users className="w-3 h-3" />
                              <span>Split Paid ({payerCount} contributors)</span>
                            </span>
                          ) : (
                            <span>Paid by <strong className="text-slate-200">{isPaidByMe ? 'You' : singlePayer?.displayName || 'Member'}</strong></span>
                          )}
                          <span>•</span>
                          <span className="font-mono text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {expense.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Amount + Your Share + Edit/Delete Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-white block">
                          {formatCents(expense.amount, currentGroup.currency)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {myPaidCents > myOwedCents 
                            ? `You lent ${formatCents(myPaidCents - myOwedCents, currentGroup.currency)}`
                            : myOwedCents > myPaidCents 
                            ? `Your share: ${formatCents(myOwedCents - myPaidCents, currentGroup.currency)}`
                            : 'Settled on bill'}
                        </span>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          title="Edit Expense"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete expense "${expense.title}"?`)) {
                              deleteExpense(expense);
                            }
                          }}
                          title="Delete Expense"
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </SpatialCard>
                );
              })
            )}
          </AnimatePresence>

          {/* Pagination: Load More Button */}
          {filteredExpenses.length > visibleCount && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setVisibleCount(visibleCount + 20)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-all"
              >
                Load More Expenses ({filteredExpenses.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Receipt Viewer Modal */}
      {selectedReceiptExpense && (
        <ReceiptModal
          receiptUrl={selectedReceiptExpense.receiptUrl || null}
          title={selectedReceiptExpense.title}
          onClose={() => setSelectedReceiptExpense(null)}
        />
      )}
    </div>
  );
};
