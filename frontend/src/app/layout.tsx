import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '../lib/context/AppContext';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { DemoBanner } from '../components/layout/DemoBanner';

export const metadata: Metadata = {
  title: 'ThreatNexus — Graph-Powered Threat Intelligence Platform',
  description:
    'Demonstrating cross-session memory retrieval, multi-hop entity reasoning, and explainable cybersecurity investigations.',
};

import { FloatingAssistant } from '../components/chat/FloatingAssistant';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppProvider>
          <DemoBanner />
          <div className="flex flex-1 min-h-[calc(100vh-36px)]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <TopNav />
              <main className="flex-1 flex flex-col overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <FloatingAssistant />
        </AppProvider>
      </body>
    </html>
  );
}
