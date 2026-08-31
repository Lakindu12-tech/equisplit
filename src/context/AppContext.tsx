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
import { User, Group, Expense, Debt, UserBalance, AuditLog } from '../types';
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

  // Data & Members
  users: User[];
  groups: Group[];
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  expenses: Expense[];
  auditLogs: AuditLog[];
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
  settleDebt: (fromUid: string, toUid: string, amountCents: number) => Promise<void>;

  // UI State
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: (open: boolean) => void;
  isActivityOpen: boolean;
  setIsActivityOpen: (open: boolean) => void;
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
  const [isSimplified, setIsSimplified] = useState(true);

  // Modals & Drawers
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'insights'>('dashboard');

  const groupsRef = useRef<Group[]>(groups);
  groupsRef.current = groups;

  // 1. Listen for Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userObj: User = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Member' : fbUser.email?.split('@')[0] || 'Member'),
          email: fbUser.email || (fbUser.isAnonymous ? 'guest@equisplit.local' : ''),
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
          isOnline: true,
          lastActive: Date.now(),
        };
        setCurrentUser(userObj);
        await store.syncUserProfile(userObj);
      } else {
        setCurrentUser(null);
        setGroups([]);
        setCurrentGroup(null);
        setExpenses([]);
        setAuditLogs([]);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Users Directory
  useEffect(() => {
    if (!currentUser) return;
    const unsub = store.subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });
    return () => unsub();
  }, [currentUser]);

  // 3. Subscribe to Groups for the authenticated user
  useEffect(() => {
    if (!currentUser) return;
    const unsub = store.subscribeToGroups(currentUser.uid, (fetchedGroups) => {
      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        // Retain selection if valid, otherwise pick first
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

  // 4. Subscribe to Expenses and Audit Logs for the selected Group
  useEffect(() => {
    if (!currentGroup) {
      setExpenses([]);
      setAuditLogs([]);
      return;
    }

    const unsubExpenses = store.subscribeToExpenses(currentGroup.id, (fetchedExpenses) => {
      setExpenses(fetchedExpenses);
    });

    const unsubLogs = store.subscribeToAuditLogs(currentGroup.id, (fetchedLogs) => {
      setAuditLogs(fetchedLogs);
    });

    return () => {
      unsubExpenses();
      unsubLogs();
    };
  }, [currentGroup?.id]);

  // 5. Auth Handlers
  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const userObj: User = {
        uid: cred.user.uid,
        displayName: name,
        email: email,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
        isOnline: true,
        lastActive: Date.now()
      };
      setCurrentUser(userObj);
      await store.syncUserProfile(userObj);
    }
  };

  const loginAnonymously = async (name?: string) => {
    const cred = await signInAnonymously(auth);
    if (cred.user) {
      const displayName = name || `Guest-${Math.random().toString(36).substring(2, 6)}`;
      await updateProfile(cred.user, { displayName });
      const userObj: User = {
        uid: cred.user.uid,
        displayName,
        email: 'guest@equisplit.local',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
        isOnline: true,
        lastActive: Date.now()
      };
      setCurrentUser(userObj);
      await store.syncUserProfile(userObj);
    }
  };

  // Requirement: Link anonymous account without creating a new UID!
  const linkAccountWithGoogle = async () => {
    if (!auth.currentUser) return;
    const cred = await linkWithPopup(auth.currentUser, googleProvider);
    if (cred.user) {
      const updated: User = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || 'Member',
        email: cred.user.email || '',
        avatarUrl: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
        isOnline: true,
        lastActive: Date.now(),
      };
      setCurrentUser(updated);
      await store.syncUserProfile(updated);
    }
  };

  const linkAccountWithEmail = async (email: string, pass: string) => {
    if (!auth.currentUser) return;
    const credential = EmailAuthProvider.credential(email, pass);
    const cred = await linkWithCredential(auth.currentUser, credential);
    if (cred.user) {
      const updated: User = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        email: email,
        avatarUrl: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
        isOnline: true,
        lastActive: Date.now(),
      };
      setCurrentUser(updated);
      await store.syncUserProfile(updated);
    }
  };

  const logout = async () => {
    if (currentUser) {
      await store.updatePresence(currentUser.uid, false);
    }
    await signOut(auth);
  };

  const updateUserDisplayName = async (name: string) => {
    if (!auth.currentUser || !currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    const updated = { ...currentUser, displayName: name };
    setCurrentUser(updated);
    await store.syncUserProfile(updated);
  };

  // 6. Action Handlers with Optimistic Updates
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    await store.addExpense(expenseData, currentUser);
  };

  const updateExpense = async (oldExp: Expense, updatedData: Partial<Expense>) => {
    if (!currentUser) return;
    await store.updateExpense(oldExp, updatedData, currentUser);
  };

  const deleteExpense = async (expense: Expense) => {
    if (!currentUser) return;
    await store.deleteExpense(expense, currentUser);
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>): Promise<Group> => {
    if (!currentUser) throw new Error('Must be logged in');
    const newGroup = await store.createGroup(groupData, currentUser);
    setCurrentGroup(newGroup);
    return newGroup;
  };

  const settleDebt = async (fromUid: string, toUid: string, amountCents: number) => {
    if (!currentGroup || !currentUser) return;
    const fromUser = users.find(u => u.uid === fromUid)?.displayName || 'Member';
    const toUser = users.find(u => u.uid === toUid)?.displayName || 'Member';

    await store.settleDebt(currentGroup.id, fromUid, toUid, amountCents, fromUser, toUser, currentUser);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#38bdf8'],
      });
    } catch {
      // ignore
    }
  };

  // 7. Computed Balances & Simplified Debts
  const groupMembers = currentGroup ? currentGroup.members : [];
  const netBalances = calculateNetBalances(groupMembers, expenses);
  const simplifiedDebts = optimizeDebts(groupMembers, expenses);
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

        users,
        groups,
        currentGroup,
        setCurrentGroup,
        expenses,
        auditLogs,
        netBalances,
        simplifiedDebts,
        rawDebts,
        isSimplified,
        setIsSimplified,

        addExpense,
        updateExpense,
        deleteExpense,
        createGroup,
        settleDebt,

        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isCreateGroupOpen,
        setIsCreateGroupOpen,
        isActivityOpen,
        setIsActivityOpen,
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

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
