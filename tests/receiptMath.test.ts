import assert from 'assert';
import { calculateProportionalReceiptSplits } from '../src/utils/receiptMath';
import { ReceiptItem } from '../src/types';

console.log('--- STARTING PROPORTIONAL RECEIPT MATH TESTS ---');

// Test 1: Two Single-Claimed Items with Proportional Tax & Tip
console.log('Test 1: Proportional Tax & Tip Allocation');
const items1: ReceiptItem[] = [
  { id: 'item-1', name: 'Burger', priceCents: 2000, claimedBy: ['user-A'] },
  { id: 'item-2', name: 'Pizza', priceCents: 3000, claimedBy: ['user-B'] },
];

const taxCents1 = 500; // $5.00
const tipCents1 = 1000; // $10.00
const members1 = ['user-A', 'user-B', 'user-C'];

const res1 = calculateProportionalReceiptSplits(items1, taxCents1, tipCents1, members1);
console.log('Result 1:', res1);

assert.strictEqual(res1.memberSubtotals['user-A'], 2000);
assert.strictEqual(res1.memberSubtotals['user-B'], 3000);
assert.strictEqual(res1.taxAllocations['user-A'], 200, 'User A should pay 40% of tax (200 cents)');
assert.strictEqual(res1.taxAllocations['user-B'], 300, 'User B should pay 60% of tax (300 cents)');
assert.strictEqual(res1.tipAllocations['user-A'], 400, 'User A should pay 40% of tip (400 cents)');
assert.strictEqual(res1.tipAllocations['user-B'], 600, 'User B should pay 60% of tip (600 cents)');

assert.strictEqual(res1.splits['user-A'], 2600, 'User A total share should be 2600 cents ($26.00)');
assert.strictEqual(res1.splits['user-B'], 3900, 'User B total share should be 3900 cents ($39.00)');
assert.strictEqual(res1.splits['user-C'], 0, 'User C claimed nothing, share should be 0');

const sumSplits1 = Object.values(res1.splits).reduce((s, v) => s + v, 0);
assert.strictEqual(sumSplits1, 6500, 'Sum of all member splits must equal 6500 cents ($65.00)');
assert.strictEqual(sumSplits1, res1.totalCents);
console.log('✓ Test 1 PASSED');

// Test 2: Shared Multi-Claimed Items with Remainder Cents
console.log('Test 2: Shared Multi-Claimed Item with Odd Cents');
const items2: ReceiptItem[] = [
  { id: 'item-shared', name: 'Wine Bottle', priceCents: 2500, claimedBy: ['user-A', 'user-B', 'user-C'] }, // 2500 / 3 = 833, 833, 834
  { id: 'item-personal', name: 'Pasta', priceCents: 1200, claimedBy: ['user-A'] }
];

const taxCents2 = 333;
const tipCents2 = 500;
const members2 = ['user-A', 'user-B', 'user-C'];

const res2 = calculateProportionalReceiptSplits(items2, taxCents2, tipCents2, members2);
console.log('Result 2:', res2);

const sumSplits2 = Object.values(res2.splits).reduce((s, v) => s + v, 0);
assert.strictEqual(sumSplits2, 2500 + 1200 + 333 + 500, 'Exact sum invariant must hold down to single integer cent');
console.log('✓ Test 2 PASSED');

console.log('--- ALL PROPORTIONAL RECEIPT MATH TESTS PASSED! ---');
