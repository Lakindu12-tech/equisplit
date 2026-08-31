import Papa from 'papaparse';
import { BankTransaction, Category, User } from '../types';
import { parseNaturalLanguageExpense } from './nlpParser';

/**
 * Parses bank statement CSV files and extracts structured expense transactions.
 */
export function parseBankStatementCSV(
  csvFile: File | string,
  members: User[],
  currentUserId: string
): Promise<BankTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, any>[];
          const transactions: BankTransaction[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Find Description column (handles Description, Narration, Details, Remarks, Memo)
            const descKey = Object.keys(row).find(k => 
              /desc|narrat|detail|remark|memo|merchant|payee/i.test(k)
            );
            const desc = descKey ? String(row[descKey] || '').trim() : '';

            // Find Amount column (Debit, Amount, Withdrawal)
            const amountKey = Object.keys(row).find(k => 
              /amount|debit|withdrawal|spent/i.test(k)
            );
            const rawAmount = amountKey ? String(row[amountKey] || '').replace(/[^0-9.-]/g, '') : '0';
            const parsedNum = Math.abs(parseFloat(rawAmount) || 0);

            // Find Date column
            const dateKey = Object.keys(row).find(k => /date|time/i.test(k));
            const rawDate = dateKey ? String(row[dateKey] || '').trim() : '';
            const formattedDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

            if (parsedNum > 0 && desc.length >= 2) {
              const amountCents = Math.round(parsedNum * 100);

              // Use existing NLP engine to infer category & clean name
              const nlpDraft = parseNaturalLanguageExpense(desc, members, currentUserId);
              const category: Category = nlpDraft?.category || 'general';
              const cleanTitle = nlpDraft?.title || desc;

              transactions.push({
                id: 'bank-txn-' + i + '-' + Math.random().toString(36).substring(2, 6),
                date: isNaN(new Date(formattedDate).getTime()) ? new Date().toISOString().split('T')[0] : formattedDate,
                description: cleanTitle,
                amountCents,
                category,
                rawText: desc
              });
            }
          }

          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
