/**
 * Standard Tenant Documents List & Expiry Calculator
 * PixxTechnologies Property Management System
 */

export const STANDARD_DOCUMENTS = [
  { name: 'EPC', hasExpiryDate: true },
  { name: 'EICR', hasExpiryDate: true },
  { name: 'Floor Plan', hasExpiryDate: false },
  { name: 'Tenancy Agreement', hasExpiryDate: true },
  { name: 'Tenant ID - 1', hasExpiryDate: false },
  { name: 'Tenant ID - 2', hasExpiryDate: false },
  { name: 'Tenant ID - 3', hasExpiryDate: false },
  { name: 'Tenant Passports', hasExpiryDate: false },
  { name: 'Anti Social Behavior', hasExpiryDate: false },
  { name: 'How to Rent', hasExpiryDate: false },
  { name: 'Renters Rights Act', hasExpiryDate: false },
  { name: 'DPS', hasExpiryDate: false },
  { name: 'Rent Protection Insurance', hasExpiryDate: true },
  { name: 'Tenant Payslips', hasExpiryDate: false },
  { name: 'Tenant Bank Statement', hasExpiryDate: false },
  { name: 'Right to Rent Check', hasExpiryDate: true },
  { name: 'Gas Certificate', hasExpiryDate: true },
  { name: 'Other Document', hasExpiryDate: false },
  { name: 'Property Picture', hasExpiryDate: false },
];

/**
 * Calculate dynamic status from expiry date
 */
export function calculateDocumentStatus(expiryDate) {
  if (!expiryDate) {
    return {
      status: 'No Expiry Date',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      daysRemaining: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'Expired',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'Expiring Soon',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
      daysRemaining: diffDays,
    };
  }

  return {
    status: 'Valid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    daysRemaining: diffDays,
  };
}
