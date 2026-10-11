# Contributing to PaisaPilot

Thank you for your interest in contributing to **PaisaPilot**!

PaisaPilot is built to demonstrate how personal finance software can shift from retroactive expense tracking to prospective decision simulation.

---

## 1. Development Workflow

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+ (or pnpm / yarn)
- Git

### Installation
```bash
git clone https://github.com/Jaswanth-Reddy-2006/PaisaPilot.git
cd PaisaPilot
npm install --legacy-peer-deps
```

### Running the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Code Quality & Standards

Please adhere to these guidelines to maintain architectural integrity:

1. **Integer-Paise Currency Math**:
   - Never store or perform arithmetic on floating-point rupees.
   - Always store currency in paise (`1 INR = 100 paise`).
   - Use `rupeesToPaise()` and `paiseToRupees()` from `@/lib/finance/calculations`.

2. **Zero Emojis in Interface**:
   - The UI must remain 100% emoji-free.
   - Use Lucide React SVG icons exclusively for all badges, categories, metrics, and actions.

3. **Input Sanitization**:
   - Always run user text input through `sanitizeText()` from `@/lib/validation/sanitize` before committing it to state.
   - Enforce Zod schemas for all input forms.

4. **Accessibility (ARIA & Keyboard Navigation)**:
   - Ensure interactive triggers have explicit `aria-label` attributes where text is omitted.
   - Ensure all dialog modals include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and an Escape key dismissal handler.
   - Verify focus states are clearly visible via `:focus-visible`.

5. **Theme Support**:
   - Maintain compatibility across both **Bright Mode** (Fynix soft off-white & lime) and **Dark Mode** (black & green).
   - Use CSS variables or Tailwind's `dark:` modifier.

---

## 3. Testing & Verification

Before submitting changes, ensure all tests and linters pass:

```bash
# Run Vitest unit & integration test suite (85 tests)
npm test

# Run ESLint validation
npm run lint

# Verify production Next.js compilation
npm run build
```

---

## 4. Submitting Pull Requests

1. Create a feature branch (`git checkout -b feature/my-feature`).
2. Commit your changes with descriptive messages (`git commit -m 'feat: add loan simulation preset'`).
3. Push to your branch (`git push origin feature/my-feature`).
4. Open a Pull Request with a clear description of the problem solved.
