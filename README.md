# EquiSplit 🇱🇰 🌸

> **Intelligent Group Expense Sharing, Deterministic Debt Simplification & Cross-Platform Mobile Engine**  
> Built with React 18, TypeScript, Tailwind CSS, Capacitor (Android & iOS), Firebase (Firestore, Auth, Hosting), and the Minimum Cash Flow optimization engine.

🔗 **Live Production Web App**: [https://new-project-f9748.web.app](https://new-project-f9748.web.app)  
📱 **Android APK**: Standalone debug build available via `./scripts/deploy-android.ps1` or `./gradlew assembleDebug`

---

## 💎 Features

- **Cross-Platform Mobile Support**:
  - **Android (Native APK)**: Full Capacitor Android integration with hardware back button handling, status bar theming, and 1-command USB debugging deployment.
  - **iOS (PWA & Xcode)**: Offline-first Progressive Web App (PWA) with standalone full-screen support on Safari, plus a native Xcode workspace in `ios/App`.
  - **Mobile Ergonomics**: Full safe-area-inset bounds (iOS notch/dynamic island and Android gesture bar) and touch-first 48px interactive targets.
- **Deterministic Debt Optimization**:
  - Minimum Cash Flow greedy bipartite algorithm reducing settlement transfers from $O(N^2)$ to at most $N-1$ direct transactions.
- **Integer-Cent Math Precision**:
  - Zero floating-point rounding errors ($0.1 + 0.2 \neq 0.3$ eliminated) by storing and calculating all monetary values in integer cents with deterministic remainder distribution.
- **Multi-Payer & Multi-Mode Splitting**:
  - Support for multiple contributors funding a single bill.
  - Split strategies: **Equal** (with exact remainder distribution), **Exact** (cents), **Percentage** (100% sum verified), and **Shares** (ratio-based).
- **Proportional Receipt Itemization & OCR**:
  - Client-side receipt image text extraction powered by Tesseract.js.
  - Mathematically exact proportional tax and tip allocation across claimed receipt items.
- **Bank Statement CSV Import**:
  - Parse bank CSV exports and auto-categorize transactions into group expenses.
- **Multi-Currency & Sri Lanka LKR Localization**:
  - First-class Sri Lankan Rupee (`Rs. 1,500.00`) support with comma-separated formatting.
  - Real-time exchange rate conversion for USD, EUR, GBP, JPY, CAD, AUD, and INR via Open Exchange Rates API.
- **Real-Time Firestore Sync & Offline Persistence**:
  - Multi-tab IndexedDB cache persistence with real-time `onSnapshot` listeners.
  - Append-only immutable audit trail and customizable budget thresholds.

---

## 🏗️ Architecture & Project Structure

```text
equisplit/
├── android/                      # Native Android Capacitor Project (Gradle)
│   ├── app/                      # Android application module & manifest
│   ├── build.gradle              # Project build configuration
│   └── gradlew.bat               # Gradle wrapper script
├── ios/                          # Native iOS Capacitor Project (Xcode)
│   └── App/                      # Xcode workspace & Swift packages
├── public/                       # Static PWA icons, manifest & assets
├── scripts/                      # Deployment & utility automation
│   ├── deploy-android.ps1        # 1-command build, assemble APK & ADB deployment
│   └── generateIcons.ts          # Playwright icon renderer
├── src/
│   ├── components/               # Domain-driven React components
│   │   ├── activity/             # Audit log drawer & history
│   │   ├── analytics/            # Category breakdown & spending charts
│   │   ├── auth/                 # Authentication modals & profile drawer
│   │   ├── bank/                 # Bank statement CSV import modal
│   │   ├── budget/               # Budget overview & limits configuration
│   │   ├── common/               # CategoryIcon & SpatialCard UI primitives
│   │   ├── dashboard/            # Hero balance cards, SmartAddBar & activity feed
│   │   ├── invites/              # QR code & WhatsApp group invite modals
│   │   ├── layout/               # Top Navbar & Mobile BottomNav dock
│   │   ├── ledger/               # Settle Up ledger & debts optimizer
│   │   ├── modals/               # AddExpense, EditExpense & CreateGroup modals
│   │   ├── pwa/                  # PWA update prompts
│   │   ├── receipts/             # Line-item OCR splitter & receipt photo viewer
│   │   └── index.ts              # Unified component export
│   ├── constants/                # Expense categories & metadata
│   ├── context/                  # AppContext state & math hooks
│   ├── hooks/                    # useCapacitor native lifecycle hook
│   ├── lib/                      # Firebase initialization & Currency FX
│   ├── services/                 # Firestore DataStore & sync layer
│   ├── types/                    # TypeScript data models & cent-based schemas
│   ├── utils/                    # Algorithmic engines (debt, receipts, NLP, OCR)
│   ├── App.tsx                   # Main layout container & tab routing
│   ├── main.tsx                  # React DOM entrypoint
│   └── index.css                 # Obsidian Emerald Glass design tokens
├── tests/
│   ├── unit/                     # Algorithmic & mathematical unit tests
│   │   ├── debtOptimizer.test.ts # Transitive & circular debt elimination tests
│   │   ├── multiPayer.test.ts    # Multi-payer split & NLP parser tests
│   │   └── receiptMath.test.ts   # Proportional tax & tip allocation tests
│   └── e2e/                      # Playwright end-to-end browser flows
│       ├── concurrentSync.test.ts# Multi-context real-time sync verification
│       ├── multiPayerE2E.test.ts # Multi-payer UI end-to-end test
│       └── v4E2E.test.ts         # Full user lifecycle journey test
├── docs/                         # Project documentation & screenshots
│   └── screenshots/              # UI captures & demo assets
├── capacitor.config.ts           # Capacitor mobile runtime configuration
├── firebase.json                 # Firebase Hosting & Firestore rules config
├── firestore.rules               # Production Firestore security rules
└── package.json                  # Dependencies & script runner
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- (Optional for Android builds): Android Studio with SDK (API 34+) and Java 17/21/JBR

### 1. Installation

```bash
git clone https://github.com/Lakindu12-tech/equisplit.git
cd equisplit
npm install
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Fill in your Firebase credentials in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **Firebase Auth Setup Note**: In the Firebase Console (**Authentication** -> **Settings** -> **Authorized Domains**), ensure `localhost` is listed to allow logins from the Capacitor mobile WebView origin.

### 3. Local Development

```bash
# Run web development server
npm run dev

# Or expose on local network for phone testing
npm run dev -- --host
```

---

## 🧪 Testing

```bash
# Run pure algorithmic unit tests (debt optimizer, multi-payer, receipt math)
npm test

# Run Playwright end-to-end browser tests
npm run test:e2e
```

---

## 📱 Mobile Deployment

### Android Build & USB Debugging

Run the automated deployment script from PowerShell:

```powershell
# Full pipeline: Web build -> Capacitor sync -> Assemble Debug APK -> ADB install & launch
.\scripts\deploy-android.ps1

# Or deploy an already-built APK directly to a connected phone:
.\scripts\deploy-android.ps1 -InstallOnly
```

The compiled APK will be located at:
- `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS Deployment

- **Instant PWA**: Open the deployed URL in Safari on your iPhone, tap **Share**, and select **"Add to Home Screen"**.
- **Native Xcode Build**: Open `ios/App/App.xcworkspace` in Xcode on macOS, select your device or simulator, and click **Run**.

---

## 🌐 Cloud Deployment (Firebase)

Deploy web assets and Firestore security rules to Firebase:

```bash
# Build production bundle
npm run build

# Deploy Hosting & Firestore rules
npx firebase deploy --only hosting,firestore:rules
```

---

## 🛡️ Security & Privacy

- **No Hardcoded Secrets**: All API keys and environment configurations are loaded via environment variables and ignored by `.gitignore`.
- **Firebase Security Rules**: Granular, authenticated role-based rules protecting `/users`, `/groups`, `/expenses`, and `/audit_logs`.
- **Client-Side Image Processing**: Receipts are compressed and parsed directly in the browser via Canvas API and Tesseract.js.

---

## 📜 License

Apache-2.0 License.
