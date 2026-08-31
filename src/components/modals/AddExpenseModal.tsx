import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SplitType, Category, Expense } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { 
  SUPPORTED_CURRENCIES, 
  convertCurrencyToCents, 
  fetchLiveExchangeRates 
} from '../../lib/currency';
import { 
  calculateEqualSplits, 
  calculatePercentageSplits, 
  calculateSharesSplits, 
  formatCents 
} from '../../utils/debtOptimizer';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Check, 
  AlertCircle, 
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

export const AddExpenseModal: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentGroup, 
    addExpense, 
    isAddExpenseOpen, 
    setIsAddExpenseOpen 
  } = useApp();

  const groupCurrency = currentGroup?.currency || 'USD';
  const groupMembers = currentGroup ? users.filter(u => currentGroup.members.includes(u.uid)) : [];

  // Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState(groupCurrency);
  const [payerId, setPayerId] = useState(currentUser.uid);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>('food');
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Split States
  const [selectedEqualMembers, setSelectedEqualMembers] = useState<string[]>(
    currentGroup?.members || []
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  // Validation Error Message
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize Split Defaults when group or splitType changes
  useEffect(() => {
    fetchLiveExchangeRates();
  }, []);

  useEffect(() => {
    if (!currentGroup) return;
    // Default equal distribution
    setSelectedEqualMembers(currentGroup.members);
    
    // Default equal percentages
    const defaultPct = (100 / Math.max(currentGroup.members.length, 1)).toFixed(1);
    const initialPcts: Record<string, string> = {};
    const initialShares: Record<string, string> = {};
    const initialExact: Record<string, string> = {};

    for (const uid of currentGroup.members) {
      initialPcts[uid] = defaultPct;
      initialShares[uid] = '1';
      initialExact[uid] = '0';
    }
    setPercentages(initialPcts);
    setShares(initialShares);
    setExactAmounts(initialExact);
  }, [currentGroup?.id]);

  // Derived calculated amount in Group Currency Cents
  const rawInputAmount = parseFloat(amountStr) || 0;
  const { cents: totalAmountCents, exchangeRate } = convertCurrencyToCents(
    rawInputAmount,
    currency,
    groupCurrency
  );

  // Computed splits dictionary: uid -> cents
  let calculatedSplits: Record<string, number> = {};
  let splitStatusMessage = '';
  let isValid = false;

  if (rawInputAmount > 0) {
    if (splitType === 'EQUAL') {
      if (selectedEqualMembers.length > 0) {
        calculatedSplits = calculateEqualSplits(totalAmountCents, selectedEqualMembers);
        isValid = true;
        splitStatusMessage = `${formatCents(Math.round(totalAmountCents / selectedEqualMembers.length), groupCurrency)} / person`;
      } else {
        isValid = false;
        splitStatusMessage = 'Select at least 1 person';
      }
    } else if (splitType === 'EXACT') {
      let sumCents = 0;
      for (const [uid, val] of Object.entries(exactAmounts)) {
        const pVal = parseFloat(val) || 0;
        const pCents = Math.round(pVal * 100);
        calculatedSplits[uid] = pCents;
        sumCents += pCents;
      }
      const diff = totalAmountCents - sumCents;
      if (diff === 0) {
        isValid = true;
        splitStatusMessage = 'Exact amounts match total!';
      } else {
        isValid = false;
        splitStatusMessage = diff > 0 
          ? `${formatCents(diff, groupCurrency)} left to allocate` 
          : `${formatCents(Math.abs(diff), groupCurrency)} over total`;
      }
    } else if (splitType === 'PERCENTAGE') {
      const numPercentages: Record<string, number> = {};
      let sumPct = 0;
      for (const [uid, val] of Object.entries(percentages)) {
        const p = parseFloat(val) || 0;
        numPercentages[uid] = p;
        sumPct += p;
      }
      const { splits, totalPercent } = calculatePercentageSplits(totalAmountCents, numPercentages);
      calculatedSplits = splits;

      if (Math.abs(totalPercent - 100) < 0.05) {
        isValid = true;
        splitStatusMessage = 'Percentages sum to 100%';
      } else {
        isValid = false;
        splitStatusMessage = `Sum is ${totalPercent.toFixed(1)}% (must equal 100%)`;
      }
    } else if (splitType === 'SHARES') {
      const numShares: Record<string, number> = {};
      let totalS = 0;
      for (const [uid, val] of Object.entries(shares)) {
        const s = parseInt(val, 10) || 0;
        numShares[uid] = s;
        totalS += s;
      }
      const { splits, totalShares } = calculateSharesSplits(totalAmountCents, numShares);
      calculatedSplits = splits;

      if (totalShares > 0) {
        isValid = true;
        splitStatusMessage = `${totalShares} total shares allocated`;
      } else {
        isValid = false;
        splitStatusMessage = 'Enter at least 1 share';
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;
    if (!title.trim()) {
      setValidationError('Please enter an expense description.');
      return;
    }
    if (rawInputAmount <= 0) {
      setValidationError('Please enter a valid expense amount.');
      return;
    }
    if (!isValid) {
      setValidationError(splitStatusMessage || 'Please resolve split balance disparity.');
      return;
    }

    setValidationError(null);

    const expensePayload: Omit<Expense, 'id' | 'createdAt'> = {
      groupId: currentGroup.id,
      title: title.trim(),
      amount: totalAmountCents,
      payerId,
      date,
      category,
      splitType,
      splits: calculatedSplits,
      notes: notes.trim() || undefined,
      originalCurrency: currency !== groupCurrency ? currency : undefined,
      originalAmount: currency !== groupCurrency ? rawInputAmount : undefined,
      exchangeRate: currency !== groupCurrency ? exchangeRate : undefined,
    };

    await addExpense(expensePayload);
    setIsAddExpenseOpen(false);
  };

  const toggleEqualMember = (uid: string) => {
    if (selectedEqualMembers.includes(uid)) {
      setSelectedEqualMembers(selectedEqualMembers.filter(id => id !== uid));
    } else {
      setSelectedEqualMembers([...selectedEqualMembers, uid]);
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 my-8 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Add Expense</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {currentGroup.name}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record payment and specify split distribution
            </p>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* 1. Title & Large Amount Row */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Description / Merchant
              </label>
              <input
                id="input-expense-title"
                type="text"
                required
                placeholder="e.g. Dinner at L'Artiste, Airport Taxi, Airbnb..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white text-sm font-medium transition-all"
              />
            </div>

            {/* Currency & Huge Amount Input */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amount & Currency
                </span>
                {currency !== currentGroup.currency && rawInputAmount > 0 && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    ≈ {formatCents(totalAmountCents, currentGroup.currency)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono text-sm font-bold outline-none cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                    <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <input
                    id="input-expense-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="w-full bg-transparent text-3xl font-extrabold font-mono text-white placeholder-slate-600 outline-none tracking-tight"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Category Selector Chips */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(CATEGORIES).map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    category === cat.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-semibold'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-muted-foreground'
                  }`}
                >
                  <CategoryIcon category={cat.id} size="sm" />
                  <span className="text-xs truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Payer & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Paid By
              </label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-sm font-medium outline-none cursor-pointer"
              >
                {groupMembers.map(member => (
                  <option key={member.uid} value={member.uid} className="bg-slate-900 text-white">
                    {member.uid === currentUser.uid ? 'You (Alex)' : member.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-sm font-mono outline-none"
              />
            </div>
          </div>

          {/* 4. Split Type Tabs & Live Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Split Distribution
              </label>
              <span className={`text-xs font-mono font-medium ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {splitStatusMessage}
              </span>
            </div>

            {/* Split Type Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 mb-4">
              {(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'] as SplitType[]).map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSplitType(type)}
                  className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    splitType === type
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Tab 1: Equal Split Checkboxes */}
            {splitType === 'EQUAL' && (
              <div className="space-y-2 p-3 rounded-2xl bg-black/20 border border-white/5 max-h-48 overflow-y-auto">
                {groupMembers.map(member => {
                  const isChecked = selectedEqualMembers.includes(member.uid);
                  const share = calculatedSplits[member.uid] || 0;

                  return (
                    <div
                      key={member.uid}
                      onClick={() => toggleEqualMember(member.uid)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/5 border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                          isChecked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                        <span className="text-xs font-medium text-white">
                          {member.uid === currentUser.uid ? 'You' : member.displayName}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        {isChecked ? formatCents(share, currentGroup.currency) : 'Excluded'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Exact Amounts */}
            {splitType === 'EXACT' && (
              <div className="space-y-2 p-3 rounded-2xl bg-black/20 border border-white/5 max-h-48 overflow-y-auto">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                      <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-medium text-white truncate max-w-[120px]">
                        {member.uid === currentUser.uid ? 'You' : member.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">{currentGroup.currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={exactAmounts[member.uid] || ''}
                        onChange={e => setExactAmounts({ ...exactAmounts, [member.uid]: e.target.value })}
                        className="w-24 px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-right text-xs font-mono text-white outline-none focus:border-emerald-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Percentages */}
            {splitType === 'PERCENTAGE' && (
              <div className="space-y-2 p-3 rounded-2xl bg-black/20 border border-white/5 max-h-48 overflow-y-auto">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                      <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-medium text-white truncate max-w-[120px]">
                        {member.uid === currentUser.uid ? 'You' : member.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-emerald-400">
                        {formatCents(calculatedSplits[member.uid] || 0, currentGroup.currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={percentages[member.uid] || ''}
                          onChange={e => setPercentages({ ...percentages, [member.uid]: e.target.value })}
                          className="w-16 px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-right text-xs font-mono text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs font-mono text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Shares (Ratio) */}
            {splitType === 'SHARES' && (
              <div className="space-y-2 p-3 rounded-2xl bg-black/20 border border-white/5 max-h-48 overflow-y-auto">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                      <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-medium text-white truncate max-w-[120px]">
                        {member.uid === currentUser.uid ? 'You' : member.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-emerald-400">
                        {formatCents(calculatedSplits[member.uid] || 0, currentGroup.currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={shares[member.uid] || ''}
                          onChange={e => setShares({ ...shares, [member.uid]: e.target.value })}
                          className="w-16 px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-right text-xs font-mono text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs font-mono text-muted-foreground">share</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-muted-foreground hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-save-expense"
              type="submit"
              disabled={!isValid || rawInputAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
            >
              Save Expense
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
