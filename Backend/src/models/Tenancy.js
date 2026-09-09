const mongoose = require('mongoose');

const tenancySchema = new mongoose.Schema(
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
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      default: null,
      index: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,
      default: '',
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: 0,
    },
    paymentDueDay: {
      type: Number,
      default: 1,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
      index: true,
    },
    companyMonthlyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    agentPaymentDueDay: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['Active', 'Ended', 'Cancelled', 'Archived'],
      default: 'Active',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    archiveReason: {
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

const Tenancy = mongoose.model('Tenancy', tenancySchema);

module.exports = Tenancy;
