import { ReceiptItem, ItemizedReceipt } from '../types';

export interface OCRProgressCallback {
  (progress: { status: string; progress: number }): void;
}

/**
 * Parses receipt images using client-side Tesseract.js OCR.
 * Memory Safeguard: Dynamically imported and worker is explicitly terminated in finally block.
 */
export async function parseReceiptWithOCR(
  imageSource: string | File | Blob,
  onProgress?: OCRProgressCallback
): Promise<ItemizedReceipt> {
  // Dynamically import tesseract.js to avoid bloating the initial bundle
  const { createWorker } = await import('tesseract.js');
  
  let worker: any = null;

  try {
    worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (onProgress && m.status) {
          onProgress({ status: m.status, progress: m.progress || 0 });
        }
      }
    });

    const ret = await worker.recognize(imageSource);
    const text = ret.data.text || '';

    return extractItemsFromReceiptText(text);
  } finally {
    // CRITICAL CORRECTION: Strict Web Worker termination to prevent memory leaks
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.warn('Worker terminate error:', err);
      }
    }
  }
}

/**
 * Extracts line items, subtotal, tax, and total from OCR raw text.
 */
export function extractItemsFromReceiptText(rawText: string): ItemizedReceipt {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const items: ReceiptItem[] = [];
  let subtotalCents = 0;
  let taxCents = 0;
  let tipCents = 0;
  let totalCents = 0;

  // Regex to extract price patterns: $12.50, 12.50, 1,250.00, Rs. 1500, 1500
  const priceRegex = /(?:rs\.?|\$|€|£)?\s*([0-9]{1,4}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\d+)\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check for Tax
    if (lower.includes('tax') || lower.includes('vat') || lower.includes('gst')) {
      const match = line.match(priceRegex);
      if (match) {
        const amt = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amt)) taxCents = Math.round(amt * 100);
      }
      continue;
    }

    // Check for Tip / Service Charge
    if (lower.includes('tip') || lower.includes('service') || lower.includes('gratuity')) {
      const match = line.match(priceRegex);
      if (match) {
        const amt = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amt)) tipCents = Math.round(amt * 100);
      }
      continue;
    }

    // Check for Subtotal
    if (lower.includes('subtotal') || lower.includes('sub total') || lower.includes('net total')) {
      const match = line.match(priceRegex);
      if (match) {
        const amt = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amt)) subtotalCents = Math.round(amt * 100);
      }
      continue;
    }

    // Check for Grand Total
    if (lower.startsWith('total') || lower.includes('amount due') || lower.includes('grand total')) {
      const match = line.match(priceRegex);
      if (match) {
        const amt = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amt)) totalCents = Math.round(amt * 100);
      }
      continue;
    }

    // Line Item Detection: Matches "2x Burger 15.00" or "Chicken Rice ... 850.00"
    const match = line.match(priceRegex);
    if (match) {
      const rawPrice = match[1].replace(/,/g, '');
      const price = parseFloat(rawPrice);
      const name = line.replace(match[0], '').trim();

      if (!isNaN(price) && price > 0 && name.length >= 2 && !/^(date|time|table|receipt|invoice|cash|change|card|visa|mastercard)/i.test(name)) {
        const itemPriceCents = Math.round(price * 100);
        items.push({
          id: 'item-' + i + '-' + Math.random().toString(36).substring(2, 6),
          name: name.replace(/^[-*•\d\sx]+\s*/, ''),
          priceCents: itemPriceCents,
          claimedBy: []
        });
      }
    }
  }

  // Fallback defaults if OCR didn't catch specific tax/total
  const itemsSum = items.reduce((s, it) => s + it.priceCents, 0);
  if (subtotalCents === 0) subtotalCents = itemsSum;
  if (totalCents === 0) totalCents = subtotalCents + taxCents + tipCents;

  return {
    items,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents
  };
}
