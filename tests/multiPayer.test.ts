import assert from 'assert';
import { 
  calculateNetBalances, 
  optimizeDebts, 
  calculateRawDebts, 
  normalizePaidBy 
} from '../src/utils/debtOptimizer';
import { parseNaturalLanguageExpense } from '../src/utils/nlpParser';
import { Expense, User } from '../src/types';

console.log('--- STARTING MULTI-PAYER & NLP ALGORITHMIC TESTS ---');

// Test 1: Multi-Payer Net Balance & Debt Optimization
console.log('Test 1: Multi-Payer 4-way Split with 2 Contributors');
// Expense: Rs. 100.00 total. A paid Rs. 60.00 (6000 cents), B paid Rs. 40.00 (4000 cents).
// Split equally among A, B, C, D (2500 cents each).
const multiPayerExpense: Expense = {
  id: 'exp-multi-1',
  groupId: 'group-1',
  title: 'Villa Stay & Groceries',
  amount: 10000,
  payerId: 'user-A',
  paidBy: {
    'user-A': 6000,
    'user-B': 4000,
  },
  date: '2026-08-31',
  category: 'lodging',
  splitType: 'EQUAL',
  splits: {
    'user-A': 2500,
    'user-B': 2500,
    'user-C': 2500,
    'user-D': 2500,
  },
  createdAt: Date.now()
};

const members = ['user-A', 'user-B', 'user-C', 'user-D'];
const balances = calculateNetBalances(members, [multiPayerExpense]);

console.log('Net Balances:', balances);
assert.strictEqual(balances['user-A'].netBalance, 3500, 'User A net should be +3500 cents (+Rs. 35)');
assert.strictEqual(balances['user-B'].netBalance, 1500, 'User B net should be +1500 cents (+Rs. 15)');
assert.strictEqual(balances['user-C'].netBalance, -2500, 'User C net should be -2500 cents (-Rs. 25)');
assert.strictEqual(balances['user-D'].netBalance, -2500, 'User D net should be -2500 cents (-Rs. 25)');

// Total net sum must equal 0
const sumNet = Object.values(balances).reduce((s, b) => s + b.netBalance, 0);
assert.strictEqual(sumNet, 0, 'Sum of all net balances must strictly equal 0');

const debts = optimizeDebts(members, [multiPayerExpense]);
console.log('Optimized Settlements:', debts);
const totalSettled = debts.reduce((s, d) => s + d.amount, 0);
assert.strictEqual(totalSettled, 5000, 'Total settled debt must equal 5000 cents (Rs. 50)');
console.log('✓ Test 1 PASSED');

// Test 2: Legacy Record Normalizer
console.log('Test 2: Legacy Record Normalizer');
const legacyExpense: Expense = {
  id: 'exp-legacy-1',
  groupId: 'group-1',
  title: 'Old Expense',
  amount: 8000,
  payerId: 'user-A',
  date: '2026-08-01',
  category: 'food',
  splitType: 'EQUAL',
  splits: { 'user-A': 4000, 'user-B': 4000 },
  createdAt: Date.now()
};

const normalizedPaid = normalizePaidBy(legacyExpense);
assert.deepStrictEqual(normalizedPaid, { 'user-A': 8000 }, 'Legacy record must normalize to { [payerId]: amount }');
const legacyBalances = calculateNetBalances(['user-A', 'user-B'], [legacyExpense]);
assert.strictEqual(legacyBalances['user-A'].netBalance, 4000);
assert.strictEqual(legacyBalances['user-B'].netBalance, -4000);
console.log('✓ Test 2 PASSED');

// Test 3: Natural Language Expense Parser
console.log('Test 3: Natural Language NLP Parser');
const mockUsers: User[] = [
  { uid: 'u-saman', displayName: 'Saman Perera', email: 'saman@example.com', avatarUrl: '' },
  { uid: 'u-kamal', displayName: 'Kamal Silva', email: 'kamal@example.com', avatarUrl: '' },
  { uid: 'u-sarah', displayName: 'Sarah Jenkins', email: 'sarah@example.com', avatarUrl: '' },
];

const draft1 = parseNaturalLanguageExpense('Dinner 12000 Kamal paid', mockUsers, 'u-saman');
console.log('NLP Draft 1:', draft1);
assert.ok(draft1 !== null);
assert.strictEqual(draft1.amount, 1200000, 'Amount should be 12000.00 in cents (1200000)');
assert.strictEqual(draft1.payerId, 'u-kamal', 'Payer should be Kamal');
assert.strictEqual(draft1.category, 'food', 'Category should be food');

const draft2 = parseNaturalLanguageExpense('Uber taxi 2500 with Sarah', mockUsers, 'u-saman');
console.log('NLP Draft 2:', draft2);
assert.ok(draft2 !== null);
assert.strictEqual(draft2.amount, 250000, 'Amount should be 2500.00 in cents (250000)');
assert.strictEqual(draft2.category, 'transport', 'Category should be transport');
assert.ok(draft2.participants.includes('u-sarah'), 'Participants should include Sarah');

console.log('--- ALL MULTI-PAYER & NLP ALGORITHMIC TESTS PASSED! ---');
