import React, { useState } from 'react';
import { X, KeyRound, Fingerprint, CheckCircle2, ShieldCheck } from 'lucide-react';

export function PasskeyModal({ isOpen, onClose, onSuccess }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setAuthenticating(false);
    setSuccess(false);
    onClose();
  };

  const handleSimulatePasskey = () => {
    setAuthenticating(true);
    setTimeout(() => {
      setAuthenticating(false);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-6 transition-all relative overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close passkey dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Animation Container */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                success
                  ? 'bg-emerald-100 text-[#00a36f]'
                  : authenticating
                  ? 'bg-emerald-50 text-[#00a36f] animate-pulse'
                  : 'bg-emerald-50 text-[#00a36f]'
              }`}
            >
              {success ? (
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              ) : (
                <Fingerprint className="w-10 h-10 stroke-[1.8] animate-pulse" />
              )}
            </div>
            {!success && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00a36f] text-white flex items-center justify-center shadow-md">
                <KeyRound className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {success ? 'Passkey Verified!' : 'Sign in with Passkey'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xs mx-auto leading-relaxed">
            {success
              ? 'Biometric authentication successful. Logging you into LandlordVision...'
              : authenticating
              ? 'Touch your fingerprint sensor, use Face ID, or insert your security key...'
              : 'Use your saved device passkey (Touch ID, Face ID, Windows Hello, or USB Key) to log in instantly without a password.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {!success && (
            <button
              type="button"
              onClick={handleSimulatePasskey}
              disabled={authenticating}
              className="w-full h-12 rounded-full bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] text-white text-sm font-extrabold uppercase tracking-wide transition-all shadow-md shadow-[#00a36f]/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{authenticating ? 'VERIFYING BIOMETRICS...' : 'USE DEVICE PASSKEY'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            disabled={authenticating}
            className="w-full h-10 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
