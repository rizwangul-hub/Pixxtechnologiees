import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthInput } from './AuthInput';

export function PasswordInput({
  id = 'password',
  label = 'Password',
  placeholder = 'Enter password',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <AuthInput
      id={id}
      label={label}
      type={showPassword ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      required={required}
      icon={Lock}
      autoComplete={autoComplete}
      disabled={disabled}
    >
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-[#04A26F] p-1 rounded transition-colors"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5 text-gray-500" />
        ) : (
          <Eye className="w-5 h-5 text-gray-500" />
        )}
      </button>
    </AuthInput>
  );
}
