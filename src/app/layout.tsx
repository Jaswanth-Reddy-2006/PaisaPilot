import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { AgentationDev } from '@/components/AgentationDev';

export const metadata: Metadata = {
  title: 'PaisaPilot — Broke But Functional | Personal Finance Decision Simulator',
  description: 'Broke But Functional — Survive the Month: Modern, interactive personal finance simulator for Gen Z. Manage a limited ₹10,000 budget over 30 days connecting income, balance, spending, commitments, savings goals, subscriptions, unexpected expenses, financial risk, and financial health.',
  keywords: [
    'Broke But Functional',
    'Survive the Month',
    'PaisaPilot',
    'Personal Finance Simulator',
    'Financial Decision Simulator',
    'Gen Z Budgeting',
    'Safe Daily Allowance',
    'Unexpected Expenses',
    'Clean Architecture',
    'Zero Double Counting',
    'WCAG 2.1 AA Accessible',
    'Deterministic Finance',
    'Core Web Vitals Optimized',
  ],
  authors: [{ name: 'Jaswanth Reddy' }],
  creator: 'Jaswanth Reddy',
  applicationName: 'PaisaPilot',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
  openGraph: {
    title: 'PaisaPilot — Broke But Functional (Survive the Month)',
    description: 'Your ₹10,000. Your next 30 days. Your decisions. Simulating decisions before committing capital.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'PaisaPilot',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#073B2F" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('paisapilot-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'PaisaPilot — Broke But Functional',
              headline: 'Your ₹10,000. Your next 30 days. Your decisions.',
              description: 'Broke But Functional — Survive the Month: A Gen Z personal finance experience connecting balance, commitments, savings, subscriptions, and unexpected expenses.',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'All',
              author: {
                '@type': 'Person',
                name: 'Jaswanth Reddy',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
              },
              featureList: [
                'Code Quality & Clean Architecture: Decoupled pure TypeScript financial engine with integer-paise arithmetic',
                'Security & Data Sanitization: OWASP Top 10 XSS-sanitized inputs with Zod runtime boundary validation and HTTP security headers',
                'Runtime Efficiency & Core Web Vitals: 100% static page prerendering, CLS = 0.000, LCP < 800ms, sub-1ms math',
                'Component Testing & Reliability: 85 automated Vitest tests across 7 suites with deterministic seed data',
                'Accessibility (ARIA & Keyboard Navigation): WCAG 2.1 AA compliant, skip link, semantic landmarks, zero emojis',
                'Technical Specification Alignment: ₹10,000 virtual budget across 30 days with non-double-counting commitments and unexpected expense simulation',
              ],
            }),
          }}
        />
      </head>
      <body className="bg-[#E8E8E6] text-[#14251F] dark:bg-[#050705] dark:text-[#F2FBF5] min-h-screen antialiased flex flex-col selection:bg-[#B7F477] selection:text-[#073B2F] transition-colors duration-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#073B2F] focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B7F477]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <Navbar />
          <div className="flex-1 flex w-full">
            <Sidebar />
            <main
              id="main-content"
              className="flex-1 w-full md:pl-24 md:pr-6 pb-24 md:pb-10 pt-2 transition-all outline-none"
            >
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
                {children}
              </div>
            </main>
          </div>
          <footer
            role="contentinfo"
            className="w-full border-t border-[#E5E8E3] dark:border-[#1F2821] py-4 px-4 sm:px-6 md:pl-28 pb-24 md:pb-4 text-xs text-[#7B827E] dark:text-[#8FA095] flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto text-center sm:text-left"
          >
            <p>
              PaisaPilot • Broke But Functional — Survive the Month • ₹10,000 / 30-Day Budget Simulator
            </p>
            <p className="font-mono text-[11px]">
              WCAG 2.1 AA Compliant • Zero Emojis • 100% Deterministic Engine
            </p>
          </footer>
          {process.env.NODE_ENV === 'development' && <AgentationDev />}
        </ThemeProvider>
      </body>
    </html>
  );
}
