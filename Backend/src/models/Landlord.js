const mongoose = require('mongoose');

const landlordSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Landlord full name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address',
      },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'United Kingdom',
    },
    region: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      url: {
        type: String,
        default: '',
      },
      publicId: {
        type: String,
        default: '',
      },
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
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

landlordSchema.index({ fullName: 1 });
landlordSchema.index({ email: 1 });
landlordSchema.index({ phone: 1 });

// Virtual alias for contactNumber
landlordSchema.virtual('contactNumber').get(function () {
  return this.phone;
});

const Landlord = mongoose.model('Landlord', landlordSchema);

module.exports = Landlord;
