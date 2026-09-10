const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
    },
    tenancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenancy',
      required: [true, 'Tenancy reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    paidDate: {
      type: String,
      default: '',
    },
    billingMonth: {
      type: Number,
      required: [true, 'Billing month is required'],
      min: 1,
      max: 12,
    },
    billingYear: {
      type: Number,
      required: [true, 'Billing year is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Received', 'Partially Received', 'Overdue'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Online', 'Other'],
      default: 'Cash',
    },
    reference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    // 'Rent' = normal monthly rent, 'Opening Balance' = prior unpaid balance brought forward
    paymentType: {
      type: String,
      enum: ['Rent', 'Opening Balance', 'Security Deposit', 'Other'],
      default: 'Rent',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ propertyId: 1 });
paymentSchema.index({ tenancyId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ billingMonth: 1, billingYear: 1 });
paymentSchema.index({ tenancyId: 1, billingMonth: 1, billingYear: 1, paymentType: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
