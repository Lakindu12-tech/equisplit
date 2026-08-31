import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { Users, X, Check, Plus, AlertCircle } from 'lucide-react';

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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([
    currentUser.uid,
    'user-sarah',
    'user-mike'
  ]);
  const [error, setError] = useState<string | null>(null);


  const toggleMember = (uid: string) => {
    if (selectedMembers.includes(uid)) {
      if (selectedMembers.length <= 2) {
        setError('A group must have at least 2 members.');
        return;
      }
      setSelectedMembers(selectedMembers.filter(id => id !== uid));
    } else {
      setSelectedMembers([...selectedMembers, uid]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    }
    if (selectedMembers.length < 2) {
      setError('Please select at least 2 members.');
      return;
    }

    setError(null);
    await createGroup({
      name: groupName.trim(),
      currency,
      members: selectedMembers,
    });

    setIsCreateGroupOpen(false);
    setGroupName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Group</h2>
              <p className="text-xs text-muted-foreground">Set up a shared space for expenses</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(false)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Group Title
            </label>
            <input
              id="input-group-name"
              type="text"
              required
              placeholder="e.g. Iceland Roadtrip 🇮🇸, Apartment 4B"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-emerald-500 outline-none text-white text-sm font-medium transition-all"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-sm font-mono outline-none cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Members Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Members ({selectedMembers.length})
              </label>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-black/20 border border-white/5">
              {users.map(user => {
                const isSelected = selectedMembers.includes(user.uid);
                return (
                  <div
                    key={user.uid}
                    onClick={() => toggleMember(user.uid)}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-white/5 border-transparent opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <span className="text-xs font-medium">
                        {user.uid === currentUser.uid ? `${user.displayName} (You)` : user.displayName}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isSelected ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground hover:text-white"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-create-group"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Create Group
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
