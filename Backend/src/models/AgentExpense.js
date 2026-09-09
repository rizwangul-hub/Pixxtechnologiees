const mongoose = require('mongoose');

const agentExpenseSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent reference is required'],
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
    tenancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenancy',
      required: [true, 'Tenancy reference is required'],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Tenant reference is required'],
      index: true,
    },
    expenseCategory: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    billingMonth: {
      type: Number,
    },
    billingYear: {
      type: Number,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    publicId: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Deducted', 'Rejected'],
      default: 'Approved',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

agentExpenseSchema.index({ agentId: 1, date: -1 });

const AgentExpense = mongoose.model('AgentExpense', agentExpenseSchema);

module.exports = AgentExpense;
