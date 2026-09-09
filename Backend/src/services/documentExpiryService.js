const TenantDocument = require('../models/TenantDocument');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');
const { sendDocumentExpiryEmail, FALLBACK_EMAIL } = require('./emailService');

/**
 * Checks all tenant documents and processes 30-day expiry reminders
 */
async function checkAndProcessDocumentExpiries() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find documents with expiry date where 30-day reminder has not been sent or failed
    const documents = await TenantDocument.find({
      expiryDate: { $ne: null },
      $or: [
        { expiryReminder30Sent: false },
        { expiryReminder30Status: { $in: ['Pending', 'Failed'] } },
      ],
    });

    let processedCount = 0;
    let sentCount = 0;

    for (const doc of documents) {
      const expDate = new Date(doc.expiryDate);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Trigger 30-day reminder if daysRemaining <= 30 and document is not already expired past 30 days
      if (daysRemaining <= 30 && daysRemaining >= 0 && !doc.expiryReminder30Sent) {
        processedCount++;

        const tenant = await Customer.findById(doc.tenantId);
        const tenantName = tenant?.fullName || tenant?.name || 'Unknown Tenant';

        // Find active tenancy to identify assigned Agent, Unit & Property
        const activeTenancy = await Tenancy.findOne({
          customerId: doc.tenantId,
          status: 'Active',
        })
          .populate('propertyId')
          .populate('unitId')
          .populate('agentId');

        const propertyName =
          activeTenancy?.propertyId?.title ||
          activeTenancy?.propertyId?.name ||
          'Unassigned Property';
        const unitName = activeTenancy?.unitId?.name || 'Unassigned Unit';

        const agent = activeTenancy?.agentId || null;
        const agentName = agent?.fullName || 'No Agent';

        // Determine recipient email: Assigned Agent email or Fallback email
        let recipientEmail = agent?.email ? agent.email.trim() : '';
        let isFallback = false;

        if (!recipientEmail || !recipientEmail.includes('@')) {
          recipientEmail = FALLBACK_EMAIL;
          isFallback = true;
        }

        const formattedExpiry = expDate.toISOString().split('T')[0];

        // Send Email
        const emailResult = await sendDocumentExpiryEmail({
          agentName: agent ? agentName : null,
          tenantName,
          propertyName,
          unitName,
          documentName: doc.documentName,
          expiryDate: formattedExpiry,
          daysRemaining,
          recipientEmail,
          isFallbackRecipient: isFallback,
        });

        if (emailResult.success) {
          doc.expiryReminder30Sent = true;
          doc.expiryReminder30SentAt = new Date();
          doc.expiryReminder30Recipient = recipientEmail;
          doc.expiryReminder30Status = 'Sent';
          doc.expiryReminder30Error = '';
          await doc.save();
          sentCount++;

          // Create In-App Notification for Manager
          const notifMsg = isFallback
            ? `${tenantName}'s ${doc.documentName} expires on ${formattedExpiry}. No Agent is assigned (or Agent email is missing), so the notification was sent to ${recipientEmail}.`
            : `${tenantName}'s ${doc.documentName} expires on ${formattedExpiry}. The assigned Agent ${agentName} has been notified.`;

          await Notification.create({
            title: 'Document Expiring Soon',
            message: notifMsg,
            type: 'DocumentExpiry',
            documentId: doc._id,
            tenantId: doc.tenantId,
            propertyId: activeTenancy?.propertyId?._id || null,
            unitId: activeTenancy?.unitId?._id || null,
            agentId: agent?._id || null,
            recipientEmail: recipientEmail,
            isRead: false,
          });
        } else {
          // Record failure for retry
          doc.expiryReminder30Status = 'Failed';
          doc.expiryReminder30Error = emailResult.error || 'Failed to send email';
          await doc.save();
        }
      }
    }

    return { processedCount, sentCount };
  } catch (error) {
    console.error('❌ [Document Expiry Service] Error processing expiries:', error.message);
    throw error;
  }
}

/**
 * Sends a test document expiry email using the EXACT same template, email service & SMTP configuration
 */
