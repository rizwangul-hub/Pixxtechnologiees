import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export function EditPricingModal({
  isOpen,
  onClose,
  currentPlan,
  onSavePlan,
}) {
  // Always call hooks unconditionally at the top of component
  const [tenancies, setTenancies] = useState(currentPlan?.tenancies || 46);
  const [billingCycle, setBillingCycle] = useState(currentPlan?.billingCycle || 'yearly'); // 'monthly' | 'yearly'
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan?.id || 'premium');

  if (!isOpen) return null;

  // Dynamic price calculator based on tenancies & billing cycle
  const calculatePlanPrices = (baseMonthly, extraPerTenancy, includedBase = 15) => {
    const extraTenancies = Math.max(0, tenancies - includedBase);
    const extraCost = extraTenancies * extraPerTenancy;
    const monthlyTotal = baseMonthly + extraCost;

    if (billingCycle === 'yearly') {
      // 15% discount on yearly
      const yearlyMonthlyEquivalent = monthlyTotal * 0.85;
      return {
        monthlyRate: yearlyMonthlyEquivalent.toFixed(2),
        originalRate: monthlyTotal.toFixed(2),
        isYearly: true,
      };
    }

    return {
      monthlyRate: monthlyTotal.toFixed(2),
      originalRate: null,
      isYearly: false,
    };
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      accentColor: 'border-amber-400 bg-amber-400',
      badge: '60 % off for the 2 years',
      includedTenancies: 4,
      extraTenancyCost: 0,
      baseMonthly: 8.79,
      discountedMonthlyYearly: 7.99,
      originalPriceYearly: 19.97,
    },
    {
      id: 'standard',
      name: 'Standard',
      accentColor: 'border-orange-500 bg-orange-500',
      extraTenancyCost: 1.10,
      baseMonthly: 49.97,
    },
    {
      id: 'premium',
      name: 'Premium',
      accentColor: 'border-[#f43f5e] bg-[#f43f5e]',
      extraTenancyCost: 1.30,
      baseMonthly: 59.97,
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      accentColor: 'border-blue-600 bg-blue-600',
      extraTenancyCost: 1.50,
      baseMonthly: 89.97,
    },
  ];

  const handleSave = () => {
    const chosenPlan = plans.find((p) => p.id === selectedPlanId);
    let finalPrices;

    if (chosenPlan.id === 'starter') {
      finalPrices = {
        monthlyRate: billingCycle === 'yearly' ? '7.99' : '8.79',
        isYearly: billingCycle === 'yearly',
      };
    } else {
      finalPrices = calculatePlanPrices(chosenPlan.baseMonthly, chosenPlan.extraTenancyCost);
    }

    onSavePlan({
      id: chosenPlan.id,
      name: chosenPlan.name,
      price: finalPrices.monthlyRate,
      billingCycle: billingCycle,
      tenancies: chosenPlan.id === 'starter' ? 4 : tenancies,
      extraTenancyPrice: chosenPlan.extraTenancyCost,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-6 sm:p-7 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Edit pricing plan
          </h2>
          <div className="flex items-center gap-3">
            <a
              href="#learn"
              onClick={(e) => {
                e.preventDefault();
                alert('Plan details and pricing tier documentation can be viewed here.');
              }}
              className="text-xs font-semibold text-orange-500 hover:text-orange-600 underline"
            >
              learn more
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 sm:p-7 pt-4 overflow-y-auto space-y-6 flex-1 text-left">
          {/* 1. TENANCY SLIDER CONTROL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-gray-700">
                How many tenancies will you manage?
              </label>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tenancies}
                  onChange={(e) => setTenancies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-sm font-bold text-gray-900 bg-transparent outline-none"
                />
                <span className="text-xs font-medium text-gray-500">active tenancies</span>
              </div>
            </div>

            {/* Slider Bar */}
            <div className="relative pt-2">
              <input
                type="range"
                min="1"
                max="150"
                value={tenancies}
                onChange={(e) => setTenancies(parseInt(e.target.value))}
                className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-[#04A26F]"
              />
            </div>
          </div>

          {/* 2. BILLING CYCLE TOGGLE (MONTHLY VS YEARLY) */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-full flex items-center gap-1 shadow-xs border border-gray-200/60 max-w-xs w-full">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] text-[#04A26F] font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          {/* 3. PLAN OPTIONS LIST */}
          <div className="space-y-3.5 pt-1">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              let prices;

              if (plan.id === 'starter') {
                prices = {
                  monthlyRate: billingCycle === 'yearly' ? '7.99' : '8.79',
                  originalRate: billingCycle === 'yearly' ? '19.97' : null,
                  isYearly: billingCycle === 'yearly',
                };
              } else {
                prices = calculatePlanPrices(plan.baseMonthly, plan.extraTenancyCost);
              }

              const planTenanciesDisplay = plan.id === 'starter' ? 4 : tenancies;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`
                    relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 flex items-start gap-3.5
                    ${
                      isSelected
                        ? 'border-[#04A26F] bg-white shadow-lg ring-2 ring-[#04A26F]/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-xs'
                    }
                  `}
                >
                  {/* Top Color Accent Line */}
                  <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-full ${plan.accentColor}`} />

                  {/* Radio Indicator */}
                  <div className="pt-1 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-[#04A26F] bg-[#04A26F]' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Plan Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900">{plan.name}</span>
                        <span className="text-gray-400 font-normal text-xs">&middot;</span>
                        {prices.originalRate && (
                          <span className="text-xs font-semibold text-gray-400 line-through">
                            &pound;{prices.originalRate}
                          </span>
                        )}
                        <span className="text-base font-extrabold text-[#f43f5e]">
                          &pound;{prices.monthlyRate}
                        </span>
                        <span className="text-xs font-medium text-gray-400">/month + VAT</span>
                      </div>

                      {/* MOST POPULAR BADGE */}
                      {plan.isPopular && (
                        <div className="bg-[#f43f5e] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-white" />
                          Most Popular
                        </div>
                      )}
                    </div>

                    {/* Discount badge if present */}
                    {plan.badge && (
                      <p className="text-xs font-bold text-[#04A26F]">{plan.badge}</p>
                    )}

                    {/* Billing frequency info */}
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-gray-400 font-medium">billed annually</p>
                    )}

                    {/* Inclusions info */}
                    <p className="text-xs text-gray-600 font-medium pt-0.5">
                      Includes <span className="text-[#f43f5e] font-semibold">{planTenanciesDisplay}</span> tenancies
                      {plan.extraTenancyCost > 0 && (
                        <span>
                          {' '}&middot; Extra tenancy <span className="text-[#f43f5e] font-semibold">&pound;{plan.extraTenancyCost.toFixed(2)}</span> + VAT
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="p-5 sm:px-7 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-7 rounded-full text-xs font-bold text-white bg-gray-400 hover:bg-gray-500 active:bg-gray-600 transition-colors uppercase tracking-wider shadow-xs"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="h-11 px-8 rounded-full text-xs font-bold text-white bg-[#04A26F] hover:bg-[#038a5e] active:bg-[#026f4c] transition-all uppercase tracking-wider shadow-md shadow-[#04A26F]/20 hover:shadow-lg"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
