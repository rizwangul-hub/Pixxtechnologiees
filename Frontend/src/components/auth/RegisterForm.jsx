import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, CheckCircle2, AlertCircle, Pencil, Tag } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { AuthButton } from './AuthButton';
import { EditPricingModal } from './EditPricingModal';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    optOutMarketing: false,
    couponCode: '',
  });

  // Active Plan State (Synced with EditPricingModal)
  const [activePlan, setActivePlan] = useState({
    id: 'premium',
    name: 'Premium',
    price: '39.97',
    billingCycle: 'yearly',
    tenancies: 15,
    extraTenancyPrice: 1.30,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
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

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          errorMsg = 'Full name is required';
        } else if (value.trim().length < 2) {
          errorMsg = 'Full name must be at least 2 characters';
        }
        break;
      case 'email':
        if (!value.trim()) {
          errorMsg = 'Email address is required';
        } else if (!validateEmail(value)) {
          errorMsg = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errorMsg = 'Phone number is required';
        } else if (!/^[0-9+\-\s()]{7,15}$/.test(value.trim())) {
          errorMsg = 'Please enter a valid phone number';
        }
        break;
      case 'password':
        if (!value) {
          errorMsg = 'Password is required';
        } else if (value.length < 8) {
          errorMsg = 'Password must be at least 8 characters long';
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    const newFormData = { ...formData, [name]: val };
    setFormData(newFormData);

    if (touched[name]) {
      const errorMsg = validateField(name, val);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, val);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (formData.couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const newTouched = {
      fullName: true,
      email: true,
      phone: true,
      password: true,
    };
    setTouched(newTouched);

    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      password: validateField('password', formData.password),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => Boolean(err))) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage({
        type: 'success',
        text: `Free trial for ${activePlan.name} plan validated! Redirecting...`,
      });
    }, 1200);
  };

  // Top accent bar color based on plan
  const getPlanAccentColor = () => {
    switch (activePlan.id) {
      case 'starter':
        return 'bg-amber-400';
      case 'standard':
        return 'bg-orange-500';
      case 'enterprise':
        return 'bg-blue-600';
      case 'premium':
      default:
        return 'bg-[#f43f5e]';
    }
  };

  return (
    <>
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

        {/* DYNAMIC PLAN SUMMARY CARD */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden transition-all">
          {/* Top Accent Bar */}
          <div className={`h-1 w-full ${getPlanAccentColor()}`} />
          
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-gray-900 flex-wrap">
                <span>{activePlan.name}</span>
                <span className="text-gray-400 font-normal">&middot;</span>
                <span className="text-[#f43f5e] font-extrabold">&pound;{activePlan.price}</span>
                <span className="text-xs text-gray-400 font-normal">/month + VAT</span>
              </div>

              {/* Edit Plan Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Edit pricing plan"
                title="Edit pricing plan"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 font-medium">
              {activePlan.billingCycle === 'yearly' ? 'billed annually' : 'billed monthly'}
            </p>
            <p className="text-xs text-gray-600 font-medium pt-0.5">
              Includes <span className="text-[#f43f5e] font-semibold">{activePlan.tenancies}</span> tenancies
              {activePlan.extraTenancyPrice > 0 && (
                <span>
                  {' '}&middot; Extra tenancy <span className="text-[#f43f5e] font-semibold">&pound;{Number(activePlan.extraTenancyPrice).toFixed(2)}</span> + VAT
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Trial Note below plan card */}
        <p className="text-xs text-gray-500 font-medium text-left -mt-1">
          You will not be billed until your 14 day free trial ends.
        </p>

        {/* 1. Full Name */}
        <AuthInput
          id="fullName"
          label="Full name"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.fullName}
          required
          icon={User}
          autoComplete="name"
          disabled={isLoading}
        />

        {/* 2. Email Address */}
        <AuthInput
          id="email"
          label="Email address"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          required
          icon={Mail}
          autoComplete="email"
          disabled={isLoading}
        />

        {/* 3. Phone Number */}
        <AuthInput
          id="phone"
          label="Phone number"
          type="tel"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
          required
          icon={Phone}
          autoComplete="tel"
          disabled={isLoading}
        />

        {/* 4. Password */}
        <div>
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            required
            autoComplete="new-password"
            disabled={isLoading}
          />

          {/* Discount Coupon Toggle Link */}
          <div className="flex justify-end pt-1.5">
            <button
              type="button"
              onClick={() => setShowCouponInput(!showCouponInput)}
              className="text-xs font-semibold text-[#00a36f] hover:text-[#008f61] transition-colors hover:underline flex items-center gap-1"
            >
              <Tag className="w-3 h-3 text-[#00a36f]" />
              <span>Have a discount coupon?</span>
            </button>
          </div>

          {/* Coupon Input Box */}
          {showCouponInput && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                name="couponCode"
                placeholder="Enter coupon code"
                value={formData.couponCode}
                onChange={handleChange}
                disabled={isLoading || couponApplied}
                className="flex-1 h-9 text-xs px-3 rounded-lg border border-gray-300 focus:border-[#00a36f] focus:ring-1 focus:ring-[#00a36f] outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isLoading || couponApplied || !formData.couponCode.trim()}
                className="h-9 px-3 text-xs font-semibold text-white bg-[#00a36f] rounded-lg hover:bg-[#008f61] disabled:opacity-50"
              >
                {couponApplied ? 'Applied ✓' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Submit Button: GET STARTED */}
        <div className="pt-2">
          <AuthButton
            isLoading={isLoading}
            disabled={isLoading}
            className="rounded-full tracking-wide uppercase font-extrabold text-base h-12"
          >
            GET STARTED
          </AuthButton>
        </div>

        {/* reCAPTCHA & Google Privacy Note */}
        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline hover:text-gray-700"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline hover:text-gray-700"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>

        {/* Marketing Opt-Out Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="optOutMarketing"
              checked={formData.optOutMarketing}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#00a36f] focus:ring-[#00a36f] accent-[#00a36f] cursor-pointer"
            />
            <span className="text-xs text-gray-600 leading-tight">
              Please tick this box if you do not want to hear from us about our offers. You may withdraw this consent at any time by{' '}
              <a
                href="mailto:[SUPPORT EMAIL]"
                className="font-semibold text-gray-800 underline hover:text-[#00a36f]"
              >
                emailing us
              </a>
              .
            </span>
          </label>
        </div>

        {/* Agreement Terms & Privacy Notice */}
        <p className="text-xs text-gray-600 leading-normal pt-1 border-t border-gray-100 mt-1">
          Please note: By completing your sign-up you are agreeing to our{' '}
          <Link
            to="/terms-and-conditions"
            className="font-bold text-[#00a36f] hover:underline"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            to="/privacy-notice"
            className="font-bold text-[#00a36f] hover:underline"
          >
            Privacy Notice
          </Link>
          .
        </p>
      </form>

      {/* EDIT PRICING PLAN MODAL POPUP */}
      <EditPricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlan={activePlan}
        onSavePlan={(newPlan) => setActivePlan(newPlan)}
      />
    </>
  );
}
