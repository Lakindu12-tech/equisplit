import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Group, Expense, User, Debt, UserBalance } from '../types';
import { formatCents, normalizePaidBy } from './debtOptimizer';

/**
 * Generates and downloads a branded PDF Settlement Report.
 */
export function exportGroupPDFReport(
  group: Group,
  expenses: Expense[],
  users: User[],
  simplifiedDebts: Debt[],
  netBalances: Record<string, UserBalance>
): void {
  const doc = new jsPDF();
  const totalSpentCents = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Brand Header
  doc.setFillColor(6, 14, 32); // Emerald Obsidian #060e20
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(52, 211, 153); // Emerald-400
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EquiSplit', 14, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Commercial Expense Settlement & Cash-Flow Report', 14, 28);

  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${dateStr}`, 150, 28);

  // Group Meta Summary Box
  let yPos = 48;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Group: ${group.name}`, 14, yPos);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Base Currency: ${group.currency}  |  Total Spent: ${formatCents(totalSpentCents, group.currency)}  |  Total Expenses: ${expenses.length}`, 14, yPos + 6);

  yPos += 16;

  // 1. Simplified Settlement Instructions Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('1. Optimized Settlement Cash-Flows (Fewest Transfers)', 14, yPos);

  const settlementRows = simplifiedDebts.length === 0
    ? [['All balances are fully settled! No payments required.', '', '']]
    : simplifiedDebts.map((debt, i) => {
        const fromUser = users.find(u => u.uid === debt.from)?.displayName || debt.from;
        const toUser = users.find(u => u.uid === debt.to)?.displayName || debt.to;
        return [
          `Step ${i + 1}: ${fromUser}`,
          `pays ${toUser}`,
          formatCents(debt.amount, group.currency)
        ];
      });

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Debtor', 'Action', 'Amount']],
    body: settlementRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // 2. Member Balances Table
  yPos = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('2. Member Contributions & Balances', 14, yPos);

  const memberRows = group.members.map(uid => {
    const user = users.find(u => u.uid === uid);
    const bal = netBalances[uid] || { totalPaid: 0, totalOwed: 0, netBalance: 0 };
    const netFormatted = formatCents(bal.netBalance, group.currency);
    return [
      user?.displayName || uid,
      formatCents(bal.totalPaid, group.currency),
      formatCents(bal.totalOwed, group.currency),
      netFormatted
    ];
  });

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Member', 'Total Paid', 'Total Share', 'Net Status']],
    body: memberRows,
    theme: 'striped',
    headStyles: { fillColor: [6, 14, 32], textColor: [52, 211, 153], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // 3. Detailed Expense Ledger Table
  yPos = (doc as any).lastAutoTable.finalY + 12;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('3. Expense Ledger', 14, yPos);

  const expenseRows = expenses.map(exp => {
    const paidBy = normalizePaidBy(exp);
    const payerNames = Object.entries(paidBy)
      .map(([pUid, pAmt]) => {
        const uName = users.find(u => u.uid === pUid)?.displayName || 'Member';
        return Object.keys(paidBy).length > 1 
          ? `${uName} (${formatCents(pAmt, group.currency)})` 
          : uName;
      })
      .join(', ');

    return [
      exp.date,
      exp.title,
      exp.category.toUpperCase(),
      payerNames,
      formatCents(exp.amount, group.currency)
    ];
  });

  autoTable(doc, {
    startY: yPos + 4,
    head: [['Date', 'Description', 'Category', 'Paid By', 'Total']],
    body: expenseRows,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // Save PDF
  const filename = `${group.name.replace(/\s+/g, '_')}_Settlement_Report.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads a CSV export of group transactions.
 */
export function exportGroupCSVReport(
  group: Group,
  expenses: Expense[],
  users: User[]
): void {
  const headers = ['Date', 'Description', 'Category', 'Total Amount', 'Currency', 'Paid By', 'Split Details', 'Notes'];
  
  const rows = expenses.map(exp => {
    const paidBy = normalizePaidBy(exp);
    const payersStr = Object.entries(paidBy)
      .map(([pUid, pAmt]) => {
        const name = users.find(u => u.uid === pUid)?.displayName || pUid;
        return `${name}: ${pAmt / 100}`;
      })
      .join('; ');

    const splitsStr = Object.entries(exp.splits)
      .map(([dUid, dAmt]) => {
        const name = users.find(u => u.uid === dUid)?.displayName || dUid;
        return `${name}: ${dAmt / 100}`;
      })
      .join('; ');

    return [
      `"${exp.date}"`,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      (exp.amount / 100).toFixed(2),
      `"${group.currency}"`,
      `"${payersStr.replace(/"/g, '""')}"`,
      `"${splitsStr.replace(/"/g, '""')}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_Expenses.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
