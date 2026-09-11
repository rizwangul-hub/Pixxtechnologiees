const mongoose = require('mongoose');
const Mortgage = require('../models/Mortgage');

/**
 * Migration: Upgrade existing mortgages to Mortgage Facility Architecture
 * Safe and Idempotent: Can be run multiple times without duplicating data
 */
async function migrateMortgageFacilities() {
  try {
    const mortgages = await Mortgage.find({
      $or: [
        { mortgageType: { $exists: false } },
        { mortgageType: null },
        { properties: { $exists: false } },
        { properties: { $size: 0 } },
      ],
    });

    if (mortgages.length === 0) {
      return { migratedCount: 0, message: 'All mortgages are already up to date.' };
    }

    console.log(`🔄 [Mortgage Migration] Found ${mortgages.length} legacy mortgage records to upgrade...`);

    let updated = 0;
    for (const m of mortgages) {
      let needsSave = false;

      // 1. Set mortgageType to Individual Property by default if missing
      if (!m.mortgageType) {
        m.mortgageType = 'Individual Property';
        needsSave = true;
      }

      // 2. Set mortgageReference if empty
      if (!m.mortgageReference && m.mortgageAccountNumber) {
        m.mortgageReference = m.mortgageAccountNumber;
        needsSave = true;
      }

      // 3. Migrate propertyId into properties array if properties array is empty
      if ((!m.properties || m.properties.length === 0) && m.propertyId) {
        m.properties = [
          {
            propertyId: m.propertyId,
            allocatedAmount: m.originalLoanAmount || 0,
            notes: 'Migrated from individual mortgage record',
            securedAt: m.startDate || m.createdAt || new Date(),
            status: 'Active',
          },
        ];
        needsSave = true;
      }

      if (needsSave) {
        await m.save();
        updated++;
      }
    }

    console.log(`✅ [Mortgage Migration] Successfully migrated ${updated} mortgage records.`);
    return { migratedCount: updated, message: `Migrated ${updated} mortgage records.` };
  } catch (error) {
    console.error('❌ [Mortgage Migration Error]', error.message);
    throw error;
  }
}

module.exports = {
  migrateMortgageFacilities,
};

// Allow running standalone from command line
if (require.main === module) {
  const dotenv = require('dotenv');
  dotenv.config({ path: './.env' });

  mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URL)
    .then(async () => {
      console.log('✅ Connected to MongoDB. Running migration...');
      const res = await migrateMortgageFacilities();
      console.log(res);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
