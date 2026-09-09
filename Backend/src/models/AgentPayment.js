const mongoose = require('mongoose');

const agentPaymentSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent reference is required'],
      index: true,
    },
    tenancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenancy',
      required: [true, 'Tenancy reference is required'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
      index: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit reference is required'],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Tenant reference is required'],
      index: true,
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
    expectedAmount: {
      type: Number,
      required: [true, 'Expected company amount is required'],
      min: 0,
    },
    expenseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    overpaymentCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        paymentMethod: { type: String, default: 'Bank Transfer' },
        reference: { type: String, default: '' },
        notes: { type: String, default: '' },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    paidDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
      default: 'Pending',
      index: true,
    },
    paymentMethod: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate monthly settlement records for the same tenancy, month, and year
agentPaymentSchema.index({ tenancyId: 1, billingMonth: 1, billingYear: 1 }, { unique: true });
agentPaymentSchema.index({ agentId: 1, billingMonth: 1, billingYear: 1 });

const AgentPayment = mongoose.model('AgentPayment', agentPaymentSchema);

module.exports = AgentPayment;
