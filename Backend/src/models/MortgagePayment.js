const mongoose = require('mongoose');

const mortgagePaymentSchema = new mongoose.Schema(
  {
    mortgageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mortgage',
      required: [true, 'Mortgage ID is required'],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      required: [true, 'Landlord ID is required'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    totalPayment: {
      type: Number,
      required: [true, 'Total payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    principalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Principal amount cannot be negative'],
    },
    interestAmount: {
      type: Number,
      default: 0,
      min: [0, 'Interest amount cannot be negative'],
    },
    remainingBalance: {
      type: Number,
      required: [true, 'Remaining balance is required'],
      min: [0, 'Remaining balance cannot be negative'],
    },
    paymentMethod: {
      type: String,
      default: 'Bank Transfer',
      trim: true,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

mortgagePaymentSchema.index({ mortgageId: 1 });
mortgagePaymentSchema.index({ propertyId: 1 });
mortgagePaymentSchema.index({ landlordId: 1 });
mortgagePaymentSchema.index({ paymentDate: -1 });

const MortgagePayment = mongoose.model('MortgagePayment', mortgagePaymentSchema);

module.exports = MortgagePayment;
