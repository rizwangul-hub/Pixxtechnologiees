const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = require('../app');
const Landlord = require('../models/Landlord');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Payment = require('../models/Payment');
const Agent = require('../models/Agent');

let server;
let port;
let authToken;

function makeRequest(pathStr, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: port,
        path: pathStr,
        method: method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const bodyBuffer = Buffer.concat(chunks);
          let json = null;
          try {
            json = JSON.parse(bodyBuffer.toString('utf8'));
          } catch (e) {
            // Binary response
          }
          resolve({ status: res.statusCode, headers: res.headers, json, buffer: bodyBuffer });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runReportingSystemTest() {
  console.log('================================================================');
  console.log('  PIXXTECHNOLOGIES AUTOMATED REPORTING SYSTEM INTEGRATION TEST  ');
  console.log('================================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pixx_property_db';
    await mongoose.connect(mongoUri);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;

    // 1. Manager Login
    console.log('[Step 1] Logging in as Manager...');
    const loginPayload = JSON.stringify({ email: 'manager@pixxtechnologies.com', password: 'admin123' });
    const loginRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: 'localhost',
          port: port,
          path: '/api/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginPayload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(loginPayload);
      req.end();
    });

    if (loginRes.status === 200 && loginRes.json?.token) {
      authToken = loginRes.json.token;
      console.log('  ✓ Manager logged in successfully. JWT Token acquired.');
    } else {
      throw new Error('Manager login failed');
    }

    // 2. Create Test Records
    console.log('\n[Step 2] Creating Landlord, Property, Unit, Agent, Tenant & Tenancy...');
    const landlord = await Landlord.create({
      fullName: 'Old Street Holdings Ltd',
      email: 'info@oldstreet.co.uk',
      phone: '+44 20 7946 0912',
      address: '10 Old Street, London, EC1V 9BD',
    });

    const property = await Property.create({
      landlordId: landlord._id,
      title: '127 Southend Road',
      name: '127 Southend Road',
      type: 'Residential',
      address: '127 Southend Road, Rochford, Essex, SS4 1HX',
    });

    const unit = await Unit.create({
      propertyId: property._id,
      name: 'Main House',
      type: 'House',
      price: 1666.67,
      status: 'Occupied',
    });

    const agent = await Agent.create({
      fullName: 'Prime Estates Agent',
      phone: '03001234567',
      email: 'agent@primeestates.com',
    });

    const tenant = await Customer.create({
      fullName: 'PENNS INC.LTD',
      name: 'PENNS INC.LTD',
      email: 'finance@pennsinc.co.uk',
      phone: '+44 7700 900077',
      address: '15, MANOR CLOSE, DAGENHAM, RM10 8BH',
    });

    const tenancy = await Tenancy.create({
      customerId: tenant._id,
      propertyId: property._id,
      unitId: unit._id,
      agentId: agent._id,
      companyMonthlyAmount: 1500,
      monthlyRent: 1666.67,
      startDate: '2025-09-08',
      endDate: '2026-09-08',
      status: 'Active',
    });

    // 3. Create Transactions (Rent Charges & Payments)
    console.log('\n[Step 3] Creating Transactions (Rent charges & Payments)...');
    await Payment.create([
      {
        customerId: tenant._id,
        propertyId: property._id,
        unitId: unit._id,
        tenancyId: tenancy._id,
        amount: 1666.67,
        paidAmount: 500.0,
        remainingAmount: 1166.67,
        dueDate: '2025-09-08',
        paidDate: '2025-09-29',
        billingMonth: 9,
        billingYear: 2025,
        status: 'Partially Paid',
      },
      {
        customerId: tenant._id,
        propertyId: property._id,
        unitId: unit._id,
        tenancyId: tenancy._id,
        amount: 1666.67,
        paidAmount: 1666.67,
        remainingAmount: 0,
        dueDate: '2025-10-08',
        paidDate: '2025-10-08',
        billingMonth: 10,
        billingYear: 2025,
        status: 'Paid',
      },
    ]);

    console.log('  ✓ Transactions created successfully.');

    // 4. Test GET /api/reports/tenant-statement/:tenantId
    console.log('\n[Step 4] Testing Tenant Statement JSON API...');
    const statementRes = await makeRequest(
      `/api/reports/tenant-statement/${tenant._id}?fromDate=2025-09-01&toDate=2026-09-08`
    );
    console.log('  ✓ HTTP Status:', statementRes.status);
    console.log('  ✓ Report Type:', statementRes.json?.data?.reportType);
    console.log('  ✓ Landlord Name:', statementRes.json?.data?.landlord?.name);
    console.log('  ✓ Tenant Name:', statementRes.json?.data?.tenant?.name);
    console.log('  ✓ Property Name:', statementRes.json?.data?.property?.name);
    console.log('  ✓ Total Rent Due:', statementRes.json?.data?.summary?.totalRentDueFormatted);
    console.log('  ✓ Total Payments:', statementRes.json?.data?.summary?.totalPaymentsFormatted);
    console.log('  ✓ Total Outstanding:', statementRes.json?.data?.summary?.totalOutstandingFormatted);

    if (
      statementRes.status !== 200 ||
      statementRes.json?.data?.tenant?.name !== 'PENNS INC.LTD'
    ) {
      throw new Error('Tenant Statement JSON API validation failed');
    }

    // 5. Test PDF Generation: GET /api/reports/tenant-statement/:tenantId/pdf
    console.log('\n[Step 5] Testing Tenant Statement PDF Generation...');
    const pdfRes = await makeRequest(`/api/reports/tenant-statement/${tenant._id}/pdf`);
    console.log('  ✓ HTTP Status:', pdfRes.status);
    console.log('  ✓ Content-Type:', pdfRes.headers['content-type']);
    console.log('  ✓ PDF Buffer Size:', pdfRes.buffer.length, 'bytes');

    if (pdfRes.status !== 200 || pdfRes.headers['content-type'] !== 'application/pdf') {
      throw new Error('Tenant Statement PDF generation failed');
    }

    // 6. Test Word Generation: GET /api/reports/tenant-statement/:tenantId/word
    console.log('\n[Step 6] Testing Tenant Statement Word (.docx) Generation...');
    const wordRes = await makeRequest(`/api/reports/tenant-statement/${tenant._id}/word`);
    console.log('  ✓ HTTP Status:', wordRes.status);
    console.log('  ✓ Content-Type:', wordRes.headers['content-type']);
    console.log('  ✓ Word Buffer Size:', wordRes.buffer.length, 'bytes');

    if (
      wordRes.status !== 200 ||
      !wordRes.headers['content-type'].includes('wordprocessingml')
    ) {
      throw new Error('Tenant Statement Word (.docx) generation failed');
    }

    // 7. Test Landlord Report Excel: GET /api/reports/landlord/:landlordId/excel
    console.log('\n[Step 7] Testing Landlord Report Excel (.xlsx) Generation...');
    const landlordExcelRes = await makeRequest(`/api/reports/landlord/${landlord._id}/excel`);
    console.log('  ✓ HTTP Status:', landlordExcelRes.status);
    console.log('  ✓ Content-Type:', landlordExcelRes.headers['content-type']);
    console.log('  ✓ Excel Buffer Size:', landlordExcelRes.buffer.length, 'bytes');

    if (
      landlordExcelRes.status !== 200 ||
      !landlordExcelRes.headers['content-type'].includes('spreadsheetml')
    ) {
      throw new Error('Landlord Excel generation failed');
    }

    // 8. Test Agent Report Excel: GET /api/reports/agent/:agentId/excel
    console.log('\n[Step 8] Testing Agent Report Excel (.xlsx) Generation...');
    const agentExcelRes = await makeRequest(`/api/reports/agent/${agent._id}/excel`);
    console.log('  ✓ HTTP Status:', agentExcelRes.status);
    console.log('  ✓ Content-Type:', agentExcelRes.headers['content-type']);
    console.log('  ✓ Excel Buffer Size:', agentExcelRes.buffer.length, 'bytes');

    if (
      agentExcelRes.status !== 200 ||
      !agentExcelRes.headers['content-type'].includes('spreadsheetml')
    ) {
      throw new Error('Agent Excel generation failed');
    }

    // 9. Test Financial Summary: GET /api/reports/financial-summary
    console.log('\n[Step 9] Testing Financial Summary Report API...');
    const finRes = await makeRequest('/api/reports/financial-summary');
    console.log('  ✓ HTTP Status:', finRes.status);
    console.log('  ✓ Report Type:', finRes.json?.data?.reportType);
    console.log(
      '  ✓ Net Financial Position:',
      finRes.json?.data?.summary?.netFinancialPositionFormatted
    );

    if (finRes.status !== 200 || !finRes.json?.data?.summary) {
      throw new Error('Financial Summary API failed');
    }

    // 10. Clean up test records
    console.log('\n[Step 10] Cleaning up test records...');
    await Payment.deleteMany({ customerId: tenant._id });
    await Tenancy.deleteOne({ _id: tenancy._id });
    await Customer.deleteOne({ _id: tenant._id });
    await Unit.deleteOne({ _id: unit._id });
    await Property.deleteOne({ _id: property._id });
    await Landlord.deleteOne({ _id: landlord._id });
    await Agent.deleteOne({ _id: agent._id });
    console.log('  ✓ Test cleanup completed.');

    console.log('\n================================================================');
    console.log('  🎉 ALL 10 REPORTING SYSTEM INTEGRATION TESTS PASSED 100%       ');
    console.log('================================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runReportingSystemTest();
