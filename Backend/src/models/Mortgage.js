const mongoose = require('mongoose');

const mortgageSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required for a mortgage record'],
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      required: [true, 'Landlord is required for a mortgage record'],
    },
    lenderName: {
      type: String,
      required: [true, 'Lender or bank name is required'],
      trim: true,
    },
    mortgageAccountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    originalLoanAmount: {
      type: Number,
      required: [true, 'Original loan amount is required'],
      min: [0.01, 'Original loan amount must be greater than 0'],
    },
    currentOutstandingBalance: {
      type: Number,
      required: [true, 'Current outstanding balance is required'],
      min: [0, 'Current outstanding balance cannot be negative'],
    },
    interestRate: {
      type: Number,
      default: 0,
      min: [0, 'Interest rate cannot be negative'],
    },
    monthlyPayment: {
      type: Number,
      required: [true, 'Monthly payment amount is required'],
      min: [0, 'Monthly payment cannot be negative'],
    },
    paymentFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Other'],
      default: 'Monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Mortgage start date is required'],
    },
    termMonths: {
      type: Number,
      default: 0,
      min: [0, 'Term in months cannot be negative'],
    },
    maturityDate: {
      type: Date,
      default: null,
    },
    nextPaymentDate: {
      type: Date,
      required: [true, 'Next payment due date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Paid Off', 'Closed', 'Pending'],
      default: 'Active',
    },
    notes: {
      type: String,
      default: '',
    },
    documents: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        originalFileName: { type: String, default: '' },
        fileType: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

mortgageSchema.index({ propertyId: 1 });
mortgageSchema.index({ landlordId: 1 });
mortgageSchema.index({ status: 1 });
mortgageSchema.index({ nextPaymentDate: 1 });

const Mortgage = mongoose.model('Mortgage', mortgageSchema);

module.exports = Mortgage;
