import * as XLSX from 'xlsx';

export const propertyTypes = ['Residential', 'Commercial', 'Mixed', 'Other'];

export const unitTypes = [
  'Building',
  'House',
  'Shop',
  'Office',
  'Flat',
  'Apartment',
  'Room',
  'Other',
];

export const unitStatuses = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

export const priceTypes = ['monthly_rent', 'sale', 'other'];

export function filterProperties(properties = [], filters = {}) {
  if (!filters.search || !filters.search.trim()) return properties;
  const q = filters.search.toLowerCase().trim();
  return properties.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q))
  );
}

export const demoProperties = [
  {
    id: 'prop-1',
    name: 'Pixx Heights',
    type: 'Mixed',
    address: 'Main Road',
    city: 'London',
    area: 'Central London',
    description: 'Flagship commercial and residential tower with retail and luxury flats.',
    notes: 'Primary headquarters property.',
    status: 'Active',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prop-2',
    name: 'Vansittart Commercial Hub',
    type: 'Commercial',
    address: '7 Vansittart Street',
    city: 'Grays',
    area: 'Essex',
    description: 'Multi-unit commercial office complex.',
    notes: 'Long-term commercial tenancies.',
    status: 'Active',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-05',
  },
  {
    id: 'prop-3',
    name: 'Como Street Plaza',
    type: 'Mixed',
    address: '82 Como Street',
    city: 'Romford',
    area: 'Greater London',
    description: 'High-footfall plaza with ground floor retail and upper floor apartments.',
    notes: 'Recently renovated.',
    status: 'Active',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10',
  },
  {
    id: 'prop-4',
    name: 'Clarence Road Shops',
    type: 'Commercial',
    address: '15-26 Clarence Road',
    city: 'Grays',
    area: 'Essex',
    description: 'Prime retail shop units on Clarence Road.',
    notes: 'Fully leased commercial parade.',
    status: 'Active',
    createdAt: '2025-01-12',
    updatedAt: '2025-01-12',
  },
  {
    id: 'prop-5',
    name: 'Morley Avenue Apartments',
    type: 'Residential',
    address: '31 Morley Avenue',
    city: 'London',
    area: 'Greater London',
    description: 'Modern residential apartment building with dedicated parking.',
    notes: 'Residential letting block.',
    status: 'Active',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
];

export const demoPropertiesList = demoProperties;

export const demoUnits = [
  // Units for Pixx Heights (prop-1)
  {
    id: 'unit-101',
    propertyId: 'prop-1',
    name: 'Shop 01',
    type: 'Shop',
    floor: 'Ground',
    size: '1,200 sq ft',
    price: 2500,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Centennial Property Ltd',
    description: 'Ground floor corner retail shop.',
    notes: '',
    createdAt: '2025-01-01',
  },
  {
    id: 'unit-102',
    propertyId: 'prop-1',
    name: 'Shop 02',
    type: 'Shop',
    floor: 'Ground',
    size: '950 sq ft',
    price: 2100,
    priceType: 'monthly_rent',
    status: 'Available',
    customerName: null,
    description: 'Ground floor retail unit.',
    notes: '',
    createdAt: '2025-01-01',
  },
  {
    id: 'unit-103',
    propertyId: 'prop-1',
    name: 'Office 101',
    type: 'Office',
    floor: '1st Floor',
    size: '1,500 sq ft',
    price: 3200,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Danial Butt',
    description: 'First floor office suite.',
    notes: '',
    createdAt: '2025-01-01',
  },
  {
    id: 'unit-104',
    propertyId: 'prop-1',
    name: 'Flat 201',
    type: 'Flat',
    floor: '2nd Floor',
    size: '850 sq ft',
    price: 1800,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Baffour Duah Agyemang',
    description: 'Two bedroom luxury apartment.',
    notes: '',
    createdAt: '2025-01-01',
  },
  {
    id: 'unit-105',
    propertyId: 'prop-1',
    name: 'Flat 202',
    type: 'Flat',
    floor: '2nd Floor',
    size: '780 sq ft',
    price: 1650,
    priceType: 'monthly_rent',
    status: 'Reserved',
    customerName: 'Tobin Joy Payyapilly',
    description: 'One bedroom luxury flat.',
    notes: 'Deposit pending.',
    createdAt: '2025-01-01',
  },
  {
    id: 'unit-106',
    propertyId: 'prop-1',
    name: 'Penthouse 501',
    type: 'Apartment',
    floor: '5th Floor',
    size: '2,200 sq ft',
    price: 450000,
    priceType: 'sale',
    status: 'Available',
    customerName: null,
    description: 'Executive top-floor penthouse suite.',
    notes: '',
    createdAt: '2025-01-01',
  },

  // Units for Vansittart Commercial Hub (prop-2)
  {
    id: 'unit-201',
    propertyId: 'prop-2',
    name: 'Suite A',
    type: 'Office',
    floor: 'Ground',
    size: '1,100 sq ft',
    price: 1200,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Centennial Property Ltd',
    description: 'Ground floor open plan office.',
    notes: '',
    createdAt: '2025-01-05',
  },
  {
    id: 'unit-202',
    propertyId: 'prop-2',
    name: 'Suite B',
    type: 'Office',
    floor: '1st Floor',
    size: '1,400 sq ft',
    price: 1500,
    priceType: 'monthly_rent',
    status: 'Available',
    customerName: null,
    description: 'First floor office space.',
    notes: '',
    createdAt: '2025-01-05',
  },

  // Units for Como Street Plaza (prop-3)
  {
    id: 'unit-301',
    propertyId: 'prop-3',
    name: 'Shop 82A',
    type: 'Shop',
    floor: 'Ground',
    size: '1,800 sq ft',
    price: 2800,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Constantin-Florin Istrate',
    description: 'Main street frontage shop.',
    notes: '',
    createdAt: '2025-01-10',
  },
  {
    id: 'unit-302',
    propertyId: 'prop-3',
    name: 'Flat 82B',
    type: 'Flat',
    floor: '1st Floor',
    size: '900 sq ft',
    price: 1400,
    priceType: 'monthly_rent',
    status: 'Available',
    customerName: null,
    description: 'First floor two bedroom flat.',
    notes: '',
    createdAt: '2025-01-10',
  },

  // Units for Clarence Road Shops (prop-4)
  {
    id: 'unit-401',
    propertyId: 'prop-4',
    name: 'Shop 15',
    type: 'Shop',
    floor: 'Ground',
    size: '1,000 sq ft',
    price: 2666.67,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Ivape Grays Limited',
    description: 'Retail shop unit.',
    notes: '',
    createdAt: '2025-01-12',
  },
  {
    id: 'unit-402',
    propertyId: 'prop-4',
    name: 'Shop 13',
    type: 'Shop',
    floor: 'Ground',
    size: '950 sq ft',
    price: 2166.67,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Khalid Aziz Mustafa',
    description: 'Retail shop unit.',
    notes: '',
    createdAt: '2025-01-12',
  },

  // Units for Morley Avenue Apartments (prop-5)
  {
    id: 'unit-501',
    propertyId: 'prop-5',
    name: 'Apt 31A',
    type: 'Apartment',
    floor: 'Ground',
    size: '800 sq ft',
    price: 1600,
    priceType: 'monthly_rent',
    status: 'Occupied',
    customerName: 'Jay\'s Homecare Limited',
    description: 'Ground floor luxury apartment.',
    notes: '',
    createdAt: '2025-01-15',
  },
  {
    id: 'unit-502',
    propertyId: 'prop-5',
    name: 'Apt 31B',
    type: 'Apartment',
    floor: '1st Floor',
    size: '850 sq ft',
    price: 1700,
    priceType: 'monthly_rent',
    status: 'Available',
    customerName: null,
    description: 'First floor luxury apartment.',
    notes: '',
    createdAt: '2025-01-15',
  },
];

const PROPERTIES_KEY = 'pixx_properties_list';
const UNITS_KEY = 'pixx_units_list';

// --- PROPERTY STORAGE & QUERIES ---

export function getSavedProperties() {
  try {
    const data = localStorage.getItem(PROPERTIES_KEY);
    return data ? JSON.parse(data) : demoProperties;
  } catch (e) {
    return demoProperties;
  }
}

export function saveProperty(property) {
  const existing = getSavedProperties();
  const updated = [property, ...existing];
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(updated));
  return updated;
}

