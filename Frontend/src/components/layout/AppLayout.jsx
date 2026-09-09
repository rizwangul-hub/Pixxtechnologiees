import React, { useState } from 'react';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased flex flex-col overflow-hidden">
      {/* 1. TOP HEADER (PINNED AT TOP) */}
      <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* 2. MAIN APPLICATION VIEWPORT (FIXED SIDEBAR + INDEPENDENTLY SCROLLABLE CONTENT) */}
      <div className="flex-1 w-full flex items-stretch overflow-hidden">
        {/* PERSISTENT FIXED SIDEBAR */}
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* MAIN INDEPENDENTLY SCROLLABLE CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
