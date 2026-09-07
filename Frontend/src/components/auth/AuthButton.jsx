import React from 'react';
import { Loader2 } from 'lucide-react';

export function AuthButton({
  children,
  type = 'submit',
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`
        w-full h-11 px-5 rounded-lg text-sm font-semibold text-white
        bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53]
        shadow-md shadow-[#00a36f]/20 transition-all duration-200
        flex items-center justify-center gap-2 select-none outline-none
        focus:ring-2 focus:ring-[#00a36f] focus:ring-offset-2
        ${
          isButtonDisabled
            ? 'opacity-65 cursor-not-allowed hover:bg-[#00a36f] shadow-none'
            : 'cursor-pointer hover:shadow-lg hover:shadow-[#00a36f]/30 hover:-translate-y-0.5'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
