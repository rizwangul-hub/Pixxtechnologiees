const { generateMonthlyPayments } = require('./paymentGeneratorService');
const { checkAndProcessDocumentExpiries } = require('./documentExpiryService');
const Mortgage = require('../models/Mortgage');
const Notification = require('../models/Notification');

const { migrateMortgageFacilities } = require('../scripts/migrateMortgageFacilities');

async function checkUpcomingMortgagePaymentAlerts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const mortgagesDue = await Mortgage.find({
      status: 'Active',
      nextPaymentDate: { $gte: today, $lte: sevenDaysFromNow },
    })
      .populate('propertyId', 'name')
      .populate('properties.propertyId', 'name');

    for (const m of mortgagesDue) {
      const existingNotif = await Notification.findOne({
        title: 'Mortgage Payment Due Soon',
        message: { $regex: m.lenderName, $options: 'i' },
        createdAt: { $gte: today },
      });

      if (!existingNotif) {
        const dateStr = new Date(m.nextPaymentDate).toISOString().split('T')[0];
        const propNames = (m.properties && m.properties.length > 0)
          ? m.properties.map((p) => p.propertyId?.name).filter(Boolean).join(', ')
          : (m.propertyId?.name || 'Property');

        await Notification.create({
          title: 'Mortgage Payment Due Soon',
          message: `Mortgage payment of £${m.monthlyPayment.toLocaleString()} for ${propNames} (${m.lenderName}) is due on ${dateStr}.`,
          type: 'General',
          propertyId: m.propertyId?._id || m.properties?.[0]?.propertyId?._id || null,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.error('❌ [Cron Service] Error checking mortgage payment alerts:', err.message);
  }
}

function initCronService() {
  console.log('⚡ [Cron Service] Initializing Automated Rent, Document Expiry & Mortgage Services...');

  // Run immediately on server boot
  generateMonthlyPayments()
    .then((res) => {
      console.log(`✅ [Cron Service] Initial rent check complete. Generated ${res.generatedCount || 0} new rent records.`);
    })
    .catch((err) => {
      console.error('❌ [Cron Service] Error during rent check:', err);
    });

  checkAndProcessDocumentExpiries()
    .then((res) => {
      console.log(`✅ [Cron Service] Initial document expiry check complete. Processed ${res.processedCount || 0} documents, sent ${res.sentCount || 0} emails.`);
    })
    .catch((err) => {
      console.error('❌ [Cron Service] Error during document expiry check:', err);
    });

  migrateMortgageFacilities()
    .then((res) => {
      if (res.migratedCount > 0) {
        console.log(`✅ [Cron Service] Mortgage facility migration complete. Upgraded ${res.migratedCount} records.`);
      }
    })
    .catch((err) => {
      console.error('❌ [Cron Service] Error during mortgage facility migration check:', err);
    });

  checkUpcomingMortgagePaymentAlerts()
    .then(() => {
      console.log('✅ [Cron Service] Initial mortgage payment due check complete.');
    })
    .catch((err) => {
      console.error('❌ [Cron Service] Error during mortgage payment check:', err);
    });

  // Run periodically
  const INTERVAL_RENT_MS = 30 * 60 * 1000;
  const INTERVAL_EXPIRY_MS = 6 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const res = await generateMonthlyPayments();
      if (res.generatedCount > 0) {
        console.log(`⚡ [Cron Service] Periodic check created ${res.generatedCount} rent records.`);
      }
    } catch (err) {
      console.error('❌ [Cron Service] Periodic rent check error:', err);
    }
  }, INTERVAL_RENT_MS);

  setInterval(async () => {
    try {
      await checkAndProcessDocumentExpiries();
      await checkUpcomingMortgagePaymentAlerts();
    } catch (err) {
      console.error('❌ [Cron Service] Periodic expiry check error:', err);
    }
  }, INTERVAL_EXPIRY_MS);
}

module.exports = {
  initCronService,
  checkUpcomingMortgagePaymentAlerts,
};
