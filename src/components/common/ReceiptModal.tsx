import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, Receipt } from 'lucide-react';

interface ReceiptModalProps {
  receiptUrl: string | null;
  title: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptUrl,
  title,
  onClose,
}) => {
  if (!receiptUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-2xl glass-3d-volumetric rounded-3xl p-6 border border-white/20 text-white shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold truncate max-w-md">{title}</h3>
              <span className="text-xs text-slate-400">Receipt Attachment</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              download={`${title.replace(/\s+/g, '_')}_Receipt.jpg`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
              title="Download Receipt"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="mt-4 flex-1 overflow-auto rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-2">
          <img
            src={receiptUrl}
            alt={`Receipt for ${title}`}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>
      </motion.div>
    </div>
  );
};
