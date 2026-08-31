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
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // array of uids
  currency: string;  // e.g. "USD", "EUR", "GBP", "INR"
  createdAt: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;       // In CENTS (e.g. $100.00 = 10000)
  payerId: string;
  date: string;
  category: Category;
  splitType: SplitType;
  splits: Record<string, number>; // uid -> amountOwed in CENTS
  notes?: string;
  originalCurrency?: string;
  originalAmount?: number;      // in foreign units
  exchangeRate?: number;
  createdAt: number;
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
