import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Plus, 
  RotateCcw, 
  ChevronDown, 
  Sparkles,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    groups, 
    currentGroup, 
    setCurrentGroup,
    setIsAddExpenseOpen,
    setIsCreateGroupOpen,
    resetDemo,
    activeTab,
    setActiveTab
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Group Selector */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all flex items-center justify-center">
              <div className="w-full h-full bg-[#060e20] rounded-[14px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                EquiSplit
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          {/* Group Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                {currentGroup ? currentGroup.name : 'Select Group'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {isGroupDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-fade-in"
                onMouseLeave={() => setIsGroupDropdownOpen(false)}
              >
                <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">
                  Your Groups
                </div>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setCurrentGroup(group);
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all ${
                      currentGroup?.id === group.id 
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                        : 'hover:bg-white/5 text-foreground/80'
                    }`}
                  >
                    <span className="truncate">{group.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-muted-foreground">
                      {group.currency}
                    </span>
                  </button>
                ))}

                <div className="h-px bg-white/10 my-1.5" />

                <button
                  onClick={() => {
                    setIsGroupDropdownOpen(false);
                    setIsCreateGroupOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Group</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, User Switcher, Reset */}
        <div className="flex items-center gap-3">
          
          {/* Quick Add Expense Button */}
          <button
            id="btn-add-expense-nav"
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>

          {/* User Persona Switcher */}
          <div className="relative">
            <button
              id="btn-user-switcher"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Switch user perspective"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-xl object-cover ring-2 ring-emerald-500/50"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold leading-tight truncate max-w-[100px]">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Active
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </button>

            {isUserDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-fade-in"
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Perspective</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                {users.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => {
                      setCurrentUser(user);
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      currentUser.uid === user.uid 
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                        : 'hover:bg-white/5 text-foreground/80'
                    }`}
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                    <span className="truncate">{user.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={resetDemo}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/5 transition-all"
            title="Reset sample data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
