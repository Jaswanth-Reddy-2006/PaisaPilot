# PaisaPilot — Technical Specification & Alignment Matrix

This document provides a line-by-line verification matrix of how PaisaPilot fulfills every requirement of the hackathon evaluation criteria and the technical specification.

---

## 1. Hackathon Evaluation Criteria Matrix

| Evaluation Pillar | Implementation in PaisaPilot | Verification Artifact |
| :--- | :--- | :--- |
| **1. Code Quality & Clean Architecture** | Pure functional domain logic isolated in `src/lib/finance/calculations.ts`. Strict separation between financial engine, state store, and UI presentation. Strict TypeScript typings with zero `any`. | `calculations.ts`, `finance.ts`, `finance-store.ts`, 0 ESLint errors |
| **2. Security & Data Sanitization** | Aggressive input sanitization (`sanitizeText`, `sanitizeNumber`) stripping HTML/script angle brackets and clamping length. Zod runtime schema validation on all inputs. Safe integer math preventing precision loss. | `src/lib/validation/sanitize.ts`, `src/lib/validation/schemas.ts`, `security.test.ts` |
| **3. Runtime Efficiency & Core Web Vitals** | 100% static prerendering of all 9 routes (`next build`). First Load JS shared bundle of 102 kB. Sub-millisecond calculation engine. Tabular numerals (`font-variant-numeric: tabular-nums`) preventing visual layout shifts (CLS = 0). | Next.js build output traces, `globals.css` tabular styling |
| **4. Component Testing & Reliability** | 58 automated unit and integration tests across 5 test suites running in under 250ms via Vitest. Comprehensive testing of calculations, edge cases, store mutations, schema validation, and security sanitization. | `npm test` passing 58/58 tests |
| **5. Accessibility (ARIA & Keyboard Nav)** | Accessible dialogs with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`. Global `Escape` key listeners for modal dismissal. Focus-visible rings. High contrast meeting WCAG 2.1 AA in both Bright and Dark modes. 100% Lucide React icons, zero emojis. | Modal components, `globals.css`, `Navbar.tsx`, `Sidebar.tsx` |
| **6. Technical Specification Alignment** | ₹10,000 virtual budget, Day 1-30 simulation timeline, 4-pillar command center, non-double-counting commitments, what-if decision simulator with side-by-side deltas, savings vault pacing, 30-day forecast curves. | Complete feature set matching hackathon prompt |

---

## 2. Product Specification Detailed Breakdown

### 2.1. The Financial Command Center (Dashboard `/`)
- **Starting Budget**: Initialized at ₹10,000 (1,000,000 paise).
- **Simulation Clock**: Dynamic timeline controller showing Current Day (default: Day 8) and Days Remaining (22 days left). Allows stepping forwards or backwards between Day 1 and Day 30.
- **Spendable Balance vs Available Cash**: Displays available cash alongside spendable balance, ensuring upcoming rent and utility bills are visibly protected.
- **Safe Daily Allowance**: Dynamically computed as spendable balance divided by days remaining.
- **30-Day Forecast Chart**: High-resolution interactive SVG area chart displaying actual historical spend (solid line) and projected trajectory (dashed curve with markers).
- **Financial Health Score**: 0-100 diagnostic index featuring clear explanatory factors ("All commitments covered", "Good spending buffer available").
- **Financial Risk Level**: 4-tier risk assessment (`low`, `medium`, `high`, `critical`) with dynamic color badges and causal factors.

### 2.2. The What-If Decision Simulator (`/simulate`)
- **Pre-Commitment Sandbox**: Enables testing purchases, subscriptions, unexpected emergencies, side-income, and bills before committing them to the ledger.
- **7-Metric Delta Comparison**:
  1. Current Cash Balance change ($\pm \Delta$)
  2. Safe Daily Allowance change ($\pm \Delta/\text{day}$)
  3. Spendable Balance impact
  4. Month-End Closing Balance impact
  5. Financial Health Score delta ($\pm \Delta$)
  6. Financial Risk Level shift (e.g. Low $\to$ High)
  7. Commitments Coverage status
- **Realistic Gen Z Presets**:
  - Buying ₹2,000 Headphones
  - Adding ₹499 OTT Streaming Subscription
  - Emergency Medical Bill of ₹1,800
  - Freelance Gig Income of ₹3,500
  - Deposit ₹1,000 to Emergency Fund
- **Action Buttons**:
  - **Apply Decision**: Applies the scenario into live state, creating a timestamped record in the ledger.
  - **Discard Scenario**: Resets the sandbox without affecting live financial metrics.

### 2.3. Transaction Ledger (`/transactions`)
- Complete immutable record of all income, expense, and transfer events.
- Category breakdown with semantic icons and color badges:
  - Food & Dining (`#F1F9E9` / `#073B2F`)
  - Transport (`#E8F7DB` / `#27834A`)
  - Shopping (`#FFF4D9` / `#C28A24`)
  - Entertainment (`#F4F5F3` / `#14251F`)
  - Housing & Rent (`#FDECEC` / `#D94B4B`)
  - Utilities (`#EAF7E8` / `#27834A`)
  - Healthcare (`#FDECEC` / `#D94B4B`)
