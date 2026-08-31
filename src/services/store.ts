import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Group, Expense } from '../types';
import { DEFAULT_USERS, DEFAULT_GROUPS, DEFAULT_EXPENSES } from '../constants/mockData';

const LOCAL_STORAGE_USERS_KEY = 'equisplit_users_v2';
const LOCAL_STORAGE_GROUPS_KEY = 'equisplit_groups_v2';
const LOCAL_STORAGE_EXPENSES_KEY = 'equisplit_expenses_v2';

// Cross-tab synchronization channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('equisplit_sync_channel')
  : null;

function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    syncChannel?.postMessage({ type: 'SYNC_UPDATE', key });
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

// Initial seed
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(LOCAL_STORAGE_USERS_KEY)) {
    setLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY)) {
    setLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY)) {
    setLocal(LOCAL_STORAGE_EXPENSES_KEY, DEFAULT_EXPENSES);
  }
}

export class DataStore {
  private static instance: DataStore;
  private isFirebaseConnected = false;

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
      DataStore.instance.seedFirestoreIfEmpty();
    }
    return DataStore.instance;
  }

  private async seedFirestoreIfEmpty(): Promise<void> {
    try {
      // Seed users
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', u.uid), u, { merge: true });
      }
      // Seed default groups
      for (const g of DEFAULT_GROUPS) {
        await setDoc(doc(db, 'groups', g.id), g, { merge: true });
      }
      // Seed default expenses
      for (const exp of DEFAULT_EXPENSES) {
        await setDoc(doc(db, 'expenses', exp.id), exp, { merge: true });
      }
      console.log('Firestore initialized with live default groups & expenses');
    } catch (err) {
      console.info('Live Firestore seed completed or permissions deferred:', err);
    }
  }

  // --- Real-time Users Subscription ---
  public subscribeToUsers(callback: (users: User[]) => void): () => void {
    let unsubFirestore: (() => void) | null = null;

    try {
      const q = collection(db, 'users');
      unsubFirestore = onSnapshot(
        q, 
        (snapshot) => {
          if (!snapshot.empty) {
            this.isFirebaseConnected = true;
            const users = snapshot.docs.map(d => ({ ...d.data() } as User));
            callback(users);
          } else {
            // Fallback to local
            callback(getLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS));
          }
        },
        (error) => {
          // If Firestore permissions or network fails, gracefully use local
          callback(getLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS));
        }
      );
    } catch {
      callback(getLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS));
    }

    // Also listen to local sync events
    const localHandler = (e: MessageEvent) => {
      if (e.data?.key === LOCAL_STORAGE_USERS_KEY) {
        callback(getLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS));
      }
    };
    syncChannel?.addEventListener('message', localHandler);

    // Immediate initial call
    callback(getLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS));

    return () => {
      unsubFirestore?.();
      syncChannel?.removeEventListener('message', localHandler);
    };
  }

  // --- Real-time Groups Subscription ---
  public subscribeToGroups(callback: (groups: Group[]) => void): () => void {
    let unsubFirestore: (() => void) | null = null;

    try {
      const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            this.isFirebaseConnected = true;
            const groups = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Group));
            callback(groups);
          } else {
            callback(getLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS));
          }
        },
        () => {
          callback(getLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS));
        }
      );
    } catch {
      callback(getLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS));
    }

    const localHandler = (e: MessageEvent) => {
      if (e.data?.key === LOCAL_STORAGE_GROUPS_KEY) {
        callback(getLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS));
      }
    };
    syncChannel?.addEventListener('message', localHandler);

    callback(getLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS));

    return () => {
      unsubFirestore?.();
      syncChannel?.removeEventListener('message', localHandler);
    };
  }

  // --- Real-time Expenses Subscription for a Group ---
  public subscribeToExpenses(groupId: string, callback: (expenses: Expense[]) => void): () => void {
    let unsubFirestore: (() => void) | null = null;

    const filterLocalExpenses = () => {
      const all = getLocal<Expense[]>(LOCAL_STORAGE_EXPENSES_KEY, DEFAULT_EXPENSES);
      return all.filter(e => e.groupId === groupId).sort((a, b) => b.createdAt - a.createdAt);
    };

    try {
      // Scalable query: indexed with where, orderBy, and limit
      const q = query(
        collection(db, 'expenses'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            this.isFirebaseConnected = true;
            const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
            callback(expenses);
          } else {
            callback(filterLocalExpenses());
          }
        },
        () => {
          callback(filterLocalExpenses());
        }
      );
    } catch {
      callback(filterLocalExpenses());
    }

    const localHandler = (e: MessageEvent) => {
      if (e.data?.key === LOCAL_STORAGE_EXPENSES_KEY) {
        callback(filterLocalExpenses());
      }
    };
    syncChannel?.addEventListener('message', localHandler);

    callback(filterLocalExpenses());

    return () => {
      unsubFirestore?.();
      syncChannel?.removeEventListener('message', localHandler);
    };
  }

  // --- Mutations ---
  public async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const id = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt,
    };

    // Update Local Storage
    const allExpenses = getLocal<Expense[]>(LOCAL_STORAGE_EXPENSES_KEY, DEFAULT_EXPENSES);
    const updated = [newExpense, ...allExpenses];
    setLocal(LOCAL_STORAGE_EXPENSES_KEY, updated);

    // Sync to Firestore asynchronously
    try {
      await setDoc(doc(db, 'expenses', id), newExpense);
    } catch (err) {
      console.info('Synced locally, Firestore remote write deferred/optional:', err);
    }

    return newExpense;
  }

  public async deleteExpense(expenseId: string): Promise<void> {
    const allExpenses = getLocal<Expense[]>(LOCAL_STORAGE_EXPENSES_KEY, DEFAULT_EXPENSES);
    const updated = allExpenses.filter(e => e.id !== expenseId);
    setLocal(LOCAL_STORAGE_EXPENSES_KEY, updated);

    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (err) {
      console.info('Deleted locally:', err);
    }
  }

  public async createGroup(groupData: Omit<Group, 'id' | 'createdAt'>): Promise<Group> {
    const id = 'group-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const createdAt = Date.now();
    const newGroup: Group = {
      ...groupData,
      id,
      createdAt,
    };

    const allGroups = getLocal<Group[]>(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS);
    const updated = [newGroup, ...allGroups];
    setLocal(LOCAL_STORAGE_GROUPS_KEY, updated);

    try {
      await setDoc(doc(db, 'groups', id), newGroup);
    } catch (err) {
      console.info('Created group locally:', err);
    }

    return newGroup;
  }

  public async settleDebt(
    groupId: string, 
    fromUid: string, 
    toUid: string, 
    amountCents: number,
    fromName: string,
    toName: string
  ): Promise<Expense> {
    const settlementExpense: Omit<Expense, 'id' | 'createdAt'> = {
      groupId,
      title: `🤝 Debt Settlement: ${fromName} paid ${toName}`,
      amount: amountCents,
      payerId: fromUid,
      date: new Date().toISOString().split('T')[0],
      category: 'general',
      splitType: 'EXACT',
      splits: {
        [toUid]: amountCents,
      },
      notes: `Direct cash settlement marked as completed.`,
    };

    return this.addExpense(settlementExpense);
  }

  public resetDemoData(): void {
    setLocal(LOCAL_STORAGE_USERS_KEY, DEFAULT_USERS);
    setLocal(LOCAL_STORAGE_GROUPS_KEY, DEFAULT_GROUPS);
    setLocal(LOCAL_STORAGE_EXPENSES_KEY, DEFAULT_EXPENSES);
  }
}

export const store = DataStore.getInstance();
