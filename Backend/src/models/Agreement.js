const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    unitName: {
      type: String,
      required: true,
    },
    agreementType: {
      type: String,
      enum: ['Rent', 'Sale'],
      default: 'Rent',
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      default: '',
    },
    monthlyOrSalePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    paymentFrequency: {
      type: String,
      default: 'Monthly',
    },
    dueDayOfMonth: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['Active', 'Terminated', 'Expired'],
      default: 'Active',
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

const Agreement = mongoose.model('Agreement', agreementSchema);

module.exports = Agreement;
