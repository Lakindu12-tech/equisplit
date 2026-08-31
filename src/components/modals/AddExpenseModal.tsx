import React, { useState, useEffect, useRef } from 'react';
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
import { compressImage } from '../../utils/imageCompressor';
import { DataStore } from '../../services/store';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Check, 
  AlertCircle, 
  Sparkles,
  ArrowRightLeft,
  Users,
  User,
  Camera,
  Image as ImageIcon,
  Trash2,
  UploadCloud
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

  const groupCurrency = currentGroup?.currency || 'LKR';
  const groupMembers = currentGroup ? users.filter(u => currentGroup.members.includes(u.uid)) : [];

  // Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState(groupCurrency);
  const [payerMode, setPayerMode] = useState<'single' | 'multi'>('single');
  const [payerId, setPayerId] = useState(currentUser?.uid || '');
  const [multiPayerAmounts, setMultiPayerAmounts] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>('food');
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Receipt state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Split States
  const [selectedEqualMembers, setSelectedEqualMembers] = useState<string[]>(
    currentGroup?.members || []
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  // Validation Error Message
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLiveExchangeRates();
  }, []);

  useEffect(() => {
    if (!currentGroup || !currentUser) return;
    setPayerId(currentUser.uid);
    setCurrency(currentGroup.currency);
    setSelectedEqualMembers(currentGroup.members);
    
    // Default equal percentages & shares
    const defaultPct = (100 / Math.max(currentGroup.members.length, 1)).toFixed(1);
    const initialPcts: Record<string, string> = {};
    const initialShares: Record<string, string> = {};
    const initialExact: Record<string, string> = {};
    const initialMultiPayers: Record<string, string> = {};

    for (const uid of currentGroup.members) {
      initialPcts[uid] = defaultPct;
      initialShares[uid] = '1';
      initialExact[uid] = '0';
      initialMultiPayers[uid] = uid === currentUser.uid ? '' : '0';
    }
    setPercentages(initialPcts);
    setShares(initialShares);
    setExactAmounts(initialExact);
    setMultiPayerAmounts(initialMultiPayers);
  }, [currentGroup?.id, isAddExpenseOpen, currentUser?.uid]);

  // Derived calculated amount in Group Currency Cents
  const rawInputAmount = parseFloat(amountStr) || 0;
  const { cents: totalAmountCents, exchangeRate } = convertCurrencyToCents(
    rawInputAmount,
    currency,
    groupCurrency
  );

  // Multi-Payer Calculation & Exact Sum Invariant Check
  let computedPaidBy: Record<string, number> = {};
  let totalPaidCents = 0;
  let isPayerValid = true;
  let payerStatusMessage = '';

  if (payerMode === 'single') {
    computedPaidBy = { [payerId || currentUser?.uid || '']: totalAmountCents };
    totalPaidCents = totalAmountCents;
  } else {
    for (const [uid, valStr] of Object.entries(multiPayerAmounts)) {
      const val = parseFloat(valStr) || 0;
      const c = Math.round(val * 100);
      if (c > 0) {
        computedPaidBy[uid] = c;
        totalPaidCents += c;
      }
    }
    const payerDiff = totalAmountCents - totalPaidCents;
    if (payerDiff === 0 && totalPaidCents > 0) {
      isPayerValid = true;
      payerStatusMessage = 'Multi-payer total matches bill!';
    } else {
      isPayerValid = false;
      payerStatusMessage = payerDiff > 0 
        ? `${formatCents(payerDiff, groupCurrency)} left to assign to payers` 
        : `${formatCents(Math.abs(payerDiff), groupCurrency)} over total bill`;
    }
  }

  // Computed splits dictionary: uid -> cents
  let calculatedSplits: Record<string, number> = {};
  let splitStatusMessage = '';
  let isSplitValid = false;

  if (rawInputAmount > 0) {
    if (splitType === 'EQUAL') {
      if (selectedEqualMembers.length > 0) {
        calculatedSplits = calculateEqualSplits(totalAmountCents, selectedEqualMembers);
        isSplitValid = true;
        splitStatusMessage = `${formatCents(Math.round(totalAmountCents / selectedEqualMembers.length), groupCurrency)} / person`;
      } else {
        isSplitValid = false;
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
        isSplitValid = true;
        splitStatusMessage = 'Exact amounts match total!';
      } else {
        isSplitValid = false;
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
        isSplitValid = true;
        splitStatusMessage = 'Percentages sum to 100%';
      } else {
        isSplitValid = false;
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
        isSplitValid = true;
        splitStatusMessage = `Divided into ${totalShares} total shares`;
      } else {
        isSplitValid = false;
        splitStatusMessage = 'Enter at least 1 share';
      }
    }
  }

  // Handle Receipt Selection & Compression
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 1200, 0.75);
      setReceiptBlob(blob);
      setReceiptPreview(dataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptBlob(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddExpenseOpen || !currentGroup || !currentUser) return;

    if (!title.trim()) {
      setValidationError('Please enter an expense description.');
      return;
    }
    if (rawInputAmount <= 0) {
      setValidationError('Please enter a valid expense amount.');
      return;
    }
    if (!isPayerValid) {
      setValidationError(payerStatusMessage || 'Multi-payer payments must equal total amount.');
      return;
    }
    if (!isSplitValid) {
      setValidationError(splitStatusMessage || 'Please resolve split balance disparity.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const expenseId = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      let uploadedReceiptUrl: string | null = null;

      if (receiptBlob) {
        uploadedReceiptUrl = await DataStore.getInstance().uploadReceiptImage(
          currentGroup.id,
          expenseId,
          receiptBlob
        );
      }

      const expensePayload: Omit<Expense, 'id' | 'createdAt'> = {
        groupId: currentGroup.id,
        title: title.trim(),
        amount: totalAmountCents,
        payerId: payerMode === 'single' ? payerId : Object.keys(computedPaidBy)[0] || currentUser.uid,
        paidBy: computedPaidBy,
        date,
        category,
        splitType,
        splits: calculatedSplits,
        receiptUrl: uploadedReceiptUrl,
        notes: notes.trim() || undefined,
        originalCurrency: currency !== groupCurrency ? currency : undefined,
        originalAmount: currency !== groupCurrency ? rawInputAmount : undefined,
        exchangeRate: currency !== groupCurrency ? exchangeRate : undefined,
      };

      await addExpense(expensePayload);
      setIsAddExpenseOpen(false);
      setTitle('');
      setAmountStr('');
      setReceiptBlob(null);
      setReceiptPreview(null);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEqualMember = (uid: string) => {
    if (selectedEqualMembers.includes(uid)) {
      setSelectedEqualMembers(selectedEqualMembers.filter(id => id !== uid));
    } else {
      setSelectedEqualMembers([...selectedEqualMembers, uid]);
    }
  };

  if (!isAddExpenseOpen || !currentGroup || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl glass-3d-volumetric border border-white/15 p-6 sm:p-8 my-8 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Add Expense</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {groupCurrency}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Group: <span className="text-slate-200 font-medium">{currentGroup.name}</span>
            </p>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* 1. Title & Amount Row */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Title
              </label>
              <input
                id="input-expense-title"
                type="text"
                required
                placeholder="e.g. Seafood Dinner at Mirissa, Airport Van, Villa Stay..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-emerald-500 outline-none text-white text-sm font-medium transition-all"
              />
            </div>

            {/* Currency & Amount Input */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none text-white font-mono text-2xl font-bold tracking-tight transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payer Section: Single Payer vs Multi-Payer */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Who Paid?</span>
              </span>

              <div className="flex p-0.5 rounded-xl bg-black/50 border border-white/10 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPayerMode('single')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    payerMode === 'single'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Payer
                </button>
                <button
                  id="btn-tab-multi-payer"
                  type="button"
                  onClick={() => setPayerMode('multi')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    payerMode === 'multi'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Payer (Split Paid)
                </button>
              </div>
            </div>

            {payerMode === 'single' ? (
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none text-white text-xs font-medium cursor-pointer"
              >
                {groupMembers.map(member => (
                  <option key={member.uid} value={member.uid} className="bg-slate-900 text-white">
                    {member.displayName} {member.uid === currentUser.uid ? '(You)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] text-slate-400">
                  Enter exact amounts paid by each contributor:
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {groupMembers.map(member => (
                    <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-white truncate max-w-[140px]">
                        {member.displayName} {member.uid === currentUser.uid ? '(You)' : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">{groupCurrency}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-payer-uid={member.uid}
                          value={multiPayerAmounts[member.uid] || ''}
                          onChange={e => setMultiPayerAmounts({
                            ...multiPayerAmounts,
                            [member.uid]: e.target.value
                          })}
                          className="multi-payer-input w-24 px-2 py-1 bg-black/50 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white text-right outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`text-xs font-mono px-2.5 py-1.5 rounded-xl border flex items-center justify-between ${
                  isPayerValid 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <span>Paid: {formatCents(totalPaidCents, groupCurrency)} / {formatCents(totalAmountCents, groupCurrency)}</span>
                  <span>{payerStatusMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {Object.values(CATEGORIES).map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10 scale-105'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <CategoryIcon category={cat.id} size="sm" />
                    <span className="text-[10px] font-medium mt-1 truncate w-full text-center">
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Split Type Selector & Config */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Split Type
              </label>
              {rawInputAmount > 0 && (
                <span className={`text-xs font-mono font-medium ${isSplitValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {splitStatusMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
              {(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'] as SplitType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    splitType === type
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Split Type Configuration UI */}
            {splitType === 'EQUAL' && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 block">Select participants sharing this cost:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {groupMembers.map(member => {
                    const isSelected = selectedEqualMembers.includes(member.uid);
                    return (
                      <button
                        key={member.uid}
                        type="button"
                        onClick={() => toggleEqualMember(member.uid)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-400/50 text-white font-medium'
                            : 'bg-white/5 border-white/10 text-slate-500 opacity-60'
                        }`}
                      >
                        <span className="truncate">{member.displayName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {splitType === 'EXACT' && (
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-white truncate max-w-[150px]">{member.displayName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{groupCurrency}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={exactAmounts[member.uid] || ''}
                        onChange={e => setExactAmounts({ ...exactAmounts, [member.uid]: e.target.value })}
                        className="w-24 px-2 py-1 bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white text-right outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {splitType === 'PERCENTAGE' && (
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-white truncate max-w-[150px]">{member.displayName}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={percentages[member.uid] || ''}
                        onChange={e => setPercentages({ ...percentages, [member.uid]: e.target.value })}
                        className="w-20 px-2 py-1 bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white text-right outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {splitType === 'SHARES' && (
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-white truncate max-w-[150px]">{member.displayName}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="1"
                        value={shares[member.uid] || ''}
                        onChange={e => setShares({ ...shares, [member.uid]: e.target.value })}
                        className="w-20 px-2 py-1 bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white text-right outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono">share(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Receipt Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Receipt Photo (Optional)</span>
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptFileChange}
                className="hidden"
                id="receipt-file-input"
              />

              {!receiptPreview ? (
                <label
                  htmlFor="receipt-file-input"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 border border-white/10 cursor-pointer transition-all active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isCompressing ? 'Compressing...' : 'Upload Image'}</span>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs flex items-center gap-1 border border-rose-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {receiptPreview && (
              <div className="relative rounded-xl overflow-hidden border border-white/15 max-h-32 bg-black/60 flex items-center justify-center">
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  className="max-h-32 w-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* 6. Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 outline-none text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes or context..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 outline-none text-white text-xs"
              />
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-save-expense"
              type="submit"
              disabled={!isSplitValid || !isPayerValid || rawInputAmount <= 0 || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? 'Saving...' : 'Save & Split Expense'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
