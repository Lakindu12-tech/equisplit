import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { BankTransaction, Expense } from '../../types';
import { parseBankStatementCSV } from '../../utils/csvBankParser';
import { formatCents, calculateEqualSplits } from '../../utils/debtOptimizer';
import { CategoryIcon } from '../common/CategoryIcon';
import { SpatialCard } from '../common/SpatialCard';
import { 
  Building2, 
  X, 
  Check, 
  UploadCloud, 
  Sparkles, 
  Trash2, 
  ArrowRight,
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface BankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankImportModal: React.FC<BankImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentGroup, currentUser, users, addExpense } = useApp();
  const groupCurrency = currentGroup?.currency || 'LKR';

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvedList, setApprovedList] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentGroup || !currentUser) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const groupMembers = users.filter(u => currentGroup.members.includes(u.uid));
      const parsed = await parseBankStatementCSV(file, groupMembers, currentUser.uid);
      if (parsed.length === 0) {
        setError('No valid transactions found in CSV. Please verify column headers (Date, Description, Amount).');
      } else {
        setTransactions(parsed);
        setCurrentIndex(0);
        setApprovedList([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV statement');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    if (currentIndex < transactions.length) {
      setApprovedList([...approvedList, transactions[currentIndex]]);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDiscard = () => {
    if (currentIndex < transactions.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleCommitAll = async () => {
    if (approvedList.length === 0 || !currentGroup || !currentUser) return;

    setIsImporting(true);
    try {
      for (const txn of approvedList) {
        const splits = calculateEqualSplits(txn.amountCents, currentGroup.members);
        await addExpense({
          groupId: currentGroup.id,
          title: txn.description,
          amount: txn.amountCents,
          payerId: currentUser.uid,
          paidBy: { [currentUser.uid]: txn.amountCents },
          date: txn.date,
          category: txn.category,
          splitType: 'EQUAL',
          splits,
          notes: `Imported from Bank Statement: "${txn.rawText}"`
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to batch save transactions');
    } finally {
      setIsImporting(false);
    }
  };

  const currentTxn = transactions[currentIndex];
  const isFinished = transactions.length > 0 && currentIndex >= transactions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-xl glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15 text-[#dae2fd] shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Batch Bank Statement Importer</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GoodShare
                </span>
              </h2>
              <p className="text-xs text-slate-400">Tinder-style quick swipe review of bank transactions</p>
            </div>
          </div>
          <button
            id="btn-close-bank-import"
            onClick={onClose}
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

        {/* Upload State */}
        {transactions.length === 0 && !isProcessing && (
          <div className="my-8 py-12 border-2 border-dashed border-white/15 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Upload Bank Statement (CSV)</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports HNB, Commercial Bank, Sampath, Chase, and Revolut CSV exports.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="bank-csv-input"
            />
            <label
              htmlFor="bank-csv-input"
              className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Select CSV File</span>
            </label>
          </div>
        )}

        {/* Tinder-style Card Stack */}
        {transactions.length > 0 && !isFinished && currentTxn && (
          <div className="my-6 flex-1 flex flex-col items-center justify-center">
            {/* Progress Badge */}
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
              <span>Reviewing Transaction {currentIndex + 1} of {transactions.length}</span>
              <span className="font-mono text-emerald-400 font-bold">{approvedList.length} Approved</span>
            </div>

            {/* Active Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTxn.id}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 80 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full p-6 rounded-3xl glass-3d-volumetric border border-emerald-500/30 bg-black/40 shadow-2xl relative text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CategoryIcon category={currentTxn.category} size="md" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {currentTxn.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 truncate">{currentTxn.description}</h3>
                  <span className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {currentTxn.date}
                  </span>
                </div>

                <div className="text-3xl font-extrabold font-mono text-emerald-400">
                  {formatCents(currentTxn.amountCents, groupCurrency)}
                </div>

                <p className="text-[11px] text-slate-400 truncate max-w-sm mx-auto">
                  Raw: "{currentTxn.rawText}"
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons (Discard / Approve) */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                type="button"
                onClick={handleDiscard}
                className="w-14 h-14 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg transition-all active:scale-95"
                title="Discard Transaction"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
                title="Approve & Include"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* Finished / Approved Summary State */}
        {isFinished && (
          <div className="my-6 space-y-4 flex-1">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
              <h3 className="text-base font-bold text-white">Review Complete!</h3>
              <p className="text-xs text-emerald-300 mt-0.5">
                You approved <strong>{approvedList.length}</strong> transactions out of {transactions.length}.
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {approvedList.map(item => (
                <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
                  <div className="truncate min-w-0 pr-2">
                    <span className="font-semibold text-white block truncate">{item.description}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date} • {item.category}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {formatCents(item.amountCents, groupCurrency)}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={approvedList.length === 0 || isImporting}
              onClick={handleCommitAll}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isImporting ? 'Importing to Group...' : `Commit ${approvedList.length} Expenses to Group`}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
