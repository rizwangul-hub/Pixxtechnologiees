import React from 'react';
import { PixxLogo } from '../common/PixxLogo';

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-900 antialiased flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6 text-left">
        {/* LOGO HEADER */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center pb-2 border-b border-slate-100">
          <PixxLogo variant="login" className="scale-110" />
          <p className="text-xs font-semibold text-slate-500 pt-1">
            Internal Property & Payment Tracking Portal
          </p>
        </div>

        {/* MAIN FORM */}
        <div className="w-full">{children}</div>

        {/* FOOTER */}
        <div className="text-[11px] font-semibold text-slate-400 text-center pt-2 border-t border-slate-100">
          &copy; {new Date().getFullYear()} Pixx Technologies. Internal System.
        </div>
      </div>
    </div>
  );
}
