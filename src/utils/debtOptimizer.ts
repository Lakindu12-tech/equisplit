import { Expense, Debt, UserBalance } from '../types';

/**
 * Normalizes an expense's payer information for multi-payer compatibility.
 * Safeguard: Falls back to legacy { [expense.payerId]: expense.amount } for v1/v2 records.
 */
export function normalizePaidBy(expense: Expense): Record<string, number> {
  if (expense.paidBy && Object.keys(expense.paidBy).length > 0) {
    return expense.paidBy;
  }
  return { [expense.payerId]: expense.amount };
}

/**
 * Calculates net balances for all members across an array of expenses.
 * Supports single-payer and multi-payer transactions in integer cents.
 */
export function calculateNetBalances(
  memberIds: string[],
  expenses: Expense[]
): Record<string, UserBalance> {
  const balances: Record<string, UserBalance> = {};

  // Initialize for all group members
  for (const uid of memberIds) {
    balances[uid] = {
      uid,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    };
  }

  // Aggregate from expenses with Multi-Payer normalization
  for (const expense of expenses) {
    const paidBy = normalizePaidBy(expense);
    
    // Add amounts paid by each contributor
    for (const [payerId, amountPaid] of Object.entries(paidBy)) {
      if (!balances[payerId]) {
        balances[payerId] = { uid: payerId, totalPaid: 0, totalOwed: 0, netBalance: 0 };
      }
      balances[payerId].totalPaid += amountPaid;
    }

    // Add what each participant owes
    for (const [debtorId, amountOwed] of Object.entries(expense.splits)) {
      if (!balances[debtorId]) {
        balances[debtorId] = { uid: debtorId, totalPaid: 0, totalOwed: 0, netBalance: 0 };
      }
      balances[debtorId].totalOwed += amountOwed;
    }
  }

  // Calculate final net balance: totalPaid - totalOwed
  for (const uid of Object.keys(balances)) {
    balances[uid].netBalance = balances[uid].totalPaid - balances[uid].totalOwed;
  }

  return balances;
}

/**
 * Deterministic Minimum Cash Flow Debt Optimization Algorithm.
 * Solves the group debt settlement problem in minimum number of transactions
 * using a greedy bipartite matching strategy on integer cents.
 */
export function optimizeDebts(
  memberIds: string[],
  expenses: Expense[]
): Debt[] {
  const balances = calculateNetBalances(memberIds, expenses);

  // Separate into Creditors (> 0) and Debtors (< 0)
  interface Party {
    uid: string;
    balance: number; // positive for creditors, negative for debtors
  }

  const creditors: Party[] = [];
  const debtors: Party[] = [];

  for (const { uid, netBalance } of Object.values(balances)) {
    if (netBalance > 0) {
      creditors.push({ uid, balance: netBalance });
    } else if (netBalance < 0) {
      debtors.push({ uid, balance: netBalance }); // netBalance is negative
    }
  }

  // Sort creditors descending by balance; debtors ascending (largest debt magnitude first)
  creditors.sort((a, b) => b.balance - a.balance || a.uid.localeCompare(b.uid));
  debtors.sort((a, b) => a.balance - b.balance || a.uid.localeCompare(b.uid));

  const simplifiedDebts: Debt[] = [];

  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const creditAmount = creditor.balance;
    const debtAmount = Math.abs(debtor.balance);

    const settledAmount = Math.min(creditAmount, debtAmount);

    if (settledAmount > 0) {
      simplifiedDebts.push({
        from: debtor.uid,
        to: creditor.uid,
        amount: settledAmount,
      });
    }

    creditor.balance -= settledAmount;
    debtor.balance += settledAmount; // since balance is negative, adding moves closer to 0

    if (creditor.balance === 0) {
      cIdx++;
    }
    if (debtor.balance === 0) {
      dIdx++;
    }
  }

  return simplifiedDebts;
}

/**
 * Calculates raw (pairwise unsimplified) debts directly from individual expense splits and multi-payers.
 */
