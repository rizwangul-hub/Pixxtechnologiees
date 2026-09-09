const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixxtechnologies';

async function migrate() {
  console.log('====================================================');
  console.log('Starting Data Flattening Migration: Unit -> Property');
  console.log('====================================================');

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = (await db.listCollections().toArray()).map(c => c.name);

    if (!collections.includes('units')) {
      console.log('No units collection found. Nothing to migrate.');
      process.exit(0);
    }

    const unitsCollection = db.collection('units');
    const propertiesCollection = db.collection('properties');
    const tenanciesCollection = db.collection('tenancies');
    const paymentsCollection = db.collection('payments');
    const rentpaymentsCollection = db.collection('rentpayments');
    const agentpaymentsCollection = db.collection('agentpayments');
    const agentexpensesCollection = db.collection('agentexpenses');
    const agreementsCollection = db.collection('agreements');
    const invoicesCollection = db.collection('invoices');
    const transactionledgersCollection = db.collection('transactionledgers');

    const oldUnits = await unitsCollection.find({}).toArray();
    console.log(`Found ${oldUnits.length} units to migrate.`);

    if (oldUnits.length === 0) {
      console.log('No units to migrate.');
      process.exit(0);
    }

    // Map parent property IDs for lookup
    const parentPropertyIds = [...new Set(oldUnits.map(u => u.propertyId ? u.propertyId.toString() : null).filter(Boolean))];
    const parentProperties = await propertiesCollection.find({
      _id: { $in: parentPropertyIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    const parentMap = new Map();
    parentProperties.forEach(p => parentMap.set(p._id.toString(), p));

    console.log(`Found ${parentProperties.length} parent container properties.`);

    let migratedProperties = 0;
    for (const unit of oldUnits) {
      const parent = (unit.propertyId && parentMap.get(unit.propertyId.toString())) || {};

      // Determine the new Property document using unit's ID
      const newPropertyDoc = {
        _id: unit._id, // KEEP SAME ID so existing unitId references become valid propertyId!
        landlordId: parent.landlordId || unit.landlordId,
        name: unit.name || `Property ${unit._id.toString().slice(-4)}`,
        type: unit.type || parent.type || 'Shop',
        floor: unit.floor || 'Ground',
        size: unit.size || '',
        sizeUnit: unit.sizeUnit || 'sq ft',
        price: unit.price || unit.monthlyRent || 0,
        monthlyRent: unit.monthlyRent || unit.price || 0,
        salePrice: unit.salePrice || 0,
        priceType: unit.priceType || 'monthly_rent',
        address: parent.address || unit.address || '',
        city: parent.city || unit.city || '',
        area: parent.area || unit.area || '',
        county: parent.county || unit.county || '',
        postcode: parent.postcode || unit.postcode || '',
        description: unit.description || parent.description || '',
        status: unit.status || 'Available',
        customerName: unit.customerName || null,
        images: unit.images && unit.images.length > 0 ? unit.images : (parent.images || []),
        notes: unit.notes || '',
        isArchived: Boolean(unit.isArchived),
        archivedAt: unit.archivedAt || null,
        archivedBy: unit.archivedBy || null,
        archiveReason: unit.archiveReason || '',
        managerId: unit.managerId || parent.managerId || null,
        createdAt: unit.createdAt || new Date(),
        updatedAt: new Date()
      };

      await propertiesCollection.replaceOne(
        { _id: unit._id },
        newPropertyDoc,
        { upsert: true }
      );
      migratedProperties++;
    }
    console.log(`Successfully migrated ${migratedProperties} units into properties collection.`);

    // Update references in related collections:
    console.log('Updating references across collections (setting propertyId = unitId)...');

    // 1. Tenancies
    const tenanciesWithUnit = await tenanciesCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const t of tenanciesWithUnit) {
      const parent = t.propertyId ? parentMap.get(t.propertyId.toString()) : null;
      await tenanciesCollection.updateOne(
        { _id: t._id },
        { 
          $set: { 
            propertyId: t.unitId,
            landlordId: (parent && parent.landlordId) || t.landlordId
          },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${tenanciesWithUnit.length} tenancies.`);

    // 2. Payments
    const paymentsWithUnit = await paymentsCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const p of paymentsWithUnit) {
      await paymentsCollection.updateOne(
        { _id: p._id },
        { 
          $set: { propertyId: p.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${paymentsWithUnit.length} payments.`);

    // 3. RentPayments
    const rentPaymentsWithUnit = await rentpaymentsCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const rp of rentPaymentsWithUnit) {
      await rentpaymentsCollection.updateOne(
        { _id: rp._id },
        { 
          $set: { propertyId: rp.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${rentPaymentsWithUnit.length} rent payments.`);

    // 4. Invoices
    const invoicesWithUnit = await invoicesCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const inv of invoicesWithUnit) {
      await invoicesCollection.updateOne(
        { _id: inv._id },
        { 
          $set: { propertyId: inv.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${invoicesWithUnit.length} invoices.`);

    // 5. Agent Payments
    const agentPaymentsWithUnit = await agentpaymentsCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const ap of agentPaymentsWithUnit) {
      await agentpaymentsCollection.updateOne(
        { _id: ap._id },
        { 
          $set: { propertyId: ap.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${agentPaymentsWithUnit.length} agent payments.`);

    // 6. Agent Expenses
    const agentExpensesWithUnit = await agentexpensesCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const ae of agentExpensesWithUnit) {
      await agentexpensesCollection.updateOne(
        { _id: ae._id },
        { 
          $set: { propertyId: ae.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${agentExpensesWithUnit.length} agent expenses.`);

    // 7. Agreements
    const agreementsWithUnit = await agreementsCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const ag of agreementsWithUnit) {
      await agreementsCollection.updateOne(
        { _id: ag._id },
        { 
          $set: { propertyId: ag.unitId },
          $unset: { unitId: "", unitName: "" }
        }
      );
    }
    console.log(`  - Updated ${agreementsWithUnit.length} agreements.`);

    // 8. Transaction Ledger
    const ledgerWithUnit = await transactionledgersCollection.find({ unitId: { $exists: true, $ne: null } }).toArray();
    for (const l of ledgerWithUnit) {
      await transactionledgersCollection.updateOne(
        { _id: l._id },
        { 
          $set: { propertyId: l.unitId },
          $unset: { unitId: "" }
        }
      );
    }
    console.log(`  - Updated ${ledgerWithUnit.length} ledger entries.`);

    // Backup and remove old parent container properties
    console.log('Archiving old parent properties to legacy_container_properties collection...');
    if (parentProperties.length > 0) {
      const backupCollection = db.collection('legacy_container_properties');
      await backupCollection.deleteMany({});
      await backupCollection.insertMany(parentProperties);
      await propertiesCollection.deleteMany({
        _id: { $in: parentProperties.map(p => p._id) }
      });
      console.log(`Backed up and removed ${parentProperties.length} old container properties.`);
    }

    // Rename units collection to backup
    await unitsCollection.rename('legacy_units_backup');
    console.log('Renamed units collection to legacy_units_backup.');

    console.log('====================================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
