import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCents } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Sparkles, 
  Plus,
  Scale,
  Calendar,
  Layers
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentGroup, 
    expenses, 
    netBalances, 
    simplifiedDebts, 
    rawDebts,
    isSimplified, 
    setIsSimplified,
    setIsAddExpenseOpen,
    setIsCreateGroupOpen,
    deleteExpense,
    setActiveTab
  } = useApp();

  if (!currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
          <Layers className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to EquiSplit 🇱🇰</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          The smart, automated way to split group expenses with friends and roommates. Create your first group to start splitting!
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

  // Calculate Group Total Spent
  const totalGroupSpentCents = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group members details
  const groupMembers = users.filter(u => currentGroup.members.includes(u.uid));

  // Debts related to current user
  const mySimplifiedDebts = simplifiedDebts.filter(
    d => d.from === currentUser.uid || d.to === currentUser.uid
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. Hero Net Balance & Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Net Balance Glass Card */}
        <div className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden ${
          isPositive 
            ? 'glass-card-glow' 
            : isNegative 
            ? 'glass-card-debt' 
            : 'glass-panel'
        }`}>
          {/* Subtle Ambient Background Glow */}
          <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30 ${
            isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-blue-500'
          }`} />

          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground px-3 py-1 rounded-full bg-white/5 border border-white/10">
              Personal Net Balance
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Group:</span>
              <span className="text-white font-medium">{currentGroup.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 my-2">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight flex items-center gap-3">
                <span className={
                  isPositive 
                    ? 'text-emerald-400' 
                    : isNegative 
                    ? 'text-rose-400' 
                    : 'text-slate-300'
                }>
                  {formatCents(myNetCents, currentGroup.currency)}
                </span>
                {isPositive && <TrendingUp className="w-8 h-8 text-emerald-400 inline" />}
                {isNegative && <TrendingDown className="w-8 h-8 text-rose-400 inline" />}
                {isZero && <CheckCircle2 className="w-8 h-8 text-emerald-400 inline" />}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isPositive && `Overall, other group members owe you a total of ${formatCents(myNetCents, currentGroup.currency)}.`}
                {isNegative && `Overall, you owe other group members a total of ${formatCents(Math.abs(myNetCents), currentGroup.currency)}.`}
                {isZero && 'All your group expenses and debts are completely settled!'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('ledger')}
              className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold flex items-center gap-2 transition-all hover:gap-3"
            >
              <span>View Settlement</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div className="text-xs text-muted-foreground mb-1">Total You Paid</div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {formatCents(myBalanceObj.totalPaid, currentGroup.currency)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div className="text-xs text-muted-foreground mb-1">Your Total Share</div>
              <div className="text-xl font-bold font-mono text-slate-200">
                {formatCents(myBalanceObj.totalOwed, currentGroup.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Group Quick Metrics & Settle Prompt */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">
                Group Spending
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {expenses.length} Expenses
              </span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white mb-2">
              {formatCents(totalGroupSpentCents, currentGroup.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total expenditure across all {groupMembers.length} active group members.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Expense</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Settle Up Debts</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. Group Members Balances Row */}
      <div className="rounded-3xl glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>Group Members</span>
            <span className="text-xs text-muted-foreground font-normal">({groupMembers.length})</span>
          </h3>
          <span className="text-xs text-muted-foreground">Click member to view status</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {groupMembers.map((member) => {
            const bal = netBalances[member.uid]?.netBalance || 0;
            const isMemberPositive = bal > 0;
            const isMemberNegative = bal < 0;

            return (
              <div 
                key={member.uid}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  member.uid === currentUser.uid 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="relative">
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#060e20] ${
                    isMemberPositive 
                      ? 'bg-emerald-500' 
                      : isMemberNegative 
                      ? 'bg-rose-500' 
                      : 'bg-slate-500'
                  }`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate text-white">
                    {member.uid === currentUser.uid ? 'You' : member.displayName}
                  </div>
                  <div className={`text-xs font-mono font-medium truncate ${
                    isMemberPositive 
                      ? 'text-emerald-400' 
                      : isMemberNegative 
                      ? 'text-rose-400' 
                      : 'text-muted-foreground'
                  }`}>
                    {bal === 0 ? 'Settled' : formatCents(bal, currentGroup.currency)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Debt Optimization & Settlement Preview */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Settlement Ledger</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Min Cash Flow
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deterministic greedy bipartite debt minimization engine.
            </p>
          </div>

          {/* Toggle Simplified Debts */}
          <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setIsSimplified(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSimplified 
                  ? 'bg-emerald-500 text-black shadow-md' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Simplified ({simplifiedDebts.length})
            </button>
            <button
              onClick={() => setIsSimplified(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !isSimplified 
                  ? 'bg-emerald-500 text-black shadow-md' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Detailed Raw ({rawDebts.length})
            </button>
          </div>
        </div>

        {/* Debt Flow Items */}
        {(isSimplified ? simplifiedDebts : rawDebts).length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <div className="font-semibold text-white">Zero Balances Outstanding</div>
            <div className="text-xs text-muted-foreground mt-1">
              Everyone is settled up in this group!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isSimplified ? simplifiedDebts : rawDebts).map((debt, idx) => {
              const debtor = users.find(u => u.uid === debt.from);
              const creditor = users.find(u => u.uid === debt.to);
              const isMeDebtor = debt.from === currentUser.uid;
              const isMeCreditor = debt.to === currentUser.uid;

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isMeDebtor 
                      ? 'bg-rose-500/10 border-rose-500/30' 
                      : isMeCreditor 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img
                        src={debtor?.avatarUrl}
                        alt={debtor?.displayName}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#060e20]"
                      />
                      <img
                        src={creditor?.avatarUrl}
                        alt={creditor?.displayName}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#060e20]"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {isMeDebtor ? 'You owe' : `${debtor?.displayName || debt.from} owes`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        to {isMeCreditor ? 'You' : creditor?.displayName || debt.to}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-white">
                      {formatCents(debt.amount, currentGroup.currency)}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Direct
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Recent Expenses Activity Feed */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Categorized expense transactions for this group
            </p>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Expense</span>
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5">
            <p className="text-muted-foreground text-sm">No expenses recorded yet.</p>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const payer = users.find(u => u.uid === expense.payerId);
              const isPayerMe = expense.payerId === currentUser.uid;
              const myShare = expense.splits[currentUser.uid] || 0;

              return (
                <div 
                  key={expense.id}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <CategoryIcon category={expense.category} size="md" />
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {expense.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>Paid by <strong className="text-slate-300 font-medium">{isPayerMe ? 'You' : payer?.displayName}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {expense.date}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {expense.splitType}
                        </span>
                        {expense.originalCurrency && expense.originalCurrency !== currentGroup.currency && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {expense.originalCurrency} FX
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="font-bold font-mono text-base text-white">
                        {formatCents(expense.amount, currentGroup.currency)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {isPayerMe 
                          ? <span className="text-emerald-400">You lent {formatCents(expense.amount - myShare, currentGroup.currency)}</span>
                          : myShare > 0 
                          ? <span className="text-rose-400">Your share: {formatCents(myShare, currentGroup.currency)}</span>
                          : <span className="text-slate-400">Not involved</span>
                        }
                      </div>
                    </div>

                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
