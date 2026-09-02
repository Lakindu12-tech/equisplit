import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { useCapacitor } from './hooks/useCapacitor';
import {
  Navbar, 
  Dashboard, 
  BalancesLedger, 
  CategoryBreakdown, 
  AddExpenseModal, 
  CreateGroupModal, 
  EditExpenseModal,
  ActivityDrawer,
  AuthModal,
  BottomNav,
  PWAReloadPrompt
} from './components';

const MainContent: React.FC = () => {
  useCapacitor();

  const {
    currentUser, 
    isAuthLoading, 
    activeTab, 
    setActiveTab 
  } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#060e20] flex flex-col items-center justify-center text-[#dae2fd]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 animate-spin">
          <div className="w-full h-full bg-[#060e20] rounded-2xl" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest uppercase text-slate-400 animate-pulse">
          Initializing EquiSplit v2.0...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#060e20] text-[#dae2fd] relative overflow-hidden flex items-center justify-center">
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060e20] text-[#dae2fd] flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Volumetric Ambient Lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar />

      {/* Main Tab Navigation Pill Selector (Desktop / Tablet) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full hidden sm:block">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 w-fit">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            DASHBOARD
          </button>
          <button
            id="tab-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ledger'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SETTLE UP & LEDGER
          </button>
          <button
            id="tab-insights"
            onClick={() => setActiveTab('insights')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'insights'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SPENDING INSIGHTS
          </button>
        </div>
      </div>

      {/* Main Content View with Hardware-Accelerated AnimatePresence */}
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="gpu-accel"
            >
              <Dashboard />
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div
              key="ledger-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="gpu-accel"
            >
              <BalancesLedger />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="gpu-accel"
            >
              <CategoryBreakdown />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Drawers */}
      <AddExpenseModal />
      <CreateGroupModal />
      <EditExpenseModal />
      <ActivityDrawer />

      {/* Mobile Bottom Navigation Dock */}
      <div className="sm:hidden">
        <BottomNav />
      </div>

      {/* PWA Update Toast Notification Prompt */}
      <PWAReloadPrompt />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