async function sendTestDocumentExpiryEmail(options = {}) {
  const targetRecipient = options.recipientEmail || 'rizwangul2426@gmail.com';

  // Attempt to load realistic document data from database
  let sampleDoc = await TenantDocument.findOne({ expiryDate: { $ne: null } }).populate('tenantId');
  let tenantName = sampleDoc?.tenantId?.fullName || sampleDoc?.tenantId?.name || 'Ahmed Khan';
  let documentName = sampleDoc?.documentName || 'Passport & Right to Rent Check';
  let propertyName = 'ABC Plaza';
  let unitName = 'Flat 101';
  let expiryDateStr = sampleDoc?.expiryDate
    ? new Date(sampleDoc.expiryDate).toISOString().split('T')[0]
    : '2026-10-08';
  let daysRemaining = 30;

  if (sampleDoc) {
    const activeTenancy = await Tenancy.findOne({ customerId: sampleDoc.tenantId, status: 'Active' })
      .populate('propertyId')
      .populate('unitId');
    if (activeTenancy) {
      propertyName = activeTenancy.propertyId?.title || activeTenancy.propertyId?.name || propertyName;
      unitName = activeTenancy.unitId?.name || unitName;
    }
  }

  console.log(`⚡ [Test Mode] Processing Test Document Expiry Email for ${targetRecipient}...`);

  const result = await sendDocumentExpiryEmail({
    agentName: 'Ali Khan (Test Agent)',
    tenantName,
    propertyName,
    unitName,
    documentName,
    expiryDate: expiryDateStr,
    daysRemaining,
    recipientEmail: targetRecipient,
    isFallbackRecipient: false,
  });

  if (result.success) {
    try {
      await Notification.create({
        title: 'Document Expiring Soon',
        message: `${tenantName}'s ${documentName} expires on ${expiryDateStr}. Document expiry reminder email sent to ${targetRecipient}.`,
        type: 'DocumentExpiry',
        documentId: sampleDoc?._id || null,
        tenantId: sampleDoc?.tenantId?._id || sampleDoc?.tenantId || null,
        recipientEmail: targetRecipient,
        isRead: false,
      });
    } catch (e) {
      console.warn('[Notification Error]', e.message);
    }
  }

  return result;
}

// Global reference for active 20-minute test timer
let activeTestTimer = null;

/**
 * Schedules a test email to fire after N minutes (default 20 minutes)
 */
function schedule20MinTestEmail(targetRecipient = 'rizwangul2426@gmail.com', delayMinutes = 20) {
  if (activeTestTimer) {
    clearTimeout(activeTestTimer);
  }

  const delayMs = delayMinutes * 60 * 1000;
  const targetTimeStr = new Date(Date.now() + delayMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  console.log(`\n================================================================`);
  console.log(`⏱️ [TEST MODE ACTIVATED] Automatic Document Expiry Test Email`);
  console.log(`  Recipient  : ${targetRecipient}`);
  console.log(`  Delay      : ${delayMinutes} minutes (${delayMs / 1000} seconds)`);
  console.log(`  Scheduled  : Email will fire automatically at approx ${targetTimeStr}`);
  console.log(`================================================================\n`);

  activeTestTimer = setTimeout(async () => {
    try {
      console.log(`\n⏰ [20-MINUTE TIMER FIRED] Sending test document-expiry email now to ${targetRecipient}...`);
      const res = await sendTestDocumentExpiryEmail({ recipientEmail: targetRecipient });
      console.log('✅ [Test Mode Email Execution Result]:', res);
    } catch (err) {
      console.error('❌ [Test Mode Email Error]:', err.message);
    }
  }, delayMs);

  return {
    success: true,
    message: `Test document expiry email scheduled for ${targetRecipient} in ${delayMinutes} minutes.`,
    targetRecipient,
    delayMinutes,
    scheduledAt: new Date().toISOString(),
    expectedSendTime: targetTimeStr,
  };
}

module.exports = {
  checkAndProcessDocumentExpiries,
  sendTestDocumentExpiryEmail,
  schedule20MinTestEmail,
};
