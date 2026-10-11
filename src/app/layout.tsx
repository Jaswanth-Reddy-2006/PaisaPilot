import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { AgentationDev } from '@/components/AgentationDev';

export const metadata: Metadata = {
  title: 'PaisaPilot — Personal Finance Simulator',
  description: 'Your ₹10,000. Your next 30 days. Your decisions.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
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