export function updateProperty(propertyId, updatedFields) {
  const existing = getSavedProperties();
  const updated = existing.map((p) => (p.id === propertyId ? { ...p, ...updatedFields, updatedAt: new Date().toISOString() } : p));
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteProperty(propertyId) {
  const existing = getSavedProperties();
  const updated = existing.filter((p) => p.id !== propertyId);
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(updated));

  // Also delete associated units
  const units = getSavedUnits();
  const updatedUnits = units.filter((u) => u.propertyId !== propertyId);
  localStorage.setItem(UNITS_KEY, JSON.stringify(updatedUnits));

  return updated;
}

// --- UNIT STORAGE & QUERIES ---

export function getSavedUnits() {
  try {
    const data = localStorage.getItem(UNITS_KEY);
    return data ? JSON.parse(data) : demoUnits;
  } catch (e) {
    return demoUnits;
  }
}

export function getUnitsByProperty(propertyId) {
  const units = getSavedUnits();
  return units.filter((u) => u.propertyId === propertyId);
}

export function saveUnit(unit) {
  const existing = getSavedUnits();
  const updated = [unit, ...existing];
  localStorage.setItem(UNITS_KEY, JSON.stringify(updated));
  return updated;
}

export function updateUnit(unitId, updatedFields) {
  const existing = getSavedUnits();
  const updated = existing.map((u) => (u.id === unitId ? { ...u, ...updatedFields, updatedAt: new Date().toISOString() } : u));
  localStorage.setItem(UNITS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteUnit(unitId) {
  const existing = getSavedUnits();
  const updated = existing.filter((u) => u.id !== unitId);
  localStorage.setItem(UNITS_KEY, JSON.stringify(updated));
  return updated;
}

// --- HELPER METRICS COMPUTATION ---

export function getPropertyMetrics(propertyId) {
  const units = getUnitsByProperty(propertyId);
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'Occupied').length;
  const availableUnits = units.filter((u) => u.status === 'Available').length;
  const reservedUnits = units.filter((u) => u.status === 'Reserved').length;
  const maintenanceUnits = units.filter((u) => u.status === 'Maintenance').length;

  const expectedMonthlyRent = units
    .filter((u) => u.priceType === 'monthly_rent')
    .reduce((sum, u) => sum + (Number(u.price) || 0), 0);

  const expectedPropertyValue = units
    .filter((u) => u.priceType === 'sale')
    .reduce((sum, u) => sum + (Number(u.price) || 0), 0);

  return {
    totalUnits,
    occupiedUnits,
    availableUnits,
    reservedUnits,
    maintenanceUnits,
    expectedMonthlyRent,
    expectedPropertyValue,
  };
}

// --- EXPORT UTILITIES (CSV & EXCEL) ---

export function exportPropertiesToFile(properties, format = 'xlsx') {
  const exportData = properties.map((p) => {
    const metrics = getPropertyMetrics(p.id);
    return {
      'Property Name': p.name || p.propertyName || '—',
      'Property Type': p.type || 'Commercial',
      'Address': p.address || '—',
      'City': p.city || '—',
      'Area': p.area || '—',
      'Total Units': metrics.totalUnits || 0,
      'Occupied Units': metrics.occupiedUnits || 0,
      'Available Units': metrics.availableUnits || 0,
      'Reserved Units': metrics.reservedUnits || 0,
      'Status': p.status || 'Active',
      'Description': p.description || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

  const filename = `Pixx_Properties_Export_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

export function exportUnitsToFile(units, propertyName = 'All', format = 'xlsx') {
  const exportData = units.map((u) => ({
    'Unit Name': u.name || '—',
    'Unit Type': u.type || 'Standard',
    'Floor': u.floor || '—',
    'Size': u.size || '—',
    'Monthly Rent (£)': u.price || 0,
    'Rent Type': u.priceType === 'quarterly_rent' ? 'Quarterly Rent' : u.priceType === 'annual_rent' ? 'Annual Rent' : 'Monthly Rent',
    'Status': u.status || 'Available',
    'Customer Name': u.customerName || '—',
    'Description': u.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Units');

  const cleanName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Pixx_Units_Export_${cleanName}_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}
