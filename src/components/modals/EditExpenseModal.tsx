import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Category, Expense } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { formatCents, normalizePaidBy } from '../../utils/debtOptimizer';
import { compressImage } from '../../utils/imageCompressor';
import { DataStore } from '../../services/store';
import { CategoryIcon } from '../common/CategoryIcon';
import { 
  X, 
  Edit, 
  Calendar, 
  DollarSign, 
  Check, 
  AlertCircle, 
  Users, 
  Camera, 
  Trash2, 
  UploadCloud 
} from 'lucide-react';

export const EditExpenseModal: React.FC = () => {
  const { 
    editingExpense, 
    setEditingExpense, 
    updateExpense, 
    currentGroup, 
    users 
  } = useApp();

  const groupCurrency = currentGroup?.currency || 'LKR';
  const groupMembers = currentGroup ? users.filter(u => currentGroup.members.includes(u.uid)) : [];

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [payerMode, setPayerMode] = useState<'single' | 'multi'>('single');
  const [payerId, setPayerId] = useState('');
  const [multiPayerAmounts, setMultiPayerAmounts] = useState<Record<string, string>>({});
  
  // Receipt
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmountStr((editingExpense.amount / 100).toFixed(2));
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNotes(editingExpense.notes || '');
      setReceiptPreview(editingExpense.receiptUrl || null);
      setReceiptBlob(null);

      const normalizedPaid = normalizePaidBy(editingExpense);
      const isMulti = Object.keys(normalizedPaid).length > 1;
      setPayerMode(isMulti ? 'multi' : 'single');
      setPayerId(editingExpense.payerId || Object.keys(normalizedPaid)[0] || '');

      const initialMulti: Record<string, string> = {};
      for (const member of groupMembers) {
        initialMulti[member.uid] = normalizedPaid[member.uid] 
          ? (normalizedPaid[member.uid] / 100).toFixed(2) 
          : '0';
      }
      setMultiPayerAmounts(initialMulti);
      setError(null);
    }
  }, [editingExpense]);

  if (!editingExpense || !currentGroup) return null;

  const rawInputAmount = parseFloat(amountStr) || 0;
  const amountCents = Math.round(rawInputAmount * 100);

  // Multi-Payer Validation
  let computedPaidBy: Record<string, number> = {};
  let totalPaidCents = 0;
  let isPayerValid = true;

  if (payerMode === 'single') {
    computedPaidBy = { [payerId]: amountCents };
    totalPaidCents = amountCents;
  } else {
    for (const [uid, valStr] of Object.entries(multiPayerAmounts)) {
      const val = parseFloat(valStr) || 0;
      const c = Math.round(val * 100);
      if (c > 0) {
        computedPaidBy[uid] = c;
        totalPaidCents += c;
      }
    }
    isPayerValid = totalPaidCents === amountCents && totalPaidCents > 0;
  }

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rawInputAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!isPayerValid) {
      setError('Multi-payer allocations must equal total amount exactly.');
      return;
    }

    setIsLoading(true);

    try {
      let uploadedReceiptUrl = receiptPreview;
      if (receiptBlob) {
        uploadedReceiptUrl = await DataStore.getInstance().uploadReceiptImage(
          currentGroup.id,
          editingExpense.id,
          receiptBlob
        );
      }

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
        payerId: payerMode === 'single' ? payerId : Object.keys(computedPaidBy)[0] || payerId,
        paidBy: computedPaidBy,
        category,
        date,
        receiptUrl: uploadedReceiptUrl,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full max-w-lg glass-3d-volumetric rounded-3xl p-6 border border-white/15 text-[#dae2fd] shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30">
              <Edit className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Expense</h2>
              <p className="text-xs text-slate-400">Update multi-payer details & receipts</p>
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

          {/* Payer Configuration */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payer Configuration</span>
              </span>

              <div className="flex p-0.5 rounded-lg bg-black/50 border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPayerMode('single')}
                  className={`px-2.5 py-0.5 rounded-md ${
                    payerMode === 'single' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setPayerMode('multi')}
                  className={`px-2.5 py-0.5 rounded-md ${
                    payerMode === 'multi' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400'
                  }`}
                >
                  Multi-Payer
                </button>
              </div>
            </div>

            {payerMode === 'single' ? (
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
              >
                {groupMembers.map(m => (
                  <option key={m.uid} value={m.uid} className="bg-slate-900">
                    {m.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {groupMembers.map(m => (
                  <div key={m.uid} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-white truncate max-w-[140px]">{m.displayName}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={multiPayerAmounts[m.uid] || ''}
                      onChange={e => setMultiPayerAmounts({
                        ...multiPayerAmounts,
                        [m.uid]: e.target.value
                      })}
                      className="w-24 px-2 py-1 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white text-right"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
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

          {/* Receipt Attachment */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Receipt Photo</span>
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptFileChange}
                className="hidden"
                id="edit-receipt-file"
              />

              {!receiptPreview ? (
                <label
                  htmlFor="edit-receipt-file"
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-emerald-400 flex items-center gap-1 border border-white/10 cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>{isCompressing ? 'Compressing...' : 'Upload'}</span>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {receiptPreview && (
              <div className="rounded-xl overflow-hidden border border-white/10 max-h-28 bg-black/50 flex items-center justify-center p-1">
                <img
                  src={receiptPreview}
                  alt="Receipt"
                  className="max-h-28 object-contain rounded-lg"
                />
              </div>
            )}
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
              disabled={isLoading || !isPayerValid}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-40"
            >
              {isLoading ? 'Saving...' : 'Save & Log Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
