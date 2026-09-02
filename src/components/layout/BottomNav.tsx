import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Scale, 
  PieChart, 
  Plus, 
  History 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setIsAddExpenseOpen, 
    setIsActivityOpen,
    currentGroup 
  } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pointer-events-none flex justify-center">
      <nav className="glass-3d-volumetric px-4 py-2 rounded-3xl shadow-2xl pointer-events-auto flex items-center gap-2 max-w-sm w-full justify-around border border-white/15">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] gap-1 py-1 px-3 rounded-xl transition-all relative select-none active:scale-95 ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight">Dashboard</span>
          {activeTab === 'dashboard' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 shadow-sm shadow-emerald-400" />
          )}
        </button>

        {currentGroup && (
          <button
            id="btn-add-expense-bottom"
            onClick={() => setIsAddExpenseOpen(true)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all -translate-y-2"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] gap-1 py-1 px-3 rounded-xl transition-all relative select-none active:scale-95 ${
            activeTab === 'ledger' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className={`w-5 h-5 ${activeTab === 'ledger' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight">Settle Up</span>
          {activeTab === 'ledger' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 shadow-sm shadow-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] gap-1 py-1 px-3 rounded-xl transition-all relative select-none active:scale-95 ${
            activeTab === 'insights' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className={`w-5 h-5 ${activeTab === 'insights' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight">Insights</span>
          {activeTab === 'insights' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 shadow-sm shadow-emerald-400" />
          )}
        </button>
      </nav>
    </div>
  );
};
