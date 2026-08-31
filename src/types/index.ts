export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type Category = 
  | 'food'
  | 'transport'
  | 'lodging'
  | 'entertainment'
  | 'groceries'
  | 'utilities'
  | 'general';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  isOnline?: boolean;
  lastActive?: number;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // array of uids
  currency: string;  // e.g. "LKR", "USD", "EUR"
  createdAt: number;
  createdBy?: string; // uid of creator
  admins?: string[];  // uids of admins
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;       // In CENTS (e.g. Rs. 100.00 = 10000)
  payerId: string;
  date: string;
  category: Category;
  splitType: SplitType;
  splits: Record<string, number>; // uid -> amountOwed in CENTS
  notes?: string;
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  createdAt: number;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SETTLE';

export interface AuditLog {
  id: string;
  groupId: string;
  entityId: string; // expenseId or settlementId
  action: AuditAction;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
  description: string;
  changes?: {
    oldState?: any;
    newState?: any;
  };
}

export interface Debt {
  from: string; // debtor uid
  to: string;   // creditor uid
  amount: number; // in CENTS
}

export interface UserBalance {
  uid: string;
  totalPaid: number;   // in CENTS
  totalOwed: number;   // in CENTS
  netBalance: number;  // in CENTS (totalPaid - totalOwed)
}

export interface CategoryInfo {
  id: Category;
  label: string;
  icon: string;
  color: string;
  bgLight: string;
}
