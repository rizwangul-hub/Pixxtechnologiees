const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Individual', 'Company / Business', 'Organization'],
      default: 'Individual',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    cnicOrReg: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: 'London',
      trim: true,
    },
    emergencyContact: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    documents: [
      {
        name: { type: String, default: 'Document' },
        url: { type: String, required: true },
        public_id: { type: String, default: '' },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ status: 1 });

// Virtual aliases
customerSchema.virtual('fullName').get(function () {
  return this.name;
});

customerSchema.virtual('cnicOrId').get(function () {
  return this.cnicOrReg;
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
