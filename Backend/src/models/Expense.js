const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
    },
    supplier: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
    },
    category: {
      type: String,
      enum: [
        'Maintenance',
        'Utilities',
        'Repairs',
        'Insurance',
        'Tax',
        'Management Fee',
        'Other',
      ],
      default: 'Maintenance',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: 0,
    },
    date: {
      type: String,
      required: [true, 'Expense date is required'],
    },
    dueDate: {
      type: String,
      default: '',
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
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Partially Paid', 'Overdue'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ propertyId: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ date: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
