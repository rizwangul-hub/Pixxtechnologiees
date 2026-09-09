const nodemailer = require('nodemailer');

const FALLBACK_EMAIL = process.env.DOCUMENT_EXPIRY_FALLBACK_EMAIL || 'rizwangul2426@gmail.com';

/**
 * Creates reusable Nodemailer Transporter
 */
function createTransporter() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const isPort465 = Number(process.env.EMAIL_PORT) === 465;
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: isPort465, // false for 587 (STARTTLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });
  }
  return null;
}

/**
 * Sends Tenant Document Expiry Reminder Email
 */
async function sendDocumentExpiryEmail(details) {
  const {
    agentName,
    tenantName,
    propertyName,
    unitName,
    documentName,
    expiryDate,
    daysRemaining,
    recipientEmail,
    isFallbackRecipient = false,
  } = details;

  const targetRecipient = recipientEmail || FALLBACK_EMAIL;
  const subject = `Tenant Document Expiry Reminder - ${documentName} - ${tenantName}`;

  const greeting = isFallbackRecipient || !agentName
    ? 'Dear Manager,'
    : `Dear ${agentName},`;

  const fallbackNotice = isFallbackRecipient
    ? `<div style="background-color: #fffbe6; border: 1px solid #ffe58f; padding: 12px; border-radius: 6px; margin-bottom: 16px; color: #873800; font-size: 13px;">
        <strong>Manager Notice:</strong> A tenant document is due to expire in approximately one month, but no Agent is currently assigned (or the assigned Agent's email is unavailable). This notification was sent to <strong>${targetRecipient}</strong>.
       </div>`
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 24px; border: 1px solid #e5e7eb; }
        .header { text-align: center; padding-bottom: 16px; border-bottom: 2px solid #04A26F; }
        .header h2 { margin: 0; color: #04A26F; font-size: 20px; }
        .content { padding: 20px 0; font-size: 14px; line-height: 1.6; }
        .details-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px border-dashed #e5e7eb; padding-bottom: 4px; }
        .details-row:last-child { border-bottom: none; margin-bottom: 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #111827; font-weight: 600; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>PixxTechnologies Property Management</h2>
        </div>
        <div class="content">
          <p>${greeting}</p>
          <p>This is an automatic reminder from PixxTechnologies.</p>
          <p>The following tenant document is due to expire in approximately <strong>one month</strong>:</p>

          ${fallbackNotice}

          <div class="details-box">
            <div class="details-row"><span class="label">Tenant:</span> <span class="value">${tenantName}</span></div>
            <div class="details-row"><span class="label">Property:</span> <span class="value">${propertyName}</span></div>
            <div class="details-row"><span class="label">Unit:</span> <span class="value">${unitName}</span></div>
            <div class="details-row"><span class="label">Document:</span> <span class="value" style="color: #04A26F;">${documentName}</span></div>
            <div class="details-row"><span class="label">Expiry Date:</span> <span class="value" style="color: #dc2626;">${expiryDate}</span></div>
            <div class="details-row"><span class="label">Days Remaining:</span> <span class="value">${daysRemaining} days</span></div>
          </div>

          <p>Please arrange for the tenant's document to be renewed, updated, or replaced before it expires.</p>
          <p>Please update the document in the PixxTechnologies Property Management system once the new document is available.</p>

          <p>Regards,<br><strong>PixxTechnologies Property Management System</strong></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PixxTechnologies. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"PixxTechnologies" <no-reply@pixxtechnologies.com>',
        to: targetRecipient,
        subject: subject,
        html: htmlContent,
      });
      console.log(`✉ [Email Service] Expiry email sent to ${targetRecipient} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, recipient: targetRecipient };
    } catch (err) {
      console.error(`❌ [Email Service] Transport error sending to ${targetRecipient}:`, err.message);
      return { success: false, error: err.message, recipient: targetRecipient };
    }
  } else {
    // Simulated send when SMTP not configured
    console.log(`✉ [Email Service - Simulated] 30-day reminder processed for document "${documentName}" -> Recipient: ${targetRecipient}`);
    return { success: true, simulated: true, recipient: targetRecipient };
  }
}

module.exports = {
  FALLBACK_EMAIL,
  sendDocumentExpiryEmail,
};
