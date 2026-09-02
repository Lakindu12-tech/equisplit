import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';

export const useCapacitor = () => {
  const {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    isActivityOpen,
    setIsActivityOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    isBankImportOpen,
    setIsBankImportOpen,
    editingExpense,
    setEditingExpense,
    activeTab,
    setActiveTab,
  } = useApp();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Configure Native Status Bar
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#060e20' });
      } catch (err) {
        console.warn('StatusBar configuration notice:', err);
      }
    };

    setupStatusBar();

    // 2. Handle Android Hardware Back Button
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (editingExpense) {
        setEditingExpense(null);
        return;
      }
      if (isAddExpenseOpen) {
        setIsAddExpenseOpen(false);
        return;
      }
      if (isCreateGroupOpen) {
        setIsCreateGroupOpen(false);
        return;
      }
      if (isActivityOpen) {
        setIsActivityOpen(false);
        return;
      }
      if (isInviteModalOpen) {
        setIsInviteModalOpen(false);
        return;
      }
      if (isBankImportOpen) {
        setIsBankImportOpen(false);
        return;
      }

      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }

      // Exit app if on main dashboard and no modals are open
      App.exitApp();
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [
    isAddExpenseOpen,
    isCreateGroupOpen,
    isActivityOpen,
    isInviteModalOpen,
    isBankImportOpen,
    editingExpense,
    activeTab,
    setIsAddExpenseOpen,
    setIsCreateGroupOpen,
    setIsActivityOpen,
    setIsInviteModalOpen,
    setIsBankImportOpen,
    setEditingExpense,
    setActiveTab,
  ]);
};
