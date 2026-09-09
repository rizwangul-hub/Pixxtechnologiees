import React from 'react';
import logoImg from '../../assets/image/logo.png';

export function PixxLogo({ variant = 'dark', className = '', showText = true }) {
  const isDarkBg = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none font-sans ${className}`}>
      {/* BRAND LOGO IMAGE */}
      <img
        src={logoImg}
        alt="PixxTechnologies Logo"
        className="h-9 w-auto object-contain shrink-0 drop-shadow-xs"
      />

      {/* BRAND TEXT */}
      {showText && (
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
      )}
    </div>
  );
}
