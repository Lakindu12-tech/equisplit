import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { 
  Navbar, 
  Dashboard, 
  BalancesLedger, 
  CategoryBreakdown, 
  AddExpenseModal, 
  CreateGroupModal, 
  BottomNav 
} from './components';

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isAddExpenseOpen, 
    isCreateGroupOpen 
  } = useApp();

  return (
    <div className="min-h-screen bg-[#060e20] text-[#dae2fd] flex flex-col font-sans">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        
        {/* Desktop Tab Selector */}
        <div className="hidden md:flex items-center gap-2 mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            id="tab-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'ledger'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Settle Up & Ledger
          </button>
          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Spending Insights
          </button>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'expenses' && <Dashboard />}
        {activeTab === 'ledger' && <BalancesLedger />}
        {activeTab === 'analytics' && <CategoryBreakdown />}
      </main>

      {/* Modals & Bottom Navigation */}
      {isAddExpenseOpen && <AddExpenseModal />}
      {isCreateGroupOpen && <CreateGroupModal />}
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
