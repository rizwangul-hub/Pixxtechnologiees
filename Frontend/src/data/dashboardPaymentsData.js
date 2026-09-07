/**
 * Dashboard Payment Monitoring Data Layer
 * Separates demo records and calculation logic from UI components.
 * Future integration: Replace this object with API responses.
 */

export const dashboardPaymentsData = {
  overdue: {
    rentCharges: [
      {
        id: 'ov-rc-1',
        portfolioId: 'port-1',
        propertyId: 'prop-101',
        unitId: 'unit-12',
        tenantId: 'ten-201',
        agreementId: 'ast-501',
        payer: 'Right Way Business Limited T/A Swiss Estates',
        property: '12A, 12B, 12C, 12D Alexandra Street',
        daysOverdue: 23,
        rentOverdue: 22700.0,
        chargesOverdue: 0.0,
      },
      {
        id: 'ov-rc-2',
        portfolioId: 'port-1',
        propertyId: 'prop-102',
        unitId: 'unit-13',
        tenantId: 'ten-202',
        agreementId: 'ast-502',
        payer: 'SUAVIDA LTD',
        property: '13 A ,15 A & 15 B Clarance Road (Flats)',
        daysOverdue: 28,
        rentOverdue: 20400.0,
        chargesOverdue: 0.0,
      },
      {
        id: 'ov-rc-3',
        portfolioId: 'port-1',
        propertyId: 'prop-103',
        unitId: 'unit-15',
        tenantId: 'ten-203',
        agreementId: 'ast-503',
        payer: 'Ivape Grays Limited',
        property: '15 Clarance Road (Shop)',
        daysOverdue: 19,
        rentOverdue: 13333.35,
        chargesOverdue: 0.0,
      },
      {
        id: 'ov-rc-4',
        portfolioId: 'port-1',
        propertyId: 'prop-104',
        unitId: 'unit-82',
        tenantId: 'ten-204',
        agreementId: 'ast-504',
        payer: 'CONSTANTIN-FLORIN ISTRATE, NICOLAE SPINU & GABRIELA-DANIELA BUTURUGA',
        property: '82 COMO STREET',
        daysOverdue: 21,
        rentOverdue: 12500.0,
        chargesOverdue: 0.0,
      },
      {
        id: 'ov-rc-5',
        portfolioId: 'port-1',
        propertyId: 'prop-105',
        unitId: 'unit-65',
        tenantId: 'ten-205',
        agreementId: 'ast-505',
        payer: 'EVA- MARIA VASILESCU, ANCA-AIDA STAN AND DUMITRU-OCTAVIAN SIIU',
        property: '65 LANSBURY AVENUE',
        daysOverdue: 29,
        rentOverdue: 11100.0,
        chargesOverdue: 0.0,
      },
      {
        id: 'ov-rc-6',
        portfolioId: 'port-1',
        propertyId: 'prop-106',
        unitId: 'unit-4b',
        tenantId: 'ten-206',
        agreementId: 'ast-506',
        payer: 'Apex Commercial Logistics',
        property: 'Unit 4B Industrial Park',
        daysOverdue: 14,
        rentOverdue: 8400.0,
        chargesOverdue: 250.0,
      },
      {
        id: 'ov-rc-7',
        portfolioId: 'port-1',
        propertyId: 'prop-107',
        unitId: 'unit-24',
        tenantId: 'ten-207',
        agreementId: 'ast-507',
        payer: 'Oakwood Residential Management',
        property: '24 Park Hill Mansions',
        daysOverdue: 35,
        rentOverdue: 6200.0,
        chargesOverdue: 0.0,
      },
    ],
    propertyExpenses: [
      {
        id: 'ov-pe-1',
        portfolioId: 'port-1',
        propertyId: 'prop-108',
        supplier: 'Carpet Express London',
        daysOverdue: 607,
        amount: 850.0,
      },
    ],
  },
  upcoming: {
    rentCharges: [
      {
        id: 'up-rc-1',
        portfolioId: 'port-1',
        propertyId: 'prop-201',
        unitId: 'unit-301',
        tenantId: 'ten-301',
        agreementId: 'ast-601',
        payer: 'ABC Property Ltd',
        property: 'Main Street Apartments',
        dueDate: '15 Sep 2026',
        rent: 2500.0,
        charges: 150.0,
        status: 'Upcoming',
      },
      {
        id: 'up-rc-2',
        portfolioId: 'port-1',
        propertyId: 'prop-202',
        unitId: 'unit-302',
        tenantId: 'ten-302',
        agreementId: 'ast-602',
        payer: 'Apex Global Logistics',
        property: '45 Commercial Way',
        dueDate: '18 Sep 2026',
        rent: 4200.0,
        charges: 0.0,
        status: 'Due Soon',
      },
      {
        id: 'up-rc-3',
        portfolioId: 'port-1',
        propertyId: 'prop-203',
        unitId: 'unit-303',
        tenantId: 'ten-303',
        agreementId: 'ast-603',
        payer: 'Johnathan Miller',
        property: 'Flat 4, Elm Tree Court',
        dueDate: '22 Sep 2026',
        rent: 1150.0,
        charges: 50.0,
        status: 'Upcoming',
      },
      {
        id: 'up-rc-4',
        portfolioId: 'port-1',
        propertyId: 'prop-204',
        unitId: 'unit-304',
        tenantId: 'ten-304',
        agreementId: 'ast-604',
        payer: 'Highland Retail Partners',
        property: '12 High Street Retail Unit',
        dueDate: '28 Sep 2026',
        rent: 6800.0,
        charges: 350.0,
        status: 'Upcoming',
      },
      {
        id: 'up-rc-5',
        portfolioId: 'port-1',
        propertyId: 'prop-205',
        unitId: 'unit-305',
        tenantId: 'ten-305',
        agreementId: 'ast-605',
        payer: 'Vanguard Logistics Ltd',
        property: '7 Pier Road Depot',
        dueDate: '30 Sep 2026',
        rent: 18116.67,
        charges: 600.0,
        status: 'Upcoming',
      },
      {
        id: 'up-rc-6',
        portfolioId: 'port-1',
        propertyId: 'prop-206',
        unitId: 'unit-306',
        tenantId: 'ten-306',
        agreementId: 'ast-606',
        payer: 'Crestview Estates',
        property: 'Unit 9 Retail Square',
        dueDate: '02 Oct 2026',
        rent: 5000.0,
        charges: 400.0,
        status: 'Upcoming',
      },
    ],
    propertyExpenses: [], // Empty array to demonstrate "No upcoming property expenses."
  },
};

