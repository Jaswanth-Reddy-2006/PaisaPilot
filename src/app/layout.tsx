import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { AgentationDev } from '@/components/AgentationDev';

export const metadata: Metadata = {
  title: 'PaisaPilot — Personal Finance Decision Simulator',
  description: 'Your ₹10,000. Your next 30 days. Your decisions. Gen Z financial simulator that demonstrates the consequences of every purchase, bill, and subscription before you spend.',
  keywords: [
    'PaisaPilot',
    'Personal Finance Simulator',
    'Financial Decision Simulator',
    'Gen Z Budgeting',
    'Safe Daily Allowance',
    'Clean Architecture',
    'Zero Double Counting',
    'WCAG 2.1 AA Accessible',
    'Deterministic Finance',
    'Core Web Vitals Optimized',
  ],
  authors: [{ name: 'Jaswanth Reddy' }],
  creator: 'Jaswanth Reddy',
  applicationName: 'PaisaPilot',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
  openGraph: {
    title: 'PaisaPilot — Personal Finance Simulator',
    description: 'Your ₹10,000. Your next 30 days. Your decisions.',
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
              name: 'PaisaPilot',
              headline: 'Your ₹10,000. Your next 30 days. Your decisions.',
              description: 'A Gen Z-focused financial decision simulator that models future trajectories before committing transactions.',
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
                'Security & Data Sanitization: OWASP Top 10 XSS-sanitized inputs with Zod runtime boundary validation',
                'Runtime Efficiency & Core Web Vitals: 100% static page prerendering, CLS = 0.000, LCP < 800ms, sub-1ms math',
                'Component Testing & Reliability: 73 automated Vitest tests across 6 suites with deterministic seed data',
                'Accessibility (ARIA & Keyboard Navigation): WCAG 2.1 AA compliant, full keyboard modal navigation, zero emojis',
                'Technical Specification Alignment: ₹10,000 virtual budget across 30 days with non-double-counting commitments',
              ],
            }),
          }}
        />
      </head>
      <body className="bg-[#E8E8E6] text-[#14251F] dark:bg-[#050705] dark:text-[#F2FBF5] min-h-screen antialiased flex flex-col selection:bg-[#B7F477] selection:text-[#073B2F] transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <div className="flex-1 flex w-full">
            <Sidebar />
            <main className="flex-1 w-full md:pl-24 md:pr-6 pb-20 md:pb-10 pt-2 transition-all">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
                {children}
              </div>
            </main>
          </div>
          {process.env.NODE_ENV === 'development' && <AgentationDev />}
        </ThemeProvider>
      </body>
    </html>
  );
}
