import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { AuthButton } from './AuthButton';

export function LoginForm({ isPasskeyMode = false, onTogglePasskeyMode, onOpenPasskeyModal }) {
  const navigate = useNavigate();
  const [systemVersion, setSystemVersion] = useState('current'); // 'current' | 'legacy'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Email format regex
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'email') {
      if (!value.trim()) {
        errorMsg = 'Email address is required';
      } else if (!validateEmail(value)) {
        errorMsg = 'Please enter a valid email address';
      }
    } else if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required';
      }
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));

    if (touched[name]) {
      const errorMsg = validateField(name, val);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const newTouched = { email: true, password: true };
    setTouched(newTouched);

    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);

    const newErrors = {
      email: emailError,
      password: passwordError,
    };

    setErrors(newErrors);

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage({
        type: 'success',
        text: isPasskeyMode
          ? 'Logging in to Landlord Vision...'
          : `Logging in to ${systemVersion === 'legacy' ? 'Legacy' : 'Current'} Landlord Vision...`,
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    }, 800);
  };

  const handlePasskeyClick = () => {
    if (!isPasskeyMode && onTogglePasskeyMode) {
      onTogglePasskeyMode(true);
    }
    if (onOpenPasskeyModal) {
      onOpenPasskeyModal();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full text-left" noValidate>
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#00a36f] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SYSTEM VERSION SELECTOR PILLS - Only rendered when NOT in passkey mode */}
      {!isPasskeyMode && (
        <div className="space-y-3 pb-1">
          {/* 1. Legacy Landlord Vision Option */}
          <button
            type="button"
            onClick={() => setSystemVersion('legacy')}
            className={`
              w-full h-14 rounded-full px-6 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
              ${
                systemVersion === 'legacy'
                  ? 'bg-[#00a36f] text-white shadow-md shadow-[#00a36f]/20'
                  : 'bg-white border-2 border-[#00a36f] text-[#00a36f] hover:bg-emerald-50/60'
              }
            `}
          >
            <span className="text-sm font-extrabold leading-tight">Legacy Landlord Vision</span>
            <span
              className={`text-[11px] font-medium ${
                systemVersion === 'legacy' ? 'text-emerald-100' : 'text-[#00a36f]/80'
              }`}
            >
              (signed up before Sept 2023)
            </span>
          </button>

          {/* 2. Current Landlord Vision Option */}
          <button
            type="button"
            onClick={() => setSystemVersion('current')}
            className={`
              w-full h-14 rounded-full px-6 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
              ${
                systemVersion === 'current'
                  ? 'bg-[#00a36f] text-white shadow-md shadow-[#00a36f]/20'
                  : 'bg-white border-2 border-[#00a36f] text-[#00a36f] hover:bg-emerald-50/60'
              }
            `}
          >
            <span className="text-sm font-extrabold leading-tight">Current Landlord Vision</span>
            <span
              className={`text-[11px] font-medium ${
                systemVersion === 'current' ? 'text-emerald-100' : 'text-[#00a36f]/80'
              }`}
            >
              (signed up after Sept 2023)
            </span>
          </button>
        </div>
      )}

      {/* Email Field */}
      <AuthInput
        id="email"
        label={isPasskeyMode ? '' : 'Email address'}
        type="email"
        placeholder={isPasskeyMode ? 'Email *' : 'Enter email address *'}
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        required
        icon={isPasskeyMode ? null : Mail}
        autoComplete="email"
        disabled={isLoading}
      />

      {/* Password Field */}
      <div className="flex flex-col gap-1">
        <PasswordInput
          id="password"
          label={isPasskeyMode ? '' : 'Password'}
          placeholder={isPasskeyMode ? 'Password *' : 'Enter password *'}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-[#00a36f] focus:ring-[#00a36f] accent-[#00a36f] cursor-pointer"
            />
            <span className="text-xs font-medium text-gray-600">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Forgot password flow can be connected once backend reset endpoints are ready.');
            }}
            className="text-xs font-bold text-gray-800 hover:text-[#00a36f] transition-colors"
          >
            {isPasskeyMode ? 'Forgot your password?' : 'Forgot Password?'}
          </Link>
        </div>
      </div>

      {/* Primary Submit Button: LOG IN */}
      <div className="pt-2">
        <AuthButton
          isLoading={isLoading}
          disabled={isLoading}
          className="rounded-full tracking-wide uppercase font-extrabold text-base h-12"
        >
          LOG IN
        </AuthButton>
      </div>

      {/* Divider: OR */}
      <div className="relative flex items-center justify-center my-1">
        <div className="w-full border-t border-gray-200" />
        <span className="absolute bg-white px-3 text-xs font-bold text-gray-400">
          OR
        </span>
      </div>

      {/* Secondary Button: LOG IN WITH PASSKEY */}
      <div>
        <button
          type="button"
          onClick={handlePasskeyClick}
          disabled={isLoading}
          className="w-full h-12 rounded-full border-2 border-[#00a36f] text-[#00a36f] hover:bg-emerald-50 font-extrabold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer outline-none focus:ring-2 focus:ring-[#00a36f] focus:ring-offset-2"
        >
          <KeyRound className="w-4 h-4 text-[#00a36f]" />
          <span>LOG IN WITH PASSKEY</span>
        </button>
      </div>

      {/* Bottom link text in Passkey Mode matching media_1788781561143.png */}
      {isPasskeyMode ? (
        <div className="pt-4 text-center space-y-2">
          <p className="text-xs font-medium text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#00a36f] hover:text-[#008f61] underline"
            >
              Click to register
            </Link>
          </p>

          <button
            type="button"
            onClick={() => onTogglePasskeyMode && onTogglePasskeyMode(false)}
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto transition-colors pt-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Switch to standard login with system version selection</span>
          </button>
        </div>
      ) : null}
    </form>
  );
}
