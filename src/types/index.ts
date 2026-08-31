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
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    branch?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // array of uids
  currency: string;  // e.g. "LKR", "USD", "EUR"
  budgets?: Partial<Record<Category, number>>; // Category monthly budget limits in CENTS
  createdAt: number;
  createdBy?: string; // uid of creator
  admins?: string[];  // uids of admins
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;       // In CENTS (e.g. Rs. 100.00 = 10000)
  payerId: string;      // Primary/Legacy payer ID
  paidBy?: Record<string, number>; // Multi-Payer: uid -> amountPaid in CENTS
  date: string;
  category: Category;
  splitType: SplitType;
  splits: Record<string, number>; // uid -> amountOwed in CENTS
  receiptUrl?: string | null;     // Receipt image URL from Firebase Storage or DataURL
  searchKeywords?: string[];      // Search keywords for fast offline querying
  notes?: string;
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  createdAt: number;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  recurringExpenseId?: string;    // If spawned from recurring bill
}

export interface RecurringExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;       // In CENTS
  payerId: string;
  paidBy?: Record<string, number>;
  category: Category;
  splitType: SplitType;
  splits: Record<string, number>;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  nextDueDate: string;
  active: boolean;
  processedDates: string[]; // Idempotency Lock: e.g. ['2026-08', '2026-09']
  createdAt: number;
  createdBy: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  priceCents: number;
  claimedBy: string[]; // Array of uids claiming this item
}

export interface ItemizedReceipt {
  items: ReceiptItem[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SETTLE' | 'BUDGET_UPDATE' | 'RECURRING_CREATE';

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

export interface SmartAddDraft {
  title: string;
  amount: number; // in CENTS
  category: Category;
  payerId: string;
  paidBy: Record<string, number>;
  splits: Record<string, number>;
  splitType: SplitType;
  participants: string[];
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  category: Category;
  rawText: string;
}
