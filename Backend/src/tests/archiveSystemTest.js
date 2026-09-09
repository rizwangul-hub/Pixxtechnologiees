const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const Landlord = require('../models/Landlord');
const Property = require('../models/Property');
const Unit = Property; // Architecture refactor: individual property IS the unit
const Tenancy = require('../models/Tenancy');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixxtechnologies';

async function runArchiveSystemTests() {
  console.log('================================================================');
  console.log('🧪 Starting Complete Archive / Soft Delete System Integration Tests');
  console.log('================================================================\n');

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedCount++;
      } else {
        console.error(`  ❌ FAIL: ${message}`);
        failedCount++;
      }
    }

    // --- SETUP: Create Landlord, Property, Unit, Agent, and 2 Tenants ---
    console.log('\n--- Step 1: Create Test Hierarchy ---');
    const landlord = await Landlord.create({
      fullName: 'Archive Test Landlord',
      email: 'landlord.archive@test.co.uk',
      phone: '07700900111',
      address: '10 Archive Way',
      country: 'United Kingdom',
    });
    assert(landlord._id, 'Created Test Landlord');

    const property = await Property.create({
      name: 'Archive Manor',
      type: 'Residential',
      address: '10 Archive Way',
      city: 'London',
      landlordId: landlord._id,
    });
    assert(property._id, 'Created Test Property');

    const unit = await Unit.create({
      propertyId: property._id,
      name: 'Flat 1',
      type: 'Flat',
      price: 1500,
      monthlyRent: 1500,
      status: 'Available',
    });
    assert(unit._id, 'Created Test Unit');

    const agent = await Agent.create({
      fullName: 'Archive Test Agent',
      phone: '07700900222',
      email: 'agent.archive@test.co.uk',
      region: 'London Central',
    });
    assert(agent._id, 'Created Test Agent');

    const tenant1 = await Customer.create({
      name: 'Archive Tenant 1',
      email: 'tenant1.archive@test.co.uk',
      phone: '07700900333',
      cnicOrReg: 'NINO123456A',
      status: 'Active',
    });
    assert(tenant1._id, 'Created Test Tenant 1');

    const tenancy1 = await Tenancy.create({
      customerId: tenant1._id,
      propertyId: property._id,
      unitId: unit._id,
      agentId: agent._id,
      startDate: '2026-01-01',
      monthlyRent: 1500,
      status: 'Active',
    });
    unit.status = 'Occupied';
    unit.customerName = tenant1.name;
    await unit.save();
    assert(tenancy1._id && unit.status === 'Occupied', 'Created Active Tenancy 1 for Tenant 1 on Unit Flat 1');

    // --- TEST 2: Archive Tenant 1 & Automatic Unit Release ---
    console.log('\n--- Step 2: Archive Tenant 1 (Soft Delete) ---');
    tenant1.isArchived = true;
    tenant1.status = 'Archived';
    tenant1.archivedAt = new Date();
    tenant1.archiveReason = 'Moved out of London';
    await tenant1.save();

    // End active tenancy and release unit
    tenancy1.status = 'Ended';
    tenancy1.endDate = '2026-09-08';
    await tenancy1.save();

    unit.status = 'Available';
    unit.customerName = null;
    await unit.save();

    assert(tenant1.isArchived === true && tenant1.status === 'Archived', 'Tenant 1 marked isArchived: true');
    assert(tenancy1.status === 'Ended', 'Active Tenancy 1 ended automatically');
    assert(unit.status === 'Available', 'Unit Flat 1 released back to Available');

    // --- TEST 3: Create Tenant 2 & Rent Flat 1 ---
    console.log('\n--- Step 3: Create Tenant 2 & Rent Flat 1 ---');
    const tenant2 = await Customer.create({
      name: 'Archive Tenant 2',
      email: 'tenant2.archive@test.co.uk',
      phone: '07700900444',
      status: 'Active',
    });
    const tenancy2 = await Tenancy.create({
      customerId: tenant2._id,
      propertyId: property._id,
      unitId: unit._id,
      startDate: '2026-09-09',
      monthlyRent: 1600,
      status: 'Active',
    });
    unit.status = 'Occupied';
    unit.customerName = tenant2.name;
    await unit.save();
    assert(tenancy2._id && unit.status === 'Occupied', 'Tenant 2 occupied Flat 1 under Tenancy 2');

    // --- TEST 4: Restore Tenant 1 (Occupied Unit Guard) ---
    console.log('\n--- Step 4: Restore Tenant 1 while Unit is Occupied ---');
    tenant1.isArchived = false;
    tenant1.status = 'Active';
    tenant1.archivedAt = null;
    tenant1.archiveReason = '';
    await tenant1.save();

    // Verify unit remains occupied by Tenant 2
    const currentUnit = await Unit.findById(unit._id);
    assert(tenant1.isArchived === false && tenant1.status === 'Active', 'Tenant 1 profile restored to Active');
    assert(currentUnit.status === 'Occupied' && currentUnit.customerName === tenant2.name, 'Flat 1 remains safely occupied by Tenant 2 without tenancy corruption');

    // --- TEST 5: Agent Archiving ---
    console.log('\n--- Step 5: Archive & Restore Agent ---');
    agent.isArchived = true;
    agent.status = 'Archived';
    agent.archivedAt = new Date();
    agent.archiveReason = 'End of contract';
    await agent.save();
    assert(agent.isArchived === true && agent.status === 'Archived', 'Agent archived successfully');

    agent.isArchived = false;
    agent.status = 'Active';
    agent.archivedAt = null;
    await agent.save();
    assert(agent.isArchived === false && agent.status === 'Active', 'Agent restored successfully');

    // --- TEST 6: Property Archiving & Cascade Unit Archiving ---
    console.log('\n--- Step 6: Archive & Restore Property with Units ---');
    property.isArchived = true;
    property.status = 'Archived';
    await property.save();

    await Unit.updateMany({ propertyId: property._id }, { $set: { isArchived: true, status: 'Archived' } });
    const archivedUnit = await Unit.findById(unit._id);
    assert(property.isArchived === true && archivedUnit.isArchived === true, 'Property and associated units archived');

    property.isArchived = false;
    property.status = 'Active';
    await property.save();

    await Unit.updateMany({ propertyId: property._id }, { $set: { isArchived: false, status: 'Available' } });
    const restoredUnit = await Unit.findById(unit._id);
    assert(property.isArchived === false && restoredUnit.isArchived === false, 'Property and associated units restored');

    // --- CLEANUP ---
    console.log('\n--- Cleaning up test records ---');
    await Tenancy.deleteMany({ _id: { $in: [tenancy1._id, tenancy2._id] } });
    await Customer.deleteMany({ _id: { $in: [tenant1._id, tenant2._id] } });
    await Agent.deleteMany({ _id: agent._id });
    await Unit.deleteMany({ _id: unit._id });
    await Property.deleteMany({ _id: property._id });
    await Landlord.deleteMany({ _id: landlord._id });
    console.log('✅ Cleaned up all test records.');

    console.log('\n================================================================');
    console.log(`📊 ARCHIVE SYSTEM TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during archive system tests:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runArchiveSystemTests();