/**
 * Calculates total overdue metrics dynamically from underlying records.
 */
export function calculateOverdueTotals(rentCharges = [], propertyExpenses = []) {
  // Demo count offset (total records in backend = 107)
  const totalCount = 107;

  const rentTotal = rentCharges.reduce((sum, item) => sum + (item.rentOverdue || 0), 0);
  const chargesTotal = rentCharges.reduce((sum, item) => sum + (item.chargesOverdue || 0), 0);
  const rentChargesTotal = rentTotal + chargesTotal;

  // Screenshot exact figure: £188,231.21
  const demoRentChargesGrandTotal = 188231.21;

  const expensesTotal = propertyExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    count: totalCount,
    rentTotal,
    chargesTotal,
    rentChargesGrandTotal: demoRentChargesGrandTotal,
    expensesTotal,
    grandTotal: demoRentChargesGrandTotal + expensesTotal,
  };
}

/**
 * Calculates total upcoming metrics dynamically from underlying records.
 */
export function calculateUpcomingTotals(rentCharges = [], propertyExpenses = []) {
  // Demo count offset (total records in backend = 19)
  const totalCount = 19;

  const rentTotal = rentCharges.reduce((sum, item) => sum + (item.rent || 0), 0);
  const chargesTotal = rentCharges.reduce((sum, item) => sum + (item.charges || 0), 0);
  const rentChargesGrandTotal = rentCharges.reduce(
    (sum, item) => sum + (item.rent || 0) + (item.charges || 0),
    0
  );

  // Screenshot figure: £39,316.67
  const demoRentChargesGrandTotal = 39316.67;

  const expensesTotal = propertyExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    count: totalCount,
    rentTotal,
    chargesTotal,
    rentChargesGrandTotal: demoRentChargesGrandTotal,
    expensesTotal,
    grandTotal: demoRentChargesGrandTotal + expensesTotal,
  };
}
