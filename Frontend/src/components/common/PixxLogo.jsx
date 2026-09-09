import React from 'react';
import { Layers } from 'lucide-react';

export function PixxLogo({ variant = 'dark', className = '' }) {
  const isDarkBg = variant === 'dark'; // For dark header background vs light auth background

  return (
    <div className={`flex items-center gap-2.5 select-none font-sans ${className}`}>
      {/* BRAND ICON BADGE */}
      <div className="w-9 h-9 rounded-xl bg-[#04A26F] text-white flex items-center justify-center shadow-md shadow-[#04A26F]/20 shrink-0">
        <Layers className="w-5 h-5 stroke-[2.5]" />
      </div>

      {/* BRAND TEXT */}
      <div className="flex flex-col text-left leading-none">
        <span
          className={`text-lg font-black tracking-tight ${
            isDarkBg ? 'text-white' : 'text-slate-900'
          }`}
        >
          Pixx<span className="text-[#04A26F]">Tech</span>
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isDarkBg ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Technologies
        </span>
      </div>
    </div>
  );
}
