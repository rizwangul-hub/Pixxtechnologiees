import React from 'react';
import logoImg from '../../assets/image/logo.png';

export function PixxLogo({ variant = 'dark', className = '' }) {
  return (
    <div className={`flex items-center select-none ${className}`} style={{ perspective: '1000px' }}>
      <style>{`
        @keyframes rotateYContinuous {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        .animate-rotate-y {
          animation: rotateYContinuous 6s linear infinite;
          transform-style: preserve-3d;
          backface-visibility: visible;
        }
      `}</style>
      {/* BRAND LOGO IMAGE */}
      <img
        src={logoImg}
        alt="PixxTechnologies Logo"
        className="h-11 md:h-13 w-auto object-contain shrink-0 drop-shadow-sm animate-rotate-y"
      />
    </div>
  );
}
