const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Unit name/number is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Building', 'House', 'Shop', 'Office', 'Flat', 'Apartment', 'Room', 'Other'],
      default: 'Shop',
    },
    floor: {
      type: String,
      default: 'Ground',
      trim: true,
    },
    size: {
      type: String,
      default: '',
      trim: true,
    },
    sizeUnit: {
      type: String,
      default: 'sq ft',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    monthlyRent: {
      type: Number,
      default: function () {
        return this.price || 0;
      },
    },
    salePrice: {
      type: Number,
      default: 0,
    },
    priceType: {
      type: String,
      enum: ['monthly_rent', 'sale', 'other'],
      default: 'monthly_rent',
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Archived'],
      default: 'Available',
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
    customerName: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: '' },
      },
    ],
    notes: {
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

unitSchema.index({ propertyId: 1 });
unitSchema.index({ status: 1 });
unitSchema.index({ type: 1 });
unitSchema.index({ name: 1 });

// Virtual aliases
unitSchema.virtual('unitName').get(function () {
  return this.name;
});

unitSchema.virtual('unitNumber').get(function () {
  return this.name;
});

unitSchema.virtual('unitType').get(function () {
  return this.type;
});

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
