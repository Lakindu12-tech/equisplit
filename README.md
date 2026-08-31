# EquiSplit 🇱🇰 🌸

> **Intelligent Group Expense Sharing & Deterministic Debt Simplification**  
> Built with React 18, TypeScript, Tailwind CSS, Firebase (Firestore, Auth, Hosting), and the Minimum Cash Flow optimization engine.

🔗 **Live Production Demo**: [https://new-project-f9748.web.app](https://new-project-f9748.web.app)

---

## 💎 Features

- **Obsidian Emerald Glassmorphism**: Sleek, high-contrast dark luxury interface designed for precision and elegance.
- **Deterministic Debt Optimization**: Minimum Cash Flow greedy bipartite algorithm that minimizes group settlement transactions from $O(N^2)$ to at most $N-1$ direct transfers.
- **Integer-Cent Math Engine**: Prevents floating-point rounding inaccuracies ($0.1 + 0.2 \neq 0.3$) by storing and calculating all monetary values in integer cents with deterministic remainder distribution.
- **Multi-Mode Expense Splitting**:
  - **Equal**: Fair equal division with exact remainder cent allocation.
  - **Exact**: Custom exact amounts per member with real-time balance delta verification.
  - **Percentage**: Percentage-based distribution with 100% sum validation.
  - **Shares**: Ratio-based allocation (e.g. 2:1:1).
- **Multi-Currency & Sri Lanka LKR Localization**:
  - Full support for Sri Lankan Rupees (`Rs. 1,500.00`) as default.
  - Real-time exchange rate conversion for USD, EUR, GBP, JPY, CAD, AUD, and INR.
- **Expense Categorization & Spending Insights**:
  - 🍔 Food & Drinks, 🚗 Transport, 🏨 Lodging, 🎟️ Entertainment, 🛒 Groceries, 💡 Utilities, 📦 General.
  - Interactive category progress charts and member contribution metrics.
- **Real-Time Firestore Sync**:
  - Firestore `onSnapshot` listeners with scalable `where`, `orderBy('createdAt', 'desc')`, and `limit(100)` queries.
  - Interactive settlement flow with celebratory confetti animations.

---

## 🏗️ Architecture & Project Structure

```text
equisplit/
├── src/
│   ├── components/
│   │   ├── layout/               # Navbar & Mobile BottomNav
│   │   ├── common/               # CategoryIcon & UI badges
│   │   ├── modals/               # AddExpenseModal & CreateGroupModal
│   │   ├── dashboard/            # Dashboard net balance & activity feed
│   │   ├── ledger/               # BalancesLedger & Settle Up modal
│   │   ├── analytics/            # CategoryBreakdown analytics
│   │   └── index.ts              # Unified barrel export
│   ├── constants/                # Categories & sample seeds
│   ├── context/                  # AppContext state & math hooks
│   ├── lib/                      # Firebase & Currency FX helpers
│   ├── services/                 # Firestore DataStore & sync layer
│   ├── types/                    # TypeScript interfaces in cents
│   ├── utils/                    # Minimum Cash Flow algorithm & LKR formatters
│   ├── App.tsx                   # Main container & tab router
│   ├── main.tsx                  # React DOM entrypoint
│   └── index.css                 # Obsidian Emerald Glass design tokens
├── tests/
│   └── debtOptimizer.test.ts     # Algorithmic unit test suite
├── firestore.rules               # Firestore security rules
├── firebase.json                 # Firebase Hosting configuration
└── package.json                  # Dependencies & build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Lakindu12-tech/equisplit.git
cd equisplit

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Run Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## 📜 License

Apache-2.0 License.
