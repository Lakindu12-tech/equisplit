import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User, Group, Expense, Debt, UserBalance, AuditLog, RecurringExpense } from '../types';
import { store } from '../services/store';
import { calculateNetBalances, optimizeDebts, calculateRawDebts } from '../utils/debtOptimizer';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Auth & Profile
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string, name: string) => Promise<void>;
  loginAnonymously: (name?: string) => Promise<void>;
  linkAccountWithGoogle: () => Promise<void>;
  linkAccountWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  updateUserBankDetails: (details: User['bankDetails']) => Promise<void>;

  // Data & Members
  users: User[];
  groups: Group[];
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  expenses: Expense[];
  auditLogs: AuditLog[];
  recurringExpenses: RecurringExpense[];
  netBalances: Record<string, UserBalance>;
  simplifiedDebts: Debt[];
  rawDebts: Debt[];
  isSimplified: boolean;
  setIsSimplified: (val: boolean) => void;

  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (oldExp: Expense, updated: Partial<Expense>) => Promise<void>;
  deleteExpense: (expense: Expense) => Promise<void>;
  createGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<Group>;
  createRecurringExpense: (recData: Omit<RecurringExpense, 'id' | 'createdAt'>) => Promise<void>;
  settleDebt: (fromUid: string, toUid: string, amountCents: number) => Promise<void>;

  // UI State
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: (open: boolean) => void;
  isActivityOpen: boolean;
  setIsActivityOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  isBankImportOpen: boolean;
  setIsBankImportOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  activeTab: 'dashboard' | 'ledger' | 'insights';
  setActiveTab: (tab: 'dashboard' | 'ledger' | 'insights') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  const [isSimplified, setIsSimplified] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBankImportOpen, setIsBankImportOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'insights'>('dashboard');

  // 1. Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const customName = localStorage.getItem('equisplit_guest_name') || fbUser.displayName || 'Member';
        const userObj: User = {
          uid: fbUser.uid,
          displayName: customName,
          email: fbUser.email || (fbUser.isAnonymous ? 'Guest User' : ''),
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
          isOnline: true,
          lastActive: Date.now(),
        };
        setCurrentUser(userObj);
        await store.syncUserProfile(userObj);
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Users Directory
  useEffect(() => {
    if (!currentUser) return;
    const unsub = store.subscribeToUsers((fetchedUsers: User[]) => {
      setUsers(fetchedUsers);
    });
    return () => unsub();
  }, [currentUser]);

  // 3. Subscribe to Groups for the authenticated user
  useEffect(() => {
    if (!currentUser) return;
    const unsub = store.subscribeToGroups(currentUser.uid, (fetchedGroups: Group[]) => {
      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        setCurrentGroup((prev) => {
          if (prev && fetchedGroups.some(g => g.id === prev.id)) {
            return fetchedGroups.find(g => g.id === prev.id) || prev;
          }
          return fetchedGroups[0];
        });
      } else {
        setCurrentGroup(null);
      }
    });

    return () => unsub();
  }, [currentUser]);

  // 4. Handle ?joinGroup= URL parameter for Zero-Friction Invites
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const joinGroupId = urlParams.get('joinGroup');

    if (joinGroupId) {
      const handleAutoJoin = async () => {
        let user = currentUser;
        if (!user) {
          const cred = await signInAnonymously(auth);
          const guestUser: User = {
            uid: cred.user.uid,
            displayName: 'Invited Companion',
            email: 'Guest User',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
            isOnline: true,
            lastActive: Date.now()
          };
          await store.syncUserProfile(guestUser);
          user = guestUser;
        }
        await store.joinGroup(joinGroupId, user);
        window.history.replaceState({}, document.title, window.location.pathname);
      };

      handleAutoJoin();
    }
  }, [currentUser?.uid]);

  // 5. Subscribe to Expenses, Audit Logs, and Recurring Bills for Selected Group
  useEffect(() => {
    if (!currentGroup) {
      setExpenses([]);
      setAuditLogs([]);
      setRecurringExpenses([]);
      return;
    }

    const unsubExpenses = store.subscribeToExpenses(currentGroup.id, 50, (fetchedExpenses: Expense[]) => {
      setExpenses(fetchedExpenses);
    });

    const unsubLogs = store.subscribeToAuditLogs(currentGroup.id, (fetchedLogs: AuditLog[]) => {
      setAuditLogs(fetchedLogs);
    });

    const unsubRecurring = store.subscribeToRecurringExpenses(currentGroup.id, (bills: RecurringExpense[]) => {
      setRecurringExpenses(bills);
    });

    // Run Idempotent Client-Side Recurring Bill Processor
    if (currentUser) {
      store.processDueRecurringExpenses(currentGroup.id, currentUser);
    }

    return () => {
      unsubExpenses();
      unsubLogs();
      unsubRecurring();
    };
  }, [currentGroup?.id, currentUser?.uid]);

  // Auth Methods
  const loginWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    setIsAuthLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginAnonymously = async (customName?: string) => {
    setIsAuthLoading(true);
    try {
      if (customName) {
        localStorage.setItem('equisplit_guest_name', customName);
      }
      await signInAnonymously(auth);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const linkAccountWithGoogle = async () => {
    if (!auth.currentUser || !auth.currentUser.isAnonymous) return;
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
    } catch (err: any) {
      console.error('linkWithPopup Google error:', err);
      throw err;
    }
  };

  const linkAccountWithEmail = async (email: string, pass: string) => {
    if (!auth.currentUser || !auth.currentUser.isAnonymous) return;
    try {
      const cred = EmailAuthProvider.credential(email, pass);
      await linkWithCredential(auth.currentUser, cred);
    } catch (err: any) {
      console.error('linkWithCredential Email error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (currentUser) {
      await store.updatePresence(currentUser.uid, false);
    }
    localStorage.removeItem('equisplit_guest_name');
    await signOut(auth);
  };

  const updateUserDisplayName = async (name: string) => {
    if (!currentUser) return;
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    const updated = { ...currentUser, displayName: name };
    setCurrentUser(updated);
    await store.syncUserProfile(updated);
  };

  const updateUserBankDetails = async (bankDetails: User['bankDetails']) => {
    if (!currentUser) return;
    const updated = { ...currentUser, bankDetails };
    setCurrentUser(updated);
    await store.updateUserBankDetails(currentUser.uid, bankDetails);
  };

  // Group & Expense Operations
  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>): Promise<Group> => {
    if (!currentUser) throw new Error('Not authenticated');
    const newG = await store.createGroup(groupData, currentUser);
    setCurrentGroup(newG);
    return newG;
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    await store.addExpense(expenseData, currentUser);
  };

  const createRecurringExpense = async (recData: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    await store.createRecurringExpense(recData, currentUser);
  };

  const updateExpense = async (oldExp: Expense, updated: Partial<Expense>) => {
    if (!currentUser) throw new Error('Not authenticated');
    await store.updateExpense(oldExp, updated, currentUser);
  };

  const deleteExpense = async (expense: Expense) => {
    if (!currentUser) throw new Error('Not authenticated');
    await store.deleteExpense(expense, currentUser);
  };

  const settleDebt = async (fromUid: string, toUid: string, amountCents: number) => {
    if (!currentUser || !currentGroup) return;
    const fromName = users.find(u => u.uid === fromUid)?.displayName || 'Debtor';
    const toName = users.find(u => u.uid === toUid)?.displayName || 'Creditor';

    await store.settleDebt(currentGroup.id, fromUid, toUid, amountCents, fromName, toName, currentUser);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Derived Calculations
  const memberIds = currentGroup?.members || [];
  const netBalances = calculateNetBalances(memberIds, expenses);
  const simplifiedDebts = optimizeDebts(memberIds, expenses);
  const rawDebts = calculateRawDebts(expenses);

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAnonymously,
        linkAccountWithGoogle,
        linkAccountWithEmail,
        logout,
        updateUserDisplayName,
        updateUserBankDetails,

        users,
        groups,
        currentGroup,
        setCurrentGroup,
        expenses,
        auditLogs,
        recurringExpenses,
        netBalances,
        simplifiedDebts,
        rawDebts,
        isSimplified,
        setIsSimplified,

        addExpense,
        updateExpense,
        deleteExpense,
        createGroup,
        createRecurringExpense,
        settleDebt,

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
