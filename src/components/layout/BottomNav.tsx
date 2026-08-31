import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Scale, 
  PieChart, 
  Plus 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddExpenseOpen } = useApp();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'ledger', label: 'Settle Up', icon: Scale },
    { id: 'analytics', label: 'Insights', icon: PieChart },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none flex justify-center">
      <nav className="glass-panel border border-white/15 px-4 py-2 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-1 sm:gap-2 max-w-md w-full justify-around">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}

        {/* Floating Center Add Button */}
        <button
          id="btn-add-expense-bottom"
          onClick={() => setIsAddExpenseOpen(true)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all -translate-y-2"
          title="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
