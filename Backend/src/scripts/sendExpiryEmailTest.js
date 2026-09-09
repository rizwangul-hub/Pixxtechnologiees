const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { sendTestDocumentExpiryEmail } = require('../services/documentExpiryService');

const recipient = 'mernstack2426@gmail.com';
const delayMs = 60 * 1000; // 1 minute (60 seconds)

console.log(`⏱️ Waiting 1 minute (60 seconds) before sending document expiry email to ${recipient}...`);
setTimeout(async () => {
  console.log(`⏰ 1 minute timer elapsed! Sending document expiry email to ${recipient} now...`);
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
    }
    const result = await sendTestDocumentExpiryEmail({ recipientEmail: recipient });
    console.log('✅ Email send result:', result);
  } catch (err) {
    console.error('❌ Error sending test expiry email:', err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}, delayMs);
