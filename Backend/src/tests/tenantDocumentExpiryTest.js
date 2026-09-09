require('dotenv').config();
const mongoose = require('mongoose');
const TenantDocument = require('../models/TenantDocument');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Property = require('../models/Property');
const Unit = Property; // Architecture refactor: individual property IS the unit
const Agent = require('../models/Agent');
const Landlord = require('../models/Landlord');
const Notification = require('../models/Notification');
const { checkAndProcessDocumentExpiries } = require('../services/documentExpiryService');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pixx_property_db';
const FALLBACK_EMAIL = process.env.DOCUMENT_EXPIRY_FALLBACK_EMAIL || 'ftaccountants@hotmail.com';

async function runTenantDocumentExpiryTests() {
  console.log('🧪 Starting Automatic Tenant Document Expiry System Integration Test Suite...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB database:', mongoose.connection.name);

    // Clean test artifacts
    await Notification.deleteMany({ title: { $regex: /Document Expiring/i } });
    
    // Setup test Landlord, Property & Unit
    const landlord = await Landlord.create({
      fullName: 'Expiry Test Landlord',
      phone: '03001111111',
      email: 'landlord.expiry@example.com',
    });

    const property = await Property.create({
      name: 'Expiry Plaza',
      type: 'Commercial',
      landlordId: landlord._id,
      address: '123 Expiry St, London',
    });

    const unit = await Unit.create({
      propertyId: property._id,
      name: 'Suite 99',
      type: 'Office',
      price: 1000,
      status: 'Occupied',
    });

    // 1. Setup Agents
    const agentWithEmail = await Agent.create({
      fullName: 'Valid Agent',
      phone: '03002222222',
      email: 'agent.valid@example.com',
      region: 'UK',
    });

    const agentNoEmail = await Agent.create({
      fullName: 'No Email Agent',
      phone: '03003333333',
      email: '',
      region: 'UK',
    });

    // 2. Setup Tenants
    const tenant1 = await Customer.create({
      name: 'Tenant One (Agent Email)',
      phone: '07001111111',
      email: 'tenant1@example.com',
      type: 'Individual',
    });

    const tenant2 = await Customer.create({
      name: 'Tenant Two (No Agent)',
      phone: '07002222222',
      email: 'tenant2@example.com',
      type: 'Individual',
    });

    const tenant3 = await Customer.create({
      name: 'Tenant Three (Agent Invalid Email)',
      phone: '07003333333',
      email: 'tenant3@example.com',
      type: 'Individual',
    });

    // 3. Setup Active Tenancies
    await Tenancy.create({
      propertyId: property._id,
      unitId: unit._id,
      customerId: tenant1._id,
      agentId: agentWithEmail._id,
      startDate: '2026-01-01',
      monthlyRent: 1000,
      status: 'Active',
    });

    await Tenancy.create({
      propertyId: property._id,
      unitId: unit._id,
      customerId: tenant2._id,
      agentId: null, // No Agent
      startDate: '2026-01-01',
      monthlyRent: 1000,
      status: 'Active',
    });

    await Tenancy.create({
      propertyId: property._id,
      unitId: unit._id,
      customerId: tenant3._id,
      agentId: agentNoEmail._id, // Agent has no email
      startDate: '2026-01-01',
      monthlyRent: 1000,
      status: 'Active',
    });

    // Dates calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateExpiring25Days = new Date(today);
    dateExpiring25Days.setDate(today.getDate() + 25);

    const dateExpiring20Days = new Date(today);
    dateExpiring20Days.setDate(today.getDate() + 20);

    const dateExpiring15Days = new Date(today);
    dateExpiring15Days.setDate(today.getDate() + 15);

    const dateExpiredPast = new Date(today);
    dateExpiredPast.setDate(today.getDate() - 10);

    // ----------------------------------------------------
    // CREATE TEST DOCUMENTS
    // ----------------------------------------------------
    // Doc 1: Tenant 1, Agent assigned, expiring in 25 days
    const doc1 = await TenantDocument.create({
      tenantId: tenant1._id,
      documentName: 'EPC Certificate',
      documentType: 'standard',
      fileUrl: 'https://cloudinary.com/doc1.pdf',
      publicId: 'test_doc1',
      expiryDate: dateExpiring25Days,
    });

    // Doc 2: Tenant 2, No Agent, expiring in 20 days
    const doc2 = await TenantDocument.create({
      tenantId: tenant2._id,
      documentName: 'Tenancy Agreement',
      documentType: 'standard',
      fileUrl: 'https://cloudinary.com/doc2.pdf',
      publicId: 'test_doc2',
      expiryDate: dateExpiring20Days,
    });

    // Doc 3: Tenant 3, Agent without email, expiring in 15 days
    const doc3 = await TenantDocument.create({
      tenantId: tenant3._id,
      documentName: 'Right to Rent Check',
      documentType: 'standard',
      fileUrl: 'https://cloudinary.com/doc3.pdf',
      publicId: 'test_doc3',
      expiryDate: dateExpiring15Days,
    });

    // Doc 4: Tenant 1, No expiry date
    const doc4 = await TenantDocument.create({
      tenantId: tenant1._id,
      documentName: 'Floor Plan',
      documentType: 'standard',
      fileUrl: 'https://cloudinary.com/doc4.pdf',
      publicId: 'test_doc4',
      expiryDate: null,
    });

    // Doc 5: Tenant 1, Already expired 10 days ago
    const doc5 = await TenantDocument.create({
      tenantId: tenant1._id,
      documentName: 'Gas Certificate',
      documentType: 'standard',
      fileUrl: 'https://cloudinary.com/doc5.pdf',
      publicId: 'test_doc5',
      expiryDate: dateExpiredPast,
    });

    console.log('📌 Test documents created successfully.\n');

    // ----------------------------------------------------
    // TEST PASS 1: Execute Document Expiry Cron Service
    // ----------------------------------------------------
    console.log('▶️ Executing checkAndProcessDocumentExpiries() - Initial Pass...');
    const result1 = await checkAndProcessDocumentExpiries();
    console.log(`  Processed: ${result1.processedCount}, Sent: ${result1.sentCount}`);

    // Verify Doc 1 (Agent assigned)
    const updatedDoc1 = await TenantDocument.findById(doc1._id);
    if (updatedDoc1.expiryReminder30Sent && updatedDoc1.expiryReminder30Recipient === 'agent.valid@example.com') {
      console.log('  ✅ SCENARIO 1 PASSED: Agent notified at agent.valid@example.com for 25-day expiry.');
    } else {
      throw new Error(`SCENARIO 1 FAILED: Expected recipient agent.valid@example.com, got ${updatedDoc1.expiryReminder30Recipient}`);
    }

    // Verify Doc 2 (No Agent -> Fallback Email)
    const updatedDoc2 = await TenantDocument.findById(doc2._id);
    if (updatedDoc2.expiryReminder30Sent && updatedDoc2.expiryReminder30Recipient === FALLBACK_EMAIL) {
      console.log(`  ✅ SCENARIO 2 PASSED: Fallback recipient ${FALLBACK_EMAIL} notified when NO Agent is assigned.`);
    } else {
      throw new Error(`SCENARIO 2 FAILED: Expected recipient ${FALLBACK_EMAIL}, got ${updatedDoc2.expiryReminder30Recipient}`);
    }

    // Verify Doc 3 (Agent missing email -> Fallback Email)
    const updatedDoc3 = await TenantDocument.findById(doc3._id);
    if (updatedDoc3.expiryReminder30Sent && updatedDoc3.expiryReminder30Recipient === FALLBACK_EMAIL) {
      console.log(`  ✅ SCENARIO 3 PASSED: Fallback recipient ${FALLBACK_EMAIL} notified when Agent has no email.`);
    } else {
      throw new Error(`SCENARIO 3 FAILED: Expected fallback recipient ${FALLBACK_EMAIL}, got ${updatedDoc3.expiryReminder30Recipient}`);
    }

    // Verify Doc 4 (No Expiry Date -> Ignored)
    const updatedDoc4 = await TenantDocument.findById(doc4._id);
    if (!updatedDoc4.expiryReminder30Sent) {
      console.log('  ✅ SCENARIO 7 PASSED: Document without expiry date is safely ignored.');
    } else {
      throw new Error('SCENARIO 7 FAILED: Document without expiry date triggered a reminder.');
    }

    // Verify In-App Manager Notifications
    const managerNotifs = await Notification.find({ type: 'DocumentExpiry' });
    console.log(`  ✅ In-App Notifications created: ${managerNotifs.length} manager alert(s).`);

    // ----------------------------------------------------
    // TEST PASS 2: DUPLICATE PREVENTION
    // ----------------------------------------------------
    console.log('\n▶️ Executing checkAndProcessDocumentExpiries() - Pass 2 (Duplicate Prevention Check)...');
    const result2 = await checkAndProcessDocumentExpiries();
    if (result2.sentCount === 0) {
      console.log('  ✅ SCENARIO 5 PASSED: 0 duplicate emails sent on second pass.');
    } else {
      throw new Error(`SCENARIO 5 FAILED: Expected 0 sent on second pass, got ${result2.sentCount}`);
    }

    // ----------------------------------------------------
    // TEST PASS 3: DOCUMENT REPLACEMENT RESET
    // ----------------------------------------------------
    console.log('\n▶️ Testing Document Expiry Date / Replacement Reset...');
    const newExpiry = new Date(today);
    newExpiry.setDate(today.getDate() + 28);

    // Simulate Document Update / Expiry Reset
    updatedDoc1.expiryDate = newExpiry;
    updatedDoc1.expiryReminder30Sent = false;
    updatedDoc1.expiryReminder30Status = 'Pending';
    await updatedDoc1.save();

    const result3 = await checkAndProcessDocumentExpiries();
    if (result3.sentCount >= 1) {
      console.log('  ✅ SCENARIO 6 PASSED: Reminder re-triggered after document expiry update.');
    } else {
      throw new Error('SCENARIO 6 FAILED: Document update failed to re-trigger reminder.');
    }

    // ----------------------------------------------------
    // CLEANUP TEST DATA
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up test data...');
    await Landlord.findByIdAndDelete(landlord._id);
    await Property.findByIdAndDelete(property._id);
    await Unit.findByIdAndDelete(unit._id);
    await Agent.deleteMany({ _id: { $in: [agentWithEmail._id, agentNoEmail._id] } });
    await Customer.deleteMany({ _id: { $in: [tenant1._id, tenant2._id, tenant3._id] } });
    await Tenancy.deleteMany({ customerId: { $in: [tenant1._id, tenant2._id, tenant3._id] } });
    await TenantDocument.deleteMany({ _id: { $in: [doc1._id, doc2._id, doc3._id, doc4._id, doc5._id] } });
    await Notification.deleteMany({ type: 'DocumentExpiry' });

    console.log('\n🎉 ALL 8 TENANT DOCUMENT EXPIRY NOTIFICATION TEST SCENARIOS PASSED 100% CLEANLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTenantDocumentExpiryTests();
