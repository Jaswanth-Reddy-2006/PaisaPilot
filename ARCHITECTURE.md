# PaisaPilot — System Architecture & Technical Design

## 1. Architectural Philosophy

PaisaPilot is architected as a **purely client-deterministic financial simulation system** powered by Next.js 15 App Router, React 19, TypeScript, and Zustand with persistent storage. 

Instead of treating personal finance as a retroactive CRUD ledger (where users merely record expenses after the fact), PaisaPilot treats every financial action as a **future-state simulation**:
- Every interaction calculates the ripple effect across 30 days before committing.
- Financial state mutations are pure, mathematical, and non-blocking.
- The UI layer is cleanly decoupled from the financial calculation engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  (Next.js 15 App Router • React 19 • Tailwind CSS • Lucide Icons)     │
│                                                                        │
│   / (Command Center)       /simulate (Sandbox)    /transactions        │
│   /commitments             /goals (Vault)         /insights (Charts)   │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Reactive Selectors & State Subscriptions
┌─────────────────────────────────▼──────────────────────────────────────┐
│                       STATE MANAGEMENT LAYER                           │
│     Zustand Store (`useFinanceStore`) • `localStorage` Persistence     │
│   • Hydration Barrier Hook (`useHydrated`)                             │
│   • Multi-layer Sanitization & Zod Schema Validation                   │
│   • Immutable Transaction, Commitment, Sub, & Goal Operations          │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Pure State Invocations
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    DETERMINISTIC FINANCIAL ENGINE                      │
│             (`src/lib/finance/calculations.ts` — Pure TS)              │
│                                                                        │
│   • Integer-Paise Precision Engine (1 INR = 100 paise)                 │
│   • Non-Double-Counting Reserved Commitments Calculator                │
│   • Dynamic Safe Daily Allowance Calculator                            │
│   • 30-Day Forward Cashflow Forecast Generator                         │
│   • 4-Tier Risk Diagnostic & 0-100 Financial Health Evaluator          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & Modular Layout

```
PaisaPilot/
├── public/                       # Static public assets, vector logo & favicons
├── src/
│   ├── app/                      # Next.js 15 App Router pages & root layout
│   │   ├── layout.tsx            # Global layout, theme head script & Agentation
│   │   ├── page.tsx              # Financial Command Center dashboard
│   │   ├── globals.css           # Design tokens, CSS variables, dark theme utilities
│   │   ├── commitments/page.tsx  # Bills & active subscriptions tracker
│   │   ├── goals/page.tsx        # Savings Vault with pacing metrics
│   │   ├── insights/page.tsx     # 30-day forecast curves & spending velocity
│   │   ├── simulate/page.tsx     # Decision Sandbox with side-by-side delta preview
│   │   └── transactions/page.tsx # Ledger with search, filtering & analytics
│   ├── components/               # Atomic & composite UI components
│   │   ├── AgentationDev.tsx     # Dynamic client developer annotation toolbar
│   │   ├── layout/
│   │   │   ├── Navbar.tsx        # Top navigation pills, day stepper, theme toggle
│   │   │   └── Sidebar.tsx       # Desktop floating rail & mobile navigation bar
│   │   └── ui/
│   │       ├── Cards.tsx         # MetricCard, VirtualCard, ProgressRing, RiskBadge
│   │       ├── CategoryBadge.tsx # Semantic CategoryIcon & CategoryBadge
│   │       └── Logo.tsx          # PaisaPilot brand wordmark & geometry icon
│   ├── context/
│   │   └── ThemeContext.tsx      # Bright/Dark mode provider with persistence
│   ├── hooks/
│   │   └── useHydrated.ts        # Client mount detection & hydration protection
│   ├── lib/
│   │   ├── finance/
│   │   │   ├── calculations.ts   # Core deterministic financial math engine
│   │   │   ├── seed-data.ts      # Seeded Day 8 demo dataset with static deterministic IDs
│   │   │   ├── calculations.test.ts # Core engine unit tests (19 tests)
│   │   │   └── edge-cases.test.ts   # Boundary condition & stress tests (13 tests)
│   │   ├── validation/
│   │   │   ├── sanitize.ts       # XSS stripping & number boundary sanitization
│   │   │   ├── schemas.ts        # Zod runtime validation schemas
│   │   │   ├── schemas.test.ts   # Schema validation tests (7 tests)
│   │   │   └── security.test.ts  # Security & payload injection tests (11 tests)
│   │   └── utils.ts              # Tailwind merge & clsx utility
│   ├── store/
│   │   ├── finance-store.ts      # Zustand root store with JSON local persistence
│   │   └── finance-store.test.ts # State transitions & non-mutating tests (8 tests)
│   └── types/
│       └── finance.ts            # Complete domain TypeScript types & interfaces
├── ARCHITECTURE.md               # Technical architecture & design documentation
├── SPECIFICATION.md              # Technical specification alignment matrix
├── CONTRIBUTING.md               # Development & test contribution guidelines
├── README.md                     # Comprehensive product guide
└── vitest.config.ts              # Vitest test runner configuration
```

---

## 3. Mathematical Principles & Determinism

### 3.1. Integer-Paise Precision

All monetary amounts are strictly maintained in **integer paise** ($1\text{ INR} = 100\text{ paise}$).
- Prevents IEEE-754 floating-point inaccuracies (e.g., $0.1 + 0.2 = 0.30000000000000004$).
- Conversion functions:
  $$\text{rupeesToPaise}(\text{inr}) = \text{round}(\text{inr} \times 100)$$
  $$\text{paiseToRupees}(\text{paise}) = \frac{\text{paise}}{100}$$
- Formatted using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

### 3.2. The Non-Double-Counting Invariant

In standard accounting tools, users frequently double-count upcoming expenses: they mentally subtract upcoming rent, but their balance still shows the unreserved cash. Alternatively, if they subtract it immediately, their current cash count is factually incorrect.

PaisaPilot solves this with a strict separation between:
1. **Current Cash**: Actual liquid money available in hand:
   $$\text{Current Cash} = \text{Total Income} - \text{Total Settled Expenses}$$
2. **Reserved Commitments**: The exact sum of obligations falling between `currentDay` and `totalDays` (Day 30):
   $$\text{Reserved} = \sum_{\substack{c \in \text{commitments} \\ c.\text{dueDay} \ge \text{currentDay} \\ c.\text{status} = \text{upcoming}}} c.\text{amount} + \sum_{\substack{s \in \text{subscriptions} \\ s.\text{isActive} \land \neg s.\text{isPaused} \\ s.\text{billingDay} \ge \text{currentDay}}} s.\text{amount}$$
3. **Spendable Balance**: Unencumbered cash available for discretionary use:
   $$\text{Spendable Balance} = \max(0, \text{Current Cash} - \text{Reserved Commitments})$$

### 3.3. Dynamic Safe Daily Allowance

Safe spending capacity recalculates continuously based on the remaining days in the simulation horizon:
$$\text{Safe Daily Allowance} = \begin{cases} \lfloor \frac{\text{Spendable Balance}}{\text{Total Days} - \text{Current Day}} \rfloor & \text{if Remaining Days} > 0 \land \text{Spendable Balance} > 0 \\ 0 & \text{otherwise} \end{cases}$$

### 3.4. 30-Day Forward Cashflow Projection

The forecast engine constructs a day-by-day trajectory through Day 30:
- **Days $1 \dots \text{currentDay}$**: Evaluated using historical transaction records.
- **Days $(\text{currentDay} + 1) \dots 30$**: Projected forward by deducting scheduled commitments due on each day, recurring subscriptions on their billing dates, and the user's historical average daily spend.

---

## 4. State Management & Hydration Architecture

In Next.js App Router applications, client components hydrated from `localStorage` often trigger React hydration mismatch errors because the server renders HTML using default seed state while the client mounts with user-modified browser state.

PaisaPilot eliminates hydration mismatches using a three-tier architecture:

1. **Deterministic Static Seed Data**:
   All seed transactions, commitments, subscriptions, and goals use fixed, predictable IDs (`tx-seed-1` through `tx-seed-9`, `com-seed-1` through `com-seed-3`, etc.). This eliminates sort-order nondeterminism between Node SSR and browser hydration.

2. **The `useHydrated` Guard**:
   Pages check `const isHydrated = useHydrated()`:
   - During SSR and the initial client frame, components render the deterministic seed baseline.
   - Upon client mount, `isHydrated` switches to `true`, cleanly updating state from `localStorage` without React hierarchy mismatch errors.

3. **Synchronous Anti-Flash Script**:
   An inline script in `<head>` checks `localStorage.getItem('paisapilot-theme')` before the body renders, immediately toggling `.dark` on `document.documentElement` to eliminate visual flashing.

---

## 5. Security & Data Integrity

1. **Data Sanitization**:
   All user-supplied text (transaction descriptions, goal titles, decision notes) is sanitized via `sanitizeText()` in `src/lib/validation/sanitize.ts`, removing HTML/script angle brackets (`<`, `>`) and enforcing maximum character bounds (150 chars).
2. **Zod Runtime Schema Validation**:
   `TransactionInputSchema`, `DecisionInputSchema`, `CommitmentInputSchema`, and `SavingsGoalInputSchema` enforce positive integers, day ranges between 1 and 30, and valid category enums.
3. **Numeric Clamping**:
   Amounts are bounded between ₹1 and ₹1,000,000 (100 to 100,000,000 paise) to prevent integer overflows or unexpected floating-point precision loss.
4. **Resilient Error Recovery**:
   If `localStorage` data is corrupted or tampered with, the store gracefully resets to clean seed data without throwing unhandled exceptions.
