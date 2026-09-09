const mongoose = require('mongoose');

const paymentScheduleSchema = new mongoose.Schema(
  {
    agreementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agreement',
      required: true,
    },
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
    periodName: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    expectedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      default: 'Rent',
    },
    status: {
      type: String,
      enum: ['Paid', 'Partially Paid', 'Pending', 'Overdue'],
      default: 'Pending',
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

const PaymentSchedule = mongoose.model('PaymentSchedule', paymentScheduleSchema);

module.exports = PaymentSchedule;
