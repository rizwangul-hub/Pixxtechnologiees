import * as XLSX from 'xlsx';

export const demoContacts = [
  'Bedford Insurance (Philips)',
  'Carpet Express London',
  'Claudio Calanna',
  'Cover4 (Alan Blunden & Co Ltd)',
  'Ideal lettings Homes Ltd',
  'Old Street Holding Ltd',
  'Z&Z Services Ltd',
  'John Smith',
  'Sarah Williams',
];

export const demoTenants = [];

const TENANTS_STORAGE_KEY = 'landlordvision_tenants_records';

export function getSavedTenants() {
  try {
    const data = localStorage.getItem(TENANTS_STORAGE_KEY);
    return data ? JSON.parse(data) : demoTenants;
  } catch (e) {
    return demoTenants;
  }
}

export function saveTenant(tenant) {
  const existing = getSavedTenants();
  const updated = [tenant, ...existing];
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Multi-criteria filter for Tenants
 */
export function filterTenants(tenants = [], filters = {}) {
  return (tenants || []).filter((t) => {
    // Search query
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      const searchBy = filters.searchBy || 'All';

      if (searchBy === 'Tenant Name') {
        if (!t.name || !t.name.toLowerCase().includes(q)) return false;
      } else if (searchBy === 'Tenant Email') {
        if (
          (!t.email1 || !t.email1.toLowerCase().includes(q)) &&
          (!t.email2 || !t.email2.toLowerCase().includes(q))
        )
          return false;
      } else if (searchBy === 'Tenant Phone') {
        if (
          (!t.phone1 || !t.phone1.toLowerCase().includes(q)) &&
          (!t.phone2 || !t.phone2.toLowerCase().includes(q))
        )
          return false;
      } else if (searchBy === 'Property Name') {
        if (!t.property || !t.property.toLowerCase().includes(q)) return false;
      } else {
        // All fields
        const matchesAll =
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.email1 && t.email1.toLowerCase().includes(q)) ||
          (t.phone1 && t.phone1.toLowerCase().includes(q)) ||
          (t.property && t.property.toLowerCase().includes(q));
        if (!matchesAll) return false;
      }
    }

    // Alphabet Filter
    if (filters.alphabet && filters.alphabet !== 'All') {
      if (filters.alphabet === '123') {
        if (!/^[0-9]/.test(t.name)) return false;
      } else {
        if (!t.name.toUpperCase().startsWith(filters.alphabet)) return false;
      }
    }

    // Tenant Status
    if (filters.status && filters.status !== '- Any -') {
      const hasActive = t.tenancies?.some((tn) => tn.status === 'Active Tenancies');
      if (filters.status === 'Active' && !hasActive) return false;
      if (filters.status === 'Expired' && hasActive) return false;
    }

    // Property Filter
    if (filters.property && filters.property !== '- Any -') {
      if (t.property !== filters.property) return false;
    }

    return true;
  });
}

/**
 * Excel / CSV Export Generator using SheetJS (XLSX)
 */
export function exportTenantsToExcel(tenants = [], options = {}) {
  const exportRows = [];
  const todayUK = new Date().toLocaleDateString('en-GB');

  // Title Banner & Metadata
  exportRows.push(['PIXXTECHNOLOGIES - TENANT REGISTER & LEASE SUMMARY']);
  exportRows.push([`Report Generated: ${todayUK}`, '', '', `Total Tenants: ${tenants.length}`]);
  exportRows.push([]);

  // Define Header Row
  const headerRow = [
    'Tenant Name',
    'Phone',
    'Email Address',
    'City / Region',
    'Assigned Property',
    'Assigned Unit',
    'Tenancy Status',
    'Payment Term',
    'Monthly Rent (£)',
    'Start Date',
    'Expiry Date',
  ];
  exportRows.push(headerRow);

  let totalMonthlyRentRoll = 0;

  tenants.forEach((t) => {
    const activeTenancy = (t.tenancies || []).find((tn) => tn.status === 'Active Tenancies') || (t.tenancies || [])[0] || {};
    const rentVal = Number(activeTenancy.rent || t.rent || 0);
    totalMonthlyRentRoll += rentVal;

    const row = [
      t.name || '',
      t.phone1 || t.phone || '',
      t.email1 || t.email || '',
      t.city || t.region || '',
      activeTenancy.property || t.property || '—',
      activeTenancy.unit || '—',
      activeTenancy.status || 'Active',
      activeTenancy.paymentTerm || 'Monthly',
      rentVal,
      activeTenancy.startDate || '',
      activeTenancy.expiryDate || 'Ongoing',
    ];
    exportRows.push(row);
  });

  // Total Row at bottom
  exportRows.push([
    'TOTAL MONTHLY RENT ROLL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalMonthlyRentRoll,
    '',
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(exportRows);

  // Auto-fit column widths
  const maxCols = headerRow.length;
  const colWidths = [];
  for (let col = 0; col < maxCols; col++) {
    let maxLen = 14;
    exportRows.forEach((r) => {
      if (r && r[col] !== undefined && r[col] !== null) {
        const len = String(r[col]).length;
        if (len > maxLen) maxLen = len;
      }
    });
    colWidths.push({ wch: Math.min(maxLen + 4, 45) });
  }
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenants');

  // Trigger download
  XLSX.writeFile(workbook, `Pixx_Tenants_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}