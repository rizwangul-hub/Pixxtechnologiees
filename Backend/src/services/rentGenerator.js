const RentPayment = require('../models/RentPayment');
const Invoice = require('../models/Invoice');
const Tenancy = require('../models/Tenancy');

const dateOnly = (value) => new Date(`${value}T00:00:00`);

const getDueDate = (year, month, day) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(Number(day) || 1, 1), lastDay));
};

const generateRentPayments = async ({ monthsAhead = 3 } = {}) => {
  const tenancies = await Tenancy.find({ status: 'Active' })
    .populate('customerId', 'name')
    .populate('propertyId', 'name');
  const today = new Date();
  const finalMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  let created = 0;

  for (const tenancy of tenancies) {
    const start = dateOnly(tenancy.startDate);
    const end = tenancy.endDate ? dateOnly(tenancy.endDate) : null;
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= finalMonth && (!end || cursor <= new Date(end.getFullYear(), end.getMonth(), 1))) {
      const billingMonth = cursor.getMonth() + 1;
      const billingYear = cursor.getFullYear();
      const dueDate = getDueDate(billingYear, cursor.getMonth(), tenancy.paymentDueDay);
      if (!end || dueDate <= end) {
        try {
          const payment = await RentPayment.create({
            customerId: tenancy.customerId._id || tenancy.customerId,
            propertyId: tenancy.propertyId._id || tenancy.propertyId,
            tenancyId: tenancy._id,
            amount: tenancy.monthlyRent,
            remainingAmount: tenancy.monthlyRent,
            dueDate,
            billingMonth,
            billingYear,
            status: dueDate < today ? 'Overdue' : 'Pending',
          });
          await Invoice.create({
            invoiceNumber: `INV-${billingYear}${String(billingMonth).padStart(2, '0')}-${payment._id.toString().slice(-6).toUpperCase()}`,
            paymentId: payment._id,
            customerId: payment.customerId,
            propertyId: payment.propertyId,
            tenancyId: payment.tenancyId,
            billingPeriod: `${billingYear}-${String(billingMonth).padStart(2, '0')}`,
            amount: payment.amount,
            dueDate: dueDate.toISOString().slice(0, 10),
            status: payment.status,
          });
          created += 1;
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  return created;
};

module.exports = { generateRentPayments };