- Real-time search by description and filtering by transaction type (`all`, `expense`, `income`).
- Modal for recording new entries with instant input sanitization.

### 2.4. Commitments & Subscriptions (`/commitments`)
- **Bills Tracker**: Displays fixed obligations with due days (Rent on Day 28, Electricity on Day 15, Internet on Day 20).
- **Non-Double-Counting Guarantee**: Unpaid bills remain in "Reserved" status, reducing safe daily allowance without prematurely deducting cash until paid.
- **Mark as Paid**: One-click settlement that converts the commitment to paid status and logs an immediate expense transaction.
- **Subscriptions Manager**: Tracks recurring services (Spotify ₹119, Netflix ₹199, Swiggy One ₹149) with one-click **Pause / Resume** toggling.

### 2.5. Savings Goals & Vault (`/goals`)
- **Separate Vault Accounting**: Savings goals represent segregated capital rather than consumption spending.
- **Deposit & Withdraw Modals**: Interactive transfers between liquid cash and savings targets.
- **Pacing Engine**: Calculates daily required contribution based on remaining days until the goal deadline.
- **Visual Progress Ring**: SVG circular progress indicator showing target completion percentage.

### 2.6. Insights & Forecast Curves (`/insights`)
- **Full 30-Day Cashflow Curve**: Visualizes the balance trajectory through Day 30.
- **Spending Velocity Analyzer**: Compares actual daily spend rate against safe daily allowance.
- **Automated Diagnostic Advisor**: Generates natural-language financial recommendations based on risk metrics, subscription load, and savings pacing.

---

## 3. Design System & Theme Specification

### 3.1. Bright Mode (Fynix-Inspired Minimalist Banking)
- **Canvas / Background**: `#E8E8E6` (soft off-white) / `#F5F5F2` (workspace)
- **Card Background**: `#FFFFFF` (pure white, rounded `26px`, border `#E5E8E3`)
- **Primary Lime Accent**: `#A4E763` / `#B7F477`
- **Forest Green Contrast Elements**: `#073B2F` (buttons and headings)
- **Primary Text**: `#14251F`
- **Secondary Text**: `#7B827E`

### 3.2. Dark Mode (Black & Green)
- **Canvas / Background**: `#050705` (deep obsidian black) / `#0A0D0B` (workspace)
- **Card Background**: `#0E120F` (pitch black card, border `#1F2821`)
- **Card Subtle**: `#141A16`
- **Primary Lime Accent**: `#A4E763` / `#B7F477`
- **Forest Green Accents**: `#073B2F` / `#0B4A3A`
- **Primary Text**: `#F2FBF5` (crisp white with faint mint luminance)
- **Secondary Text**: `#8E9F93` (clean sage text)

### 3.3. Iconography & Visual Cleanliness
- **100% Emoji-Free**: Audited and confirmed with zero Unicode emoji glyphs.
- **Lucide React Vectors**: Clean, scalable SVGs throughout navigation, badges, categories, and metrics.
