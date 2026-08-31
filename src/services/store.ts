import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Group, Expense, AuditLog, AuditAction } from '../types';

function sanitizePayload<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload) as unknown as T;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizePayload(value);
    }
  }
  return result as T;
}

export class DataStore {
  private static instance: DataStore;

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  // --- User Presence & Profile Management ---
  public async syncUserProfile(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        isOnline: true,
        lastActive: Date.now()
      }, { merge: true });
    } catch (err) {
      console.warn('syncUserProfile warning:', err);
    }
  }

  public async updatePresence(uid: string, isOnline: boolean): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        isOnline,
        lastActive: Date.now()
      }, { merge: true });
    } catch (err) {
      console.warn('updatePresence warning:', err);
    }
  }

  // --- Real-time Users Subscription ---
  public subscribeToUsers(callback: (users: User[]) => void): () => void {
    try {
      const q = collection(db, 'users');
      return onSnapshot(
        q, 
        (snapshot) => {
          const users = snapshot.docs.map(d => ({ ...d.data() } as User));
          callback(users);
        },
        (error) => {
          console.warn('subscribeToUsers listener note:', error);
          callback([]);
        }
      );
    } catch {
      return () => {};
    }
  }

  // --- Real-time Groups Subscription (Scoped by user membership) ---
  public subscribeToGroups(userId: string, callback: (groups: Group[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userId)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const groups = snapshot.docs
            .map(d => ({ ...d.data() } as Group))
            .sort((a, b) => b.createdAt - a.createdAt);
          callback(groups);
        },
        (error) => {
          console.warn('subscribeToGroups listener note:', error);
          callback([]);
        }
      );
    } catch {
      return () => {};
    }
  }

  // --- Real-time Expenses Subscription (Scoped by groupId) ---
  public subscribeToExpenses(groupId: string, callback: (expenses: Expense[]) => void): () => void {
    if (!groupId) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'expenses'),
        where('groupId', '==', groupId),
        limit(100)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const expenses = snapshot.docs
            .map(d => ({ ...d.data() } as Expense))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(expenses);
        },
        (error) => {
          console.warn('subscribeToExpenses listener note:', error);
          callback([]);
        }
      );
    } catch {
      return () => {};
    }
  }

  // --- Real-time Audit Logs Subscription ---
  public subscribeToAuditLogs(groupId: string, callback: (logs: AuditLog[]) => void): () => void {
    if (!groupId) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'audit_logs'),
        where('groupId', '==', groupId),
        limit(50)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const logs = snapshot.docs
            .map(d => ({ ...d.data() } as AuditLog))
            .sort((a, b) => b.timestamp - a.timestamp);
          callback(logs);
        },
        (error) => {
          console.warn('subscribeToAuditLogs listener note:', error);
          callback([]);
        }
      );
    } catch {
      return () => {};
    }
  }

  // --- Atomic Mutations with Firestore Batch Writes ---

  public async addExpense(
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    user: User
  ): Promise<Expense> {
    const id = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt,
      createdBy: user.uid,
      lastModifiedBy: user.uid,
      lastModifiedAt: createdAt,
    };

    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const auditLog: AuditLog = {
      id: logId,
      groupId: expenseData.groupId,
      entityId: id,
      action: 'CREATE',
      userId: user.uid,
      userName: user.displayName || user.email || 'Member',
      userAvatar: user.avatarUrl,
      timestamp: createdAt,
      description: `Added "${expenseData.title}" for ${expenseData.amount / 100}`,
      changes: {
        newState: newExpense
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'expenses', id), sanitizePayload(newExpense));
    batch.set(doc(db, 'audit_logs', logId), sanitizePayload(auditLog));
    await batch.commit();

    return newExpense;
  }

  public async updateExpense(
    oldExpense: Expense,
    updatedData: Partial<Expense>,
    user: User
  ): Promise<Expense> {
    const updatedAt = Date.now();
    const updatedExpense: Expense = {
      ...oldExpense,
      ...updatedData,
      lastModifiedBy: user.uid,
      lastModifiedAt: updatedAt,
    };

    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const auditLog: AuditLog = {
      id: logId,
      groupId: oldExpense.groupId,
      entityId: oldExpense.id,
      action: 'UPDATE',
      userId: user.uid,
      userName: user.displayName || user.email || 'Member',
      userAvatar: user.avatarUrl,
      timestamp: updatedAt,
      description: `Updated "${updatedExpense.title}"`,
      changes: {
        oldState: oldExpense,
        newState: updatedExpense
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'expenses', oldExpense.id), sanitizePayload(updatedExpense));
    batch.set(doc(db, 'audit_logs', logId), sanitizePayload(auditLog));
    await batch.commit();

    return updatedExpense;
  }

  public async deleteExpense(
    expense: Expense,
    user: User
  ): Promise<void> {
    const timestamp = Date.now();
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const auditLog: AuditLog = {
      id: logId,
      groupId: expense.groupId,
      entityId: expense.id,
      action: 'DELETE',
      userId: user.uid,
      userName: user.displayName || user.email || 'Member',
      userAvatar: user.avatarUrl,
      timestamp,
      description: `Deleted "${expense.title}"`,
      changes: {
        oldState: expense
      }
    };

    const batch = writeBatch(db);
    batch.delete(doc(db, 'expenses', expense.id));
    batch.set(doc(db, 'audit_logs', logId), sanitizePayload(auditLog));
    await batch.commit();
  }

  public async createGroup(
    groupData: Omit<Group, 'id' | 'createdAt'>,
    user: User
  ): Promise<Group> {
    const id = 'group-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const createdAt = Date.now();
    const newGroup: Group = {
      ...groupData,
      id,
      createdAt,
      createdBy: user.uid,
      admins: [user.uid],
      members: Array.from(new Set([user.uid, ...(groupData.members || [])]))
    };

    await setDoc(doc(db, 'groups', id), sanitizePayload(newGroup));
    return newGroup;
  }

  public async settleDebt(
    groupId: string, 
    fromUid: string, 
    toUid: string, 
    amountCents: number,
    fromName: string,
    toName: string,
    user: User
  ): Promise<Expense> {
    const id = 'exp-settle-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const createdAt = Date.now();
    const settlementExpense: Expense = {
      id,
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
      notes: `Direct settlement verified and completed.`,
      createdAt,
      createdBy: user.uid,
      lastModifiedBy: user.uid,
      lastModifiedAt: createdAt,
    };

    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const auditLog: AuditLog = {
      id: logId,
      groupId,
      entityId: id,
      action: 'SETTLE',
      userId: user.uid,
      userName: user.displayName || user.email || 'Member',
      userAvatar: user.avatarUrl,
      timestamp: createdAt,
      description: `Settled debt: ${fromName} paid ${toName}`,
      changes: {
        newState: settlementExpense
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'expenses', id), sanitizePayload(settlementExpense));
    batch.set(doc(db, 'audit_logs', logId), sanitizePayload(auditLog));
    await batch.commit();

    return settlementExpense;
  }
}

export const store = DataStore.getInstance();
