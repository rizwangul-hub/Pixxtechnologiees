const mongoose = require('mongoose');

const transactionLedgerSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: [
        'AgentPayment',
        'AgentExpenseDeduction',
        'TenantRentCharge',
        'TenantPayment',
        'PropertyExpense',
        'MortgagePayment',
        'LandlordPayout',
        'Correction',
      ],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    entryType: {
      type: String,
      enum: ['Credit', 'Debit'],
      required: [true, 'Entry type (Credit or Debit) is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Transaction amount cannot be negative'],
    },
    date: {
      type: String,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    tenancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenancy',
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      index: true,
    },
    mortgageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mortgage',
      index: true,
    },
    relatedPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentExpense',
    },
    relatedSettlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentPayment',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'Bank Transfer',
    },
    status: {
      type: String,
      enum: ['Active', 'Reversed', 'Void'],
      default: 'Active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    reversalReason: {
      type: String,
      default: '',
    },
    reversedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

transactionLedgerSchema.index({ propertyId: 1, date: -1 });
transactionLedgerSchema.index({ agentId: 1, date: -1 });
transactionLedgerSchema.index({ tenantId: 1, date: -1 });
transactionLedgerSchema.index({ landlordId: 1, date: -1 });

const TransactionLedger = mongoose.model('TransactionLedger', transactionLedgerSchema);

module.exports = TransactionLedger;
