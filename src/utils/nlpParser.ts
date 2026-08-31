import { User, Category, SmartAddDraft } from '../types';
import { calculateEqualSplits } from './debtOptimizer';

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  food: ['dinner', 'lunch', 'breakfast', 'pizza', 'burger', 'restaurant', 'cafe', 'coffee', 'tea', 'kottu', 'snack', 'bar', 'beer', 'drinks', 'food'],
  transport: ['uber', 'pickme', 'taxi', 'petrol', 'diesel', 'fuel', 'bus', 'train', 'flight', 'highway', 'toll', 'parking', 'transport', 'cab'],
  lodging: ['hotel', 'villa', 'airbnb', 'room', 'resort', 'stay', 'bungalow', 'lodging', 'rent'],
  groceries: ['keells', 'cargills', 'supermarket', 'market', 'groceries', 'vegetables', 'meat', 'milk', 'bread', 'arpico', 'spar'],
  entertainment: ['movie', 'cinema', 'tickets', 'game', 'bowling', 'party', 'concert', 'club', 'surf', 'safari'],
  utilities: ['electricity', 'water', 'internet', 'dialog', 'mobitel', 'slt', 'wifi', 'bill', 'utilities'],
  general: ['general', 'shopping', 'other', 'misc', 'supplies']
};

/**
 * Smart Natural Language Expense Parser.
 * Converts freeform human text into a structured expense draft.
 */
export function parseNaturalLanguageExpense(
  text: string,
  members: User[],
  currentUserId: string
): SmartAddDraft | null {
  if (!text || text.trim().length === 0) return null;

  const raw = text.trim();

  // 1. Extract Amount
  // Matches: 5000, 5000.50, 5k, Rs. 5000, $5000, 5,000
  const amountRegex = /(?:rs\.?|\$|€|£)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+k)\b/i;
  const amountMatch = raw.match(amountRegex);

  let amountCents = 0;
  let cleanText = raw;

  if (amountMatch) {
    let amtStr = amountMatch[1].toLowerCase().replace(/,/g, '');
    if (amtStr.endsWith('k')) {
      const num = parseFloat(amtStr.replace('k', ''));
      amountCents = Math.round(num * 1000 * 100);
    } else {
      amountCents = Math.round(parseFloat(amtStr) * 100);
    }
    // Remove amount match from text for cleaner title parsing
    cleanText = cleanText.replace(amountMatch[0], ' ');
  }

  if (amountCents <= 0) return null;

  // 2. Identify Payer
  let payerId = currentUserId;
  // Match "paid by [Name]" or "[Name] paid"
  const paidByRegex = /paid\s+by\s+([a-zA-Z\s]+)|([a-zA-Z\s]+)\s+paid/i;
  const payerMatch = cleanText.match(paidByRegex);

  if (payerMatch) {
    const candidateName = (payerMatch[1] || payerMatch[2] || '').trim().toLowerCase();
    const matchedUser = members.find(m => 
      m.displayName.toLowerCase().includes(candidateName) ||
      candidateName.includes(m.displayName.toLowerCase().split(' ')[0])
    );
    if (matchedUser) {
      payerId = matchedUser.uid;
      cleanText = cleanText.replace(payerMatch[0], ' ');
    }
  }

  // 3. Identify Category
  let inferredCategory: Category = 'general';
  const lowerText = raw.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lowerText.includes(k))) {
      inferredCategory = cat as Category;
      break;
    }
  }

  // 4. Identify Target Split Participants (e.g. "with Kamal and Sarah" or default to all)
  let participantUids = members.map(m => m.uid);
  const withRegex = /(?:with|split with|for)\s+([a-zA-Z\s,]+)/i;
  const withMatch = cleanText.match(withRegex);

  if (withMatch) {
    const namesPart = withMatch[1].toLowerCase();
    const specificParticipants = members.filter(m => 
      namesPart.includes(m.displayName.toLowerCase().split(' ')[0])
    );
    if (specificParticipants.length > 0) {
      participantUids = Array.from(new Set([payerId, ...specificParticipants.map(p => p.uid)]));
      cleanText = cleanText.replace(withMatch[0], ' ');
    }
  }

  // 5. Clean Title Description
  let title = cleanText
    .replace(/\s+/g, ' ')
    .replace(/(?:for|with|paid|by|and|split)\b/gi, '')
    .trim();

  if (!title || title.length < 2) {
    title = `${inferredCategory.charAt(0).toUpperCase() + inferredCategory.slice(1)} Expense`;
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // 6. Compute Equal Splits
  const splits = calculateEqualSplits(amountCents, participantUids);

  return {
    title,
    amount: amountCents,
    category: inferredCategory,
    payerId,
    paidBy: { [payerId]: amountCents },
    splits,
    splitType: 'EQUAL',
    participants: participantUids
  };
}
