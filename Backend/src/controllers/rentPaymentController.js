const RentPayment = require('../models/RentPayment');
const Invoice = require('../models/Invoice');
const { generateRentPayments } = require('../services/rentGenerator');

const dateOnly = (value) => new Date(new Date(value).toISOString().slice(0, 10));

const calculateStatus = (payment, now = new Date()) => {
  const paid = Number(payment.paidAmount) || 0;
  const amount = Number(payment.amount) || 0;
  if (paid >= amount) return 'Paid';
  if (payment.dueDate < now) return 'Overdue';
  if (paid > 0) return 'Partially Paid';
  return 'Pending';
};

const syncInvoice = async (payment) => {
  const billingPeriod = `${payment.billingYear}-${String(payment.billingMonth).padStart(2, '0')}`;
  await Invoice.findOneAndUpdate(
    { paymentId: payment._id },
    {
      paymentId: payment._id,
      customerId: payment.customerId,
      propertyId: payment.propertyId,
      unitId: payment.unitId,
      tenancyId: payment.tenancyId,
      billingPeriod,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString().slice(0, 10),
      status: payment.status,
      paymentInfo: {
        paidAmount: payment.paidAmount,
        paidDate: payment.paidDate ? payment.paidDate.toISOString().slice(0, 10) : '',
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
      },
      $setOnInsert: { invoiceNumber: `INV-${payment.billingYear}${String(payment.billingMonth).padStart(2, '0')}-${payment._id.toString().slice(-6).toUpperCase()}` },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const withStatus = (payment) => {
  const item = payment.toObject ? payment.toObject() : payment;
  item.status = calculateStatus(item);
  item.remainingAmount = Math.max(0, item.amount - item.paidAmount);
  return item;
};

const getPayments = async (req, res) => {
  try {
    await generateRentPayments();
    const { property, propertyId, unit, unitId, customer, customerId, status, date, month, year } = req.query;
    const filter = {};
    const set = (key, first, second) => { if (first || second) filter[key] = first || second; };
    set('propertyId', property, propertyId); set('unitId', unit, unitId); set('customerId', customer, customerId);
    if (month) filter.billingMonth = Number(month);
    if (year) filter.billingYear = Number(year);
    if (date) filter.dueDate = { $gte: dateOnly(date), $lt: new Date(dateOnly(date).getTime() + 86400000) };
    let payments = await RentPayment.find(filter)
      .populate('customerId', 'name')
      .populate('propertyId', 'name')
      
      .sort({ dueDate: 1 });
    payments = payments.map(withStatus);
    if (status === 'Upcoming') {
      const today = new Date();
      payments = payments.filter((payment) => ['Pending', 'Partially Paid'].includes(payment.status) && payment.dueDate >= today);
    } else if (status && status !== 'All') payments = payments.filter((payment) => payment.status === status);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getPayment = async (req, res) => {
  try { const payment = await RentPayment.findById(req.params.id); if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' }); res.json({ success: true, data: withStatus(payment) }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const payPayment = async (req, res) => {
  try {
    const payment = await RentPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    const paidNow = Number(req.body.amountPaid ?? req.body.amount) || 0;
    if (paidNow <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    if (paidNow > payment.remainingAmount) return res.status(400).json({ success: false, message: 'Payment exceeds remaining amount' });
    payment.paidAmount += paidNow;
    payment.remainingAmount = Math.max(0, payment.amount - payment.paidAmount);
    payment.paidDate = req.body.paymentDate ? new Date(req.body.paymentDate) : new Date();
    payment.paymentMethod = req.body.paymentMethod || payment.paymentMethod;
    payment.reference = req.body.reference || req.body.referenceNo || payment.reference;
    payment.notes = req.body.notes ?? payment.notes;
    payment.status = calculateStatus(payment);
    await payment.save();
    await syncInvoice(payment);
    res.json({ success: true, data: withStatus(payment) });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const updatePayment = async (req, res) => {
  try { const payment = await RentPayment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' }); payment.status = calculateStatus(payment); payment.remainingAmount = Math.max(0, payment.amount - payment.paidAmount); await payment.save(); await syncInvoice(payment); res.json({ success: true, data: withStatus(payment) }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const deletePayment = async (req, res) => {
  try { const payment = await RentPayment.findByIdAndDelete(req.params.id); if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' }); await Invoice.deleteOne({ paymentId: payment._id }); res.json({ success: true, message: 'Payment deleted' }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const getByStatus = (wantedStatus) => async (req, res) => {
  req.query.status = wantedStatus;
  return getPayments(req, res);
};

const getSummary = async (req, res) => {
  try {
    await generateRentPayments();
    const payments = (await RentPayment.find()).map(withStatus);
    const total = (key) => payments.reduce((sum, payment) => sum + Number(payment[key] || 0), 0);
    res.json({ success: true, data: { totalExpected: total('amount'), totalCollected: total('paidAmount'), totalOutstanding: total('remainingAmount'), totalOverdue: payments.filter((p) => p.status === 'Overdue').reduce((sum, p) => sum + p.remainingAmount, 0), overdueCount: payments.filter((p) => p.status === 'Overdue').length, upcomingCount: payments.filter((p) => ['Pending', 'Partially Paid'].includes(p.status) && new Date(p.dueDate) >= new Date()).length } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getPayments, getPayment, payPayment, updatePayment, deletePayment, getByStatus, getSummary, calculateStatus };
