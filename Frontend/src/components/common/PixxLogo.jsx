import React from 'react';
import logoImg from '../../assets/image/logo.png';

export function PixxLogo({ variant = 'dark', className = '' }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* BRAND LOGO IMAGE */}
      <img
        src={logoImg}
        alt="PixxTechnologies Logo"
        className="h-11 md:h-13 w-auto object-contain shrink-0 drop-shadow-sm"
      />
    </div>
  );
}