export function calculateRawDebts(
  expenses: Expense[]
): Debt[] {
  const pairwiseDebt: Record<string, number> = {}; // "debtor->creditor" -> cents

  for (const expense of expenses) {
    const paidBy = normalizePaidBy(expense);
    const allParticipants = Array.from(
      new Set([...Object.keys(paidBy), ...Object.keys(expense.splits)])
    );

    const creditors: { uid: string; balance: number }[] = [];
    const debtors: { uid: string; balance: number }[] = [];

    for (const uid of allParticipants) {
      const net = (paidBy[uid] || 0) - (expense.splits[uid] || 0);
      if (net > 0) creditors.push({ uid, balance: net });
      else if (net < 0) debtors.push({ uid, balance: net });
    }

    let c = 0;
    let d = 0;
    while (c < creditors.length && d < debtors.length) {
      const cr = creditors[c];
      const db = debtors[d];
      const settle = Math.min(cr.balance, Math.abs(db.balance));
      if (settle > 0) {
        const key = `${db.uid}->${cr.uid}`;
        pairwiseDebt[key] = (pairwiseDebt[key] || 0) + settle;
      }
      cr.balance -= settle;
      db.balance += settle;
      if (cr.balance === 0) c++;
      if (db.balance === 0) d++;
    }
  }

  // Net out bilateral pairs (e.g. A owes B $50 and B owes A $20 -> A owes B $30)
  const debts: Debt[] = [];
  const processedPairs = new Set<string>();

  for (const key of Object.keys(pairwiseDebt)) {
    const [from, to] = key.split('->');
    const pairId = [from, to].sort().join('<->');

    if (processedPairs.has(pairId)) continue;
    processedPairs.add(pairId);

    const fromTo = pairwiseDebt[`${from}->${to}`] || 0;
    const toFrom = pairwiseDebt[`${to}->${from}`] || 0;

    if (fromTo > toFrom) {
      debts.push({ from, to, amount: fromTo - toFrom });
    } else if (toFrom > fromTo) {
      debts.push({ from: to, to: from, amount: toFrom - fromTo });
    }
  }

  return debts;
}

/**
 * Split Calculations: Equal distribution in cents with exact sum guarantee.
 */
export function calculateEqualSplits(
  totalAmountCents: number,
  participantIds: string[]
): Record<string, number> {
  const count = participantIds.length;
  if (count === 0 || totalAmountCents <= 0) return {};

  const baseShare = Math.floor(totalAmountCents / count);
  let remainder = totalAmountCents % count;

  const splits: Record<string, number> = {};
  for (const uid of participantIds) {
    // Distribute 1 extra cent to the first remainder participants
    const addCent = remainder > 0 ? 1 : 0;
    splits[uid] = baseShare + addCent;
    if (remainder > 0) remainder--;
  }

  return splits;
}

/**
 * Split Calculations: Percentage distribution in cents with exact rounding.
 */
export function calculatePercentageSplits(
  totalAmountCents: number,
  percentages: Record<string, number> // uid -> percent (0 - 100)
): { splits: Record<string, number>; totalPercent: number } {
  const splits: Record<string, number> = {};
  let totalPercent = 0;

  const entries = Object.entries(percentages);
  for (const [, pct] of entries) {
    totalPercent += pct;
  }

  let totalAllocatedCents = 0;
  for (const [uid, pct] of entries) {
    const share = Math.round((totalAmountCents * pct) / 100);
    splits[uid] = share;
    totalAllocatedCents += share;
  }

  // Adjust any rounding disparity to the largest percentage holder
  if (Math.abs(totalPercent - 100) < 0.001 && entries.length > 0) {
    const diff = totalAmountCents - totalAllocatedCents;
    if (diff !== 0) {
      const topUid = entries.sort((a, b) => b[1] - a[1])[0][0];
      splits[topUid] = (splits[topUid] || 0) + diff;
    }
  }

  return { splits, totalPercent };
}

/**
 * Split Calculations: Shares (ratio-based) distribution in cents.
 */
export function calculateSharesSplits(
  totalAmountCents: number,
  shares: Record<string, number> // uid -> positive integer share
): { splits: Record<string, number>; totalShares: number } {
  const splits: Record<string, number> = {};
  let totalShares = 0;

  for (const [, share] of Object.entries(shares)) {
    if (share > 0) totalShares += share;
  }

  if (totalShares === 0) return { splits, totalShares: 0 };

  let totalAllocated = 0;
  const sorted = Object.entries(shares).filter(([, s]) => s > 0);

  for (const [uid, share] of sorted) {
    const amount = Math.floor((totalAmountCents * share) / totalShares);
    splits[uid] = amount;
    totalAllocated += amount;
  }

  // Allocate remainder cents
  let remainder = totalAmountCents - totalAllocated;
  for (const [uid] of sorted) {
    if (remainder <= 0) break;
    splits[uid] += 1;
    remainder--;
  }

  return { splits, totalShares };
}

/**
 * Formatter: Convert integer cents to formatted currency string (e.g. 150000 -> "Rs. 1,500.00" or "$1,500.00")
 */
export function formatCents(cents: number, currency: string = 'LKR'): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const formattedNumber = (absCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbols: Record<string, string> = {
    LKR: 'Rs. ',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    INR: '₹',
  };

  const symbol = symbols[currency] !== undefined ? symbols[currency] : `${currency} `;
  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}
