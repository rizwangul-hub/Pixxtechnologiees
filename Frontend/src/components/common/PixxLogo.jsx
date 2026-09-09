import React from 'react';
import logoImg from '../../assets/image/logo.png';
import logo2Img from '../../assets/image/logo2.png';

export function PixxLogo({ variant = 'dark', useDashboardLogo = false, className = '' }) {
  // Use logo.png for login page, logo2.png for dashboard page
  const isDashboard = useDashboardLogo || variant === 'dashboard' || variant === 'dark';
  const currentLogo = isDashboard ? logo2Img : logoImg;

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
        src={currentLogo}
        alt="PixxTechnologies Logo"
        className="h-11 md:h-13 w-auto object-contain shrink-0 drop-shadow-sm animate-rotate-y"
      />
    </div>
  );
}
