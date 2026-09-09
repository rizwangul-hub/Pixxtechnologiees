/**
 * Reusable Currency Formatter Utility
 * Formats numeric values into UK GBP currency strings (e.g. £1,250.00).
 *
 * @param {number|string} amount - The numeric amount to format.
 * @param {string} [currencyCode='GBP'] - ISO currency code.
 * @param {string} [locale='en-GB'] - Locale code for UK formatting rules.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(amount, currencyCode = 'GBP', locale = 'en-GB') {
  const numericAmount = Number(amount) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    // Graceful fallback
    return `£${numericAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
