const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenancy', required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    billingMonth: { type: Number, required: true, min: 1, max: 12 },
    billingYear: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Online', 'Other'], default: 'Other' },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

rentPaymentSchema.index({ tenancyId: 1, billingMonth: 1, billingYear: 1 }, { unique: true });

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
