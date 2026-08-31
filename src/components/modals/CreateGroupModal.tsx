import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { Users, X, Check, Plus, AlertCircle, Sparkles, UserPlus } from 'lucide-react';

export const CreateGroupModal: React.FC = () => {
  const { 
    currentUser, 
    users, 
    createGroup, 
    isCreateGroupOpen, 
    setIsCreateGroupOpen 
  } = useApp();

  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isCreateGroupOpen || !currentUser) return null;

  const currentSelected = Array.from(new Set([currentUser.uid, ...selectedMembers]));

  const toggleMember = (uid: string) => {
    if (uid === currentUser.uid) return; // Cannot unselect yourself
    if (selectedMembers.includes(uid)) {
      setSelectedMembers(selectedMembers.filter(id => id !== uid));
    } else {
      setSelectedMembers([...selectedMembers, uid]);
    }
  };

  const handleAddCustomMember = () => {
    if (!memberName.trim()) return;
    const existing = users.find(u => 
      u.displayName.toLowerCase() === memberName.trim().toLowerCase() ||
      u.email.toLowerCase() === memberName.trim().toLowerCase()
    );

    if (existing) {
      if (!selectedMembers.includes(existing.uid)) {
        setSelectedMembers([...selectedMembers, existing.uid]);
      }
    } else {
      const customUid = 'user-' + Math.random().toString(36).substring(2, 7);
      setSelectedMembers([...selectedMembers, customUid]);
    }
    setMemberName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    }

    // Ensure at least 2 members; if only 1, add a companion member
    let finalMembers = currentSelected;
    if (finalMembers.length < 2) {
      const otherUser = users.find(u => u.uid !== currentUser.uid);
      if (otherUser) {
        finalMembers = [currentUser.uid, otherUser.uid];
      } else {
        const guestUid = 'user-companion-' + Math.random().toString(36).substring(2, 6);
        finalMembers = [currentUser.uid, guestUid];
      }
    }

    setError(null);
    setIsLoading(true);
    try {
      await createGroup({
        name: groupName.trim(),
        currency,
        members: finalMembers,
      });

      setIsCreateGroupOpen(false);
      setGroupName('');
      setSelectedMembers([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-lg glass-3d-volumetric rounded-3xl p-6 sm:p-8 border border-white/15 text-[#dae2fd] shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New Group</h2>
              <p className="text-xs text-slate-400">Manage expenses and debts together</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(false)}
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Name</label>
            <input
              id="input-group-name"
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Mirissa Beach Villa 🌴, Colombo Apartment"
              className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Base Currency</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setCurrency(curr.code)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono font-medium border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    <span>{curr.code}</span>
                    <span className="text-[10px] text-slate-400">{curr.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select or Invite Members ({currentSelected.length} members)
            </label>

            {/* Quick Add Input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Add member by name/email..."
                className="flex-1 px-3 py-2 bg-black/40 border border-white/15 focus:border-emerald-400 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomMember}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-300 flex items-center gap-1 border border-white/10"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Members List */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-black/30 border border-white/10 rounded-2xl">
              {users.map((u) => {
                const isSelected = currentSelected.includes(u.uid);
                const isMe = u.uid === currentUser.uid;

                return (
                  <div
                    key={u.uid}
                    onClick={() => toggleMember(u.uid)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-7 h-7 rounded-lg object-cover border border-white/10"
                      />
                      <div>
                        <span className="text-xs font-semibold block">{u.displayName} {isMe && '(You - Admin)'}</span>
                        <span className="text-[10px] font-mono text-slate-500">{u.email || 'Member'}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(false)}
              className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-group"
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
