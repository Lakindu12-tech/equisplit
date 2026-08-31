import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { User, ReceiptItem, ItemizedReceipt } from '../../types';
import { parseReceiptWithOCR } from '../../utils/ocrParser';
import { calculateProportionalReceiptSplits, ProportionalSplitResult } from '../../utils/receiptMath';
import { formatCents } from '../../utils/debtOptimizer';
import { compressImage } from '../../utils/imageCompressor';
import { 
  Scan, 
  X, 
  Sparkles, 
  UploadCloud, 
  Check, 
  Users, 
  Plus, 
  Percent, 
  DollarSign, 
  AlertCircle,
  Receipt,
  ArrowRight
} from 'lucide-react';

interface ItemizedReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySplits: (result: {
    totalCents: number;
    splits: Record<string, number>;
    itemsDescription: string;
    receiptBlob: Blob | null;
    receiptPreview: string | null;
  }) => void;
}

export const ItemizedReceiptModal: React.FC<ItemizedReceiptModalProps> = ({
  isOpen,
  onClose,
  onApplySplits,
}) => {
  const { currentGroup, users, currentUser } = useApp();

  const groupCurrency = currentGroup?.currency || 'LKR';
  const groupMembers = currentGroup ? users.filter(u => currentGroup.members.includes(u.uid)) : [];

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ status: '', progress: 0 });

  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [taxStr, setTaxStr] = useState('0');
  const [tipStr, setTipStr] = useState('0');
  const [selectedMemberForClaim, setSelectedMemberForClaim] = useState<string>(currentUser?.uid || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentGroup) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 1500, 0.85);
      setReceiptBlob(blob);
      setReceiptImage(dataUrl);

      // Run OCR with strict worker termination in parser
      const parsedReceipt = await parseReceiptWithOCR(blob, (p) => setScanProgress(p));
      
      // If OCR yielded items, set them; otherwise create sample template
      if (parsedReceipt.items.length > 0) {
        setItems(parsedReceipt.items);
        setTaxStr((parsedReceipt.taxCents / 100).toFixed(2));
        setTipStr((parsedReceipt.tipCents / 100).toFixed(2));
      } else {
        // Fallback sample items so user can edit manually
        setItems([
          { id: 'item-1', name: 'Main Course Dish', priceCents: 250000, claimedBy: [currentUser?.uid || ''] },
          { id: 'item-2', name: 'Beverage / Drink', priceCents: 85000, claimedBy: [] }
        ]);
      }
    } catch (err: any) {
      console.error('OCR Scanning failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const taxCents = Math.round((parseFloat(taxStr) || 0) * 100);
  const tipCents = Math.round((parseFloat(tipStr) || 0) * 100);

  // Compute live proportional splits
  const splitResult: ProportionalSplitResult = calculateProportionalReceiptSplits(
    items,
    taxCents,
    tipCents,
    groupMembers.map(m => m.uid)
  );

  // Toggle Member Claim on an item
  const toggleItemClaim = (itemId: string, memberUid: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.claimedBy.includes(memberUid);
      const updatedClaims = exists
        ? item.claimedBy.filter(id => id !== memberUid)
        : [...item.claimedBy, memberUid];
      return { ...item, claimedBy: updatedClaims };
    }));
  };

  const handleAddItemManual = () => {
    const newItem: ReceiptItem = {
      id: 'item-custom-' + Date.now(),
      name: 'New Receipt Item',
      priceCents: 100000,
      claimedBy: selectedMemberForClaim ? [selectedMemberForClaim] : []
    };
    setItems([...items, newItem]);
  };

  const handleApply = () => {
    const claimedSummary = items
      .filter(it => it.claimedBy.length > 0)
      .map(it => it.name)
      .slice(0, 3)
      .join(', ');

    const description = claimedSummary ? `Itemized: ${claimedSummary}` : 'Itemized Receipt Split';

    onApplySplits({
      totalCents: splitResult.totalCents,
      splits: splitResult.splits,
      itemsDescription: description,
      receiptBlob,
      receiptPreview: receiptImage
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-3xl glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15 text-[#dae2fd] shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Interactive OCR Receipt Claiming</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Tab / Spliteroo
                </span>
              </h2>
              <p className="text-xs text-slate-400">Tap items to claim, with mathematically exact proportional tax & tip</p>
            </div>
          </div>
          <button
            id="btn-close-itemize-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & Scanner Status */}
        {!receiptImage && !isScanning && (
          <div className="my-8 py-12 border-2 border-dashed border-white/15 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Upload Receipt Photo</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Our dynamic client-side OCR engine will instantly detect every item, price, subtotal, and tax line.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="ocr-upload-input"
            />
            <label
              htmlFor="ocr-upload-input"
              className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
            >
              <Scan className="w-4 h-4" />
              <span>Select Receipt Image</span>
            </label>
          </div>
        )}

        {isScanning && (
          <div className="my-12 py-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-spin mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Analyzing Receipt Text...</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
              {scanProgress.status || 'Scanning pixels'} ({Math.round(scanProgress.progress * 100)}%)
            </p>
            <div className="w-64 h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.round(scanProgress.progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {receiptImage && !isScanning && (
          <div className="mt-6 space-y-6 flex-1">
            
            {/* Active Claimer Selector */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Tap items to claim as:</span>
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {groupMembers.map(m => {
                  const isSelected = selectedMemberForClaim === m.uid;
                  return (
                    <button
                      key={m.uid}
                      type="button"
                      onClick={() => setSelectedMemberForClaim(m.uid)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-black shadow-md font-bold scale-105'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <img src={m.avatarUrl} alt={m.displayName} className="w-4 h-4 rounded-full" />
                      <span className="truncate max-w-[100px]">{m.displayName.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Line Items Grid */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isClaimedByActive = item.claimedBy.includes(selectedMemberForClaim);
                const claimerCount = item.claimedBy.length;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      claimerCount > 0
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Item Name & Editable Price */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(items.map(it => it.id === item.id ? { ...it, name: val } : it));
                        }}
                        className="w-full bg-transparent font-semibold text-sm text-white outline-none border-b border-transparent focus:border-emerald-400"
                      />
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                        {formatCents(item.priceCents, groupCurrency)}
                        {claimerCount > 1 && (
                          <span className="text-[10px] font-normal text-slate-400 ml-1.5">
                            ({formatCents(Math.round(item.priceCents / claimerCount), groupCurrency)}/person)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Claim Badges & Tap to Claim Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Avatar Badges of claimers */}
                      <div className="flex -space-x-1.5">
                        {item.claimedBy.map(cId => {
                          const u = users.find(user => user.uid === cId);
                          return (
                            <img
                              key={cId}
                              src={u?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cId}`}
                              alt={u?.displayName || 'User'}
                              title={u?.displayName}
                              className="w-6 h-6 rounded-full border border-emerald-400 shadow-sm object-cover"
                            />
                          );
                        })}
                      </div>

                      {/* Claim Toggle Button for Selected Member */}
                      <button
                        type="button"
                        onClick={() => toggleItemClaim(item.id, selectedMemberForClaim)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isClaimedByActive
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isClaimedByActive ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isClaimedByActive ? 'Claimed' : 'Claim'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItemManual}
                className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Missing Item Manually</span>
              </button>
            </div>

            {/* Tax & Tip Proportion Adjusters */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Items Subtotal</span>
                <span className="text-sm font-bold font-mono text-white">
                  {formatCents(splitResult.subtotalCents, groupCurrency)}
                </span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Tax ({groupCurrency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxStr}
                  onChange={e => setTaxStr(e.target.value)}
                  className="w-full px-2.5 py-1 bg-black/50 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Tip / Svc ({groupCurrency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={tipStr}
                  onChange={e => setTipStr(e.target.value)}
                  className="w-full px-2.5 py-1 bg-black/50 border border-white/10 focus:border-emerald-400 rounded-lg text-xs font-mono text-white"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">Grand Total</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  {formatCents(splitResult.totalCents, groupCurrency)}
                </span>
              </div>
            </div>

            {/* Live Member Breakdown Pill */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <span className="text-xs font-bold text-emerald-300 block">
                Proportional Breakdown (Exact Cent Allocations):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {groupMembers.map(m => {
                  const share = splitResult.splits[m.uid] || 0;
                  return (
                    <div key={m.uid} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                      <span className="truncate text-slate-300">{m.displayName.split(' ')[0]}</span>
                      <span className="font-mono font-bold text-white">{formatCents(share, groupCurrency)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          {receiptImage && (
            <button
              id="btn-apply-itemized-splits"
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <span>Apply Splits to Expense</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
