import React, { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useApp } from '../../context/AppContext';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Users,
  Sparkles 
} from 'lucide-react';

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupInviteModal: React.FC<GroupInviteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentGroup } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentGroup) return null;

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?joinGroup=${currentGroup.id}`
    : `https://new-project-f9748.web.app/?joinGroup=${currentGroup.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Join our expense group "${currentGroup.name}" on EquiSplit to track and split our bills:\n${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${currentGroup.name} on EquiSplit`,
          text: `Join our expense group "${currentGroup.name}" on EquiSplit:`,
          url: inviteUrl,
        });
      } catch (err) {
        console.warn('Share cancelled:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-md glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15 text-[#dae2fd] shadow-2xl relative my-8 text-center"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Zero-Friction QR Invite</h3>
              <p className="text-xs text-slate-400">Instant join for {currentGroup.name}</p>
            </div>
          </div>
          <button
            id="btn-close-invite-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-6 p-4 rounded-3xl bg-white p-4 inline-block shadow-2xl border-4 border-emerald-500/30">
          <QRCode
            value={inviteUrl}
            size={180}
            viewBox="0 0 180 180"
            className="w-full h-auto max-w-[180px]"
          />
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Scan with any mobile camera or share the link. Anyone with this link automatically joins as a companion!
        </p>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 mb-4">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="w-full bg-transparent px-3 text-xs text-slate-300 outline-none font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 shrink-0 transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* WhatsApp & Native Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
