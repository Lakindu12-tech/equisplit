import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Group, Expense, Debt, UserBalance } from '../types';
import { store } from '../services/store';
import { DEFAULT_USERS, DEFAULT_GROUPS, DEFAULT_EXPENSES } from '../constants/mockData';
import { calculateNetBalances, optimizeDebts, calculateRawDebts } from '../utils/debtOptimizer';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  groups: Group[];
  currentGroup: Group | null;
  setCurrentGroup: (group: Group) => void;
  expenses: Expense[];
  netBalances: Record<string, UserBalance>;
  simplifiedDebts: Debt[];
  rawDebts: Debt[];
  isSimplified: boolean;
  setIsSimplified: (val: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  createGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<Group>;
  settleDebt: (fromUid: string, toUid: string, amountCents: number) => Promise<void>;
  resetDemo: () => void;
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: (open: boolean) => void;
  activeTab: 'dashboard' | 'expenses' | 'ledger' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'expenses' | 'ledger' | 'analytics') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSimplified, setIsSimplified] = useState<boolean>(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'ledger' | 'analytics'>('dashboard');

  // Subscribe to Users
  useEffect(() => {
    const unsub = store.subscribeToUsers((u) => {
      setUsers(u);
      // Keep currentUser valid
      if (!u.some(user => user.uid === currentUser.uid)) {
        setCurrentUser(u[0] || DEFAULT_USERS[0]);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Groups
  useEffect(() => {
    const unsub = store.subscribeToGroups((g) => {
      setGroups(g);
      if (g.length > 0) {
        // If currentGroup is not set or not in list, set to first
        setCurrentGroup(prev => {
          if (!prev || !g.some(grp => grp.id === prev.id)) {
            return g[0];
          }
          return g.find(grp => grp.id === prev.id) || g[0];
        });
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Expenses of currentGroup
  useEffect(() => {
    if (!currentGroup) {
      setExpenses([]);
      return;
    }

    const unsub = store.subscribeToExpenses(currentGroup.id, (exp) => {
      setExpenses(exp);
    });

    return () => unsub();
  }, [currentGroup?.id]);

  // Derived Debt & Balances calculations
  const memberIds = currentGroup?.members || [];
  const netBalances = calculateNetBalances(memberIds, expenses);
  const simplifiedDebts = optimizeDebts(memberIds, expenses);
  const rawDebts = calculateRawDebts(expenses);

  const handleAddExpense = async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = await store.addExpense(exp);
    return created;
  };

  const handleDeleteExpense = async (id: string) => {
    await store.deleteExpense(id);
  };

  const handleCreateGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    const created = await store.createGroup(groupData);
    setCurrentGroup(created);
    return created;
  };

  const handleSettleDebt = async (fromUid: string, toUid: string, amountCents: number) => {
    if (!currentGroup) return;
    const fromUser = users.find(u => u.uid === fromUid)?.displayName || fromUid;
    const toUser = users.find(u => u.uid === toUid)?.displayName || toUid;

    await store.settleDebt(currentGroup.id, fromUid, toUid, amountCents, fromUser, toUser);

    // Celebratory confetti animation on settling debts
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  const handleResetDemo = () => {
    store.resetDemoData();
    setUsers(DEFAULT_USERS);
    setGroups(DEFAULT_GROUPS);
    setCurrentGroup(DEFAULT_GROUPS[0]);
    setExpenses(DEFAULT_EXPENSES.filter(e => e.groupId === DEFAULT_GROUPS[0].id));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        groups,
        currentGroup,
        setCurrentGroup,
        expenses,
        netBalances,
        simplifiedDebts,
        rawDebts,
        isSimplified,
        setIsSimplified,
        addExpense: handleAddExpense,
        deleteExpense: handleDeleteExpense,
        createGroup: handleCreateGroup,
        settleDebt: handleSettleDebt,
        resetDemo: handleResetDemo,
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isCreateGroupOpen,
        setIsCreateGroupOpen,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
