import React, { useState } from 'react';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased flex flex-col overflow-x-hidden">
      {/* 1. TOP HEADER */}
      <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* 2. MAIN APPLICATION VIEWPORT (SIDEBAR + CONTENT) */}
      <div className="flex-1 w-full flex items-stretch min-h-[calc(100vh-4rem)]">
        {/* PERSISTENT SIDEBAR */}
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* MAIN ROUTE CONTENT VIEWPORT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
