import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Plus, 
  Layers, 
  History, 
  User, 
  ChevronDown, 
  Sparkles, 
  Check, 
  CreditCard 
} from 'lucide-react';
import { UserProfileDrawer } from '../auth/UserProfileDrawer';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    groups, 
    currentGroup, 
    setCurrentGroup, 
    setIsAddExpenseOpen, 
    setIsCreateGroupOpen,
    setIsActivityOpen,
    auditLogs
  } = useApp();

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0b1326] rounded-2xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  EquiSplit
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v2.0</span>
                </span>
              </div>
            </div>

            {/* Group Selector Dropdown */}
            {currentUser && (
              <div className="relative ml-2">
                <button
                  id="group-selector-btn"
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[140px] truncate">
                    {currentGroup ? currentGroup.name : 'Select Group'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isGroupDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 glass-3d-volumetric rounded-2xl border border-white/15 shadow-2xl p-2 z-50 animate-fade-in">
                    <div className="text-[11px] font-mono text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                      Your Groups ({groups.length})
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {groups.map((group) => {
                        const isSelected = currentGroup?.id === group.id;
                        return (
                          <button
                            key={group.id}
                            onClick={() => {
                              setCurrentGroup(group);
                              setIsGroupDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                              isSelected 
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' 
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{group.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{group.currency}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 mt-1 border-t border-white/10">
                      <button
                        id="btn-nav-create-group"
                        onClick={() => {
                          setIsGroupDropdownOpen(false);
                          setIsCreateGroupOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-emerald-400 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          {currentUser && (
            <div className="flex items-center gap-2.5">
              {/* Activity History Button with live badge */}
              <button
                id="btn-activity-history"
                onClick={() => setIsActivityOpen(true)}
                title="Activity History & Audit Logs"
                className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.96] border border-white/10 text-slate-300 hover:text-white transition-all relative"
              >
                <History className="w-4 h-4 text-emerald-400" />
                {auditLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold font-mono flex items-center justify-center shadow-md shadow-emerald-500/50">
                    {auditLogs.length > 99 ? '99+' : auditLogs.length}
                  </span>
                )}
              </button>

              {/* Add Expense Primary Button */}
              {currentGroup && (
                <button
                  id="btn-nav-add-expense"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Expense</span>
                </button>
              )}

              {/* User Avatar with Presence Ring */}
              <button
                id="btn-user-profile"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 transition-all"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-7 h-7 rounded-xl object-cover border border-emerald-400/50"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#060e20] presence-glow-online" />
                </div>
                <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden md:inline">
                  {currentUser.displayName}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* User Profile & Account Settings Drawer */}
      <UserProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};
