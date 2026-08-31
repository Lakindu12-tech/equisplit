import { optimizeDebts, calculateEqualSplits, calculatePercentageSplits, calculateSharesSplits, calculateNetBalances } from '../src/utils/debtOptimizer';
import { Expense } from '../src/types';
import assert from 'assert';

console.log('--- STARTING DEBT OPTIMIZATION ALGORITHMIC TESTS ---');

// Test 1: Transitive Debt Simplification (A owes B, B owes C -> A owes C)
{
  const members = ['user-A', 'user-B', 'user-C'];
  const expenses: Expense[] = [
    {
      id: 'e1',
      groupId: 'g1',
      title: 'Expense 1',
      amount: 1000, // $10.00
      payerId: 'user-B',
      date: '2026-08-31',
      category: 'food',
      splitType: 'EXACT',
      splits: { 'user-A': 1000 },
      createdAt: 1,
    },
    {
      id: 'e2',
      groupId: 'g1',
      title: 'Expense 2',
      amount: 1000, // $10.00
      payerId: 'user-C',
      date: '2026-08-31',
      category: 'food',
      splitType: 'EXACT',
      splits: { 'user-B': 1000 },
      createdAt: 2,
    }
  ];

  const simplified = optimizeDebts(members, expenses);
  console.log('Test 1 (Transitive A->B->C => A->C):', simplified);
  assert.strictEqual(simplified.length, 1, 'Should reduce 2 transactions to exactly 1');
  assert.strictEqual(simplified[0].from, 'user-A', 'Debtor should be user-A');
  assert.strictEqual(simplified[0].to, 'user-C', 'Creditor should be user-C');
  assert.strictEqual(simplified[0].amount, 1000, 'Amount should be exactly 1000 cents');
  console.log('✓ Test 1 PASSED');
}

// Test 2: Circular Debt Elimination (A owes B $10, B owes C $10, C owes A $10 -> 0 transactions)
{
  const members = ['user-A', 'user-B', 'user-C'];
  const expenses: Expense[] = [
    { id: '1', groupId: 'g', title: '1', amount: 1000, payerId: 'user-B', date: '2026-08-31', category: 'food', splitType: 'EXACT', splits: { 'user-A': 1000 }, createdAt: 1 },
    { id: '2', groupId: 'g', title: '2', amount: 1000, payerId: 'user-C', date: '2026-08-31', category: 'food', splitType: 'EXACT', splits: { 'user-B': 1000 }, createdAt: 2 },
    { id: '3', groupId: 'g', title: '3', amount: 1000, payerId: 'user-A', date: '2026-08-31', category: 'food', splitType: 'EXACT', splits: { 'user-C': 1000 }, createdAt: 3 },
  ];

  const simplified = optimizeDebts(members, expenses);
  console.log('Test 2 (Circular Debt Elimination):', simplified);
  assert.strictEqual(simplified.length, 0, 'Circular debt should completely cancel out to 0 transactions');
  console.log('✓ Test 2 PASSED');
}

// Test 3: Cent Accuracy in Equal Split ($100 across 3 people = 3334, 3333, 3333 -> sum = 10000)
{
  const splits = calculateEqualSplits(10000, ['u1', 'u2', 'u3']);
  const sum = Object.values(splits).reduce((a, b) => a + b, 0);
  console.log('Test 3 (Equal split in cents):', splits, 'Sum:', sum);
  assert.strictEqual(sum, 10000, 'Sum of split cents must equal total cents exactly');
  assert.strictEqual(splits['u1'], 3334, 'First participant receives remainder cent');
  assert.strictEqual(splits['u2'], 3333);
  assert.strictEqual(splits['u3'], 3333);
  console.log('✓ Test 3 PASSED');
}

// Test 4: Percentage Split with exact cent rounding
{
  const { splits, totalPercent } = calculatePercentageSplits(10000, {
    u1: 33.33,
    u2: 33.33,
    u3: 33.34
  });
  const sum = Object.values(splits).reduce((a, b) => a + b, 0);
  console.log('Test 4 (Percentage split in cents):', splits, 'Sum:', sum);
  assert.strictEqual(sum, 10000, 'Sum must equal 10000 cents exactly');
  console.log('✓ Test 4 PASSED');
}

// Test 5: Ratio / Shares Split (2 : 1 : 1 of $100 -> $50, $25, $25)
{
  const { splits, totalShares } = calculateSharesSplits(10000, {
    u1: 2,
    u2: 1,
    u3: 1
  });
  const sum = Object.values(splits).reduce((a, b) => a + b, 0);
  console.log('Test 5 (Shares split in cents):', splits, 'Sum:', sum);
  assert.strictEqual(totalShares, 4);
  assert.strictEqual(splits['u1'], 5000);
  assert.strictEqual(splits['u2'], 2500);
  assert.strictEqual(splits['u3'], 2500);
  assert.strictEqual(sum, 10000);
  console.log('✓ Test 5 PASSED');
}

// Test 6: LKR Currency Formatting with Comma Separators (150000 cents -> "Rs. 1,500.00")
{
  import('../src/utils/debtOptimizer').then(({ formatCents }) => {
    const formattedPos = formatCents(150000, 'LKR');
    const formattedNeg = formatCents(-2500000, 'LKR');
    console.log('Test 6 (LKR formatting):', formattedPos, formattedNeg);
    assert.strictEqual(formattedPos, 'Rs. 1,500.00');
    assert.strictEqual(formattedNeg, '-Rs. 25,000.00');
    console.log('✓ Test 6 PASSED');
  });
}

console.log('--- ALL DEBT OPTIMIZATION ALGORITHMIC TESTS PASSED! ---');
