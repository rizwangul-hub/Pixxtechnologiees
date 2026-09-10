const Tenancy = require('../models/Tenancy');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthName(monthNum) {
  return MONTH_NAMES[monthNum - 1] || `Month ${monthNum}`;
}

function parseYearMonth(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const parts = str.split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m)) {
      return { year: y, month: m };
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }
  return null;
}

/**
 * Automatically generates missing monthly payment records for active tenancies
 */
async function generateMonthlyPayments() {
  try {
    const activeTenancies = await Tenancy.find({ status: 'Active' });
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const todayStr = now.toISOString().split('T')[0];

    let generatedCount = 0;

    for (const tenancy of activeTenancies) {
      if (!tenancy.monthlyRent || tenancy.monthlyRent <= 0) continue;

      // Use billingStartDate if set (e.g. '2026-01'), otherwise use startDate
      const effectiveBillingStart = tenancy.billingStartDate || tenancy.startDate;
      const startYM = parseYearMonth(effectiveBillingStart);
      if (!startYM) continue;

      const startYear = startYM.year;
      const startMonth = startYM.month;

      let endYear = currentYear;
      let endMonth = currentMonth;

      if (tenancy.endDate) {
        const endYM = parseYearMonth(tenancy.endDate);
        if (endYM) {
          if (endYM.year < currentYear || (endYM.year === currentYear && endYM.month < currentMonth)) {
            endYear = endYM.year;
            endMonth = endYM.month;
          }
        }
      }

      // Loop year by year and month by month from start date to end range
      for (let y = startYear; y <= endYear; y++) {
        const mStart = y === startYear ? startMonth : 1;
        const mEnd = y === endYear ? endMonth : 12;

        for (let m = mStart; m <= mEnd; m++) {
          const dueDay = Math.min(Math.max(tenancy.paymentDueDay || 1, 1), 28);
          const dueDayStr = String(dueDay).padStart(2, '0');
          const monthStr = String(m).padStart(2, '0');
          const dueDateStr = `${y}-${monthStr}-${dueDayStr}`;

          const existingPayment = await Payment.findOne({
            tenancyId: tenancy._id,
            billingMonth: m,
            billingYear: y,
          });

          if (!existingPayment) {
            const initialStatus = dueDateStr < todayStr ? 'Overdue' : 'Pending';

            try {
              const newPayment = await Payment.create({
                customerId: tenancy.customerId,
                propertyId: tenancy.propertyId,
                tenancyId: tenancy._id,
                amount: tenancy.monthlyRent,
                paidAmount: 0,
                remainingAmount: tenancy.monthlyRent,
                dueDate: dueDateStr,
                billingMonth: m,
                billingYear: y,
                status: initialStatus,
                paymentMethod: 'Cash',
                reference: '',
                notes: `Automated rent for ${getMonthName(m)} ${y}`,
              });

              const count = await Invoice.countDocuments();
              const invoiceNumber = `INV-${y}-${String(count + 1).padStart(4, '0')}`;
              
              await Invoice.create({
                invoiceNumber,
                paymentId: newPayment._id,
                customerId: tenancy.customerId,
                propertyId: tenancy.propertyId,
                tenancyId: tenancy._id,
                billingPeriod: `${getMonthName(m)} ${y}`,
                amount: tenancy.monthlyRent,
                dueDate: dueDateStr,
                status: initialStatus,
              });

              generatedCount++;
            } catch (err) {
              if (err.code !== 11000) {
                console.error(`Error generating payment for tenancy ${tenancy._id}:`, err.message);
              }
            }
          } else {
            // Update overdue status if due date passed and still remaining amount > 0
            if (
              existingPayment.status !== 'Paid' &&
              existingPayment.remainingAmount > 0 &&
              existingPayment.dueDate < todayStr &&
              existingPayment.status !== 'Overdue'
            ) {
              existingPayment.status = 'Overdue';
              await existingPayment.save();

              await Invoice.updateOne(
                { paymentId: existingPayment._id },
                { status: 'Overdue' }
              );
            }
          }
        }
      }
    }

    return { success: true, generatedCount };
  } catch (error) {
    console.error('Error in generateMonthlyPayments service:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateMonthlyPayments,
  getMonthName,
};
