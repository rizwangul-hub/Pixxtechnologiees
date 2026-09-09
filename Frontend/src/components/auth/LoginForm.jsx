import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { AuthButton } from './AuthButton';
import { useAuth } from '../../context/AuthContext';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);

      setStatusMessage({
        type: 'success',
        text: 'Authenticated! Accessing PixxTechnologies Internal Portal...',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      console.error('[Login Form Error]', err.message);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full text-left" noValidate>
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#04A26F] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Email Field */}
      <AuthInput
        id="email"
        label="Email Address"
        type="email"
        placeholder="Enter manager email *"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        required
        icon={Mail}
        autoComplete="email"
        disabled={isLoading}
      />

      {/* Password Field */}
      <div className="flex flex-col gap-1">
        <PasswordInput
          id="password"
          label="Password"
          placeholder="Enter password *"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />

        {/* Remember Me Row */}
        <div className="flex items-center justify-between pt-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 rounded border-slate-300 text-[#04A26F] focus:ring-[#04A26F] accent-[#04A26F] cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-600">Remember me</span>
          </label>
        </div>
      </div>

      {/* Primary Submit Button: LOG IN */}
      <div className="pt-3">
        <AuthButton
          isLoading={isLoading}
          disabled={isLoading}
          className="rounded-xl tracking-wide uppercase font-extrabold text-sm h-12 bg-[#04A26F] hover:bg-[#038b5e] shadow-md"
        >
          <Lock className="w-4 h-4 mr-2" />
          LOG IN
        </AuthButton>
      </div>
    </form>
  );
}
