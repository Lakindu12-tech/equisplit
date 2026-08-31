import { ReceiptItem } from '../types';

export interface ProportionalSplitResult {
  splits: Record<string, number>; // uid -> integer cents owed
  totalCents: number;
  subtotalCents: number;
  memberSubtotals: Record<string, number>;
  taxAllocations: Record<string, number>;
  tipAllocations: Record<string, number>;
}

/**
 * Calculates mathematically exact proportional tax & tip allocations based on claimed receipt items.
 * Guaranteed integer cent exact sum invariant.
 */
export function calculateProportionalReceiptSplits(
  items: ReceiptItem[],
  taxCents: number,
  tipCents: number,
  allMemberUids: string[]
): ProportionalSplitResult {
  const memberSubtotals: Record<string, number> = {};
  const taxAllocations: Record<string, number> = {};
  const tipAllocations: Record<string, number> = {};
  const splits: Record<string, number> = {};

  // Initialize for all group members
  for (const uid of allMemberUids) {
    memberSubtotals[uid] = 0;
    taxAllocations[uid] = 0;
    tipAllocations[uid] = 0;
    splits[uid] = 0;
  }

  // 1. Calculate base items subtotal per member
  let calculatedSubtotal = 0;

  for (const item of items) {
    calculatedSubtotal += item.priceCents;
    const claimerCount = item.claimedBy.length;
    if (claimerCount === 0) continue; // Unclaimed items remain unallocated

    const basePerClaimer = Math.floor(item.priceCents / claimerCount);
    let remainder = item.priceCents % claimerCount;

    for (const uid of item.claimedBy) {
      const extra = remainder > 0 ? 1 : 0;
      const share = basePerClaimer + extra;
      memberSubtotals[uid] = (memberSubtotals[uid] || 0) + share;
      if (remainder > 0) remainder--;
    }
  }

  const totalAllocatedSubtotal = Object.values(memberSubtotals).reduce((sum, v) => sum + v, 0);

  // If no items were claimed, return equal distribution of total
  const totalCents = calculatedSubtotal + taxCents + tipCents;
  if (totalAllocatedSubtotal === 0) {
    const baseEqual = allMemberUids.length > 0 ? Math.floor(totalCents / allMemberUids.length) : 0;
    let rem = allMemberUids.length > 0 ? totalCents % allMemberUids.length : 0;

    for (const uid of allMemberUids) {
      const addRem = rem > 0 ? 1 : 0;
      splits[uid] = baseEqual + addRem;
      if (rem > 0) rem--;
    }

    return {
      splits,
      totalCents,
      subtotalCents: calculatedSubtotal,
      memberSubtotals,
      taxAllocations,
      tipAllocations
    };
  }

  // 2. Proportionally allocate Tax
  let totalAllocatedTax = 0;
  for (const [uid, subtotal] of Object.entries(memberSubtotals)) {
    if (subtotal > 0 && taxCents > 0) {
      const taxShare = Math.round((taxCents * subtotal) / totalAllocatedSubtotal);
      taxAllocations[uid] = taxShare;
      totalAllocatedTax += taxShare;
    }
  }

  // Adjust tax rounding discrepancy to the top subtotal claimer
  const taxDiff = taxCents - totalAllocatedTax;
  if (taxDiff !== 0) {
    const topUid = Object.entries(memberSubtotals).sort((a, b) => b[1] - a[1])[0][0];
    taxAllocations[topUid] = (taxAllocations[topUid] || 0) + taxDiff;
  }

  // 3. Proportionally allocate Tip
  let totalAllocatedTip = 0;
  for (const [uid, subtotal] of Object.entries(memberSubtotals)) {
    if (subtotal > 0 && tipCents > 0) {
      const tipShare = Math.round((tipCents * subtotal) / totalAllocatedSubtotal);
      tipAllocations[uid] = tipShare;
      totalAllocatedTip += tipShare;
    }
  }

  // Adjust tip rounding discrepancy to top subtotal claimer
  const tipDiff = tipCents - totalAllocatedTip;
  if (tipDiff !== 0) {
    const topUid = Object.entries(memberSubtotals).sort((a, b) => b[1] - a[1])[0][0];
    tipAllocations[topUid] = (tipAllocations[topUid] || 0) + tipDiff;
  }

  // 4. Combine Subtotal + Tax + Tip for each member
  let finalAllocatedSum = 0;
  for (const uid of allMemberUids) {
    const totalMemberOwed = (memberSubtotals[uid] || 0) + (taxAllocations[uid] || 0) + (tipAllocations[uid] || 0);
    splits[uid] = totalMemberOwed;
    finalAllocatedSum += totalMemberOwed;
  }

  // 5. Final invariant guard: Ensure sum of splits matches total claimed sum
  const grandTotalClaimed = totalAllocatedSubtotal + taxCents + tipCents;
  const grandDiff = grandTotalClaimed - finalAllocatedSum;
  if (grandDiff !== 0) {
    const topUid = Object.entries(memberSubtotals).sort((a, b) => b[1] - a[1])[0][0];
    splits[topUid] = (splits[topUid] || 0) + grandDiff;
  }

  return {
    splits,
    totalCents: grandTotalClaimed,
    subtotalCents: calculatedSubtotal,
    memberSubtotals,
    taxAllocations,
    tipAllocations
  };
}
