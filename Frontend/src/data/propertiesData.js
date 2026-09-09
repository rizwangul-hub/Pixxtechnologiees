import * as XLSX from 'xlsx';

export const propertyTypes = [
  'Building',
  'House',
  'Shop',
  'Office',
  'Flat',
  'Apartment',
  'Room',
  'Other',
];

// Alias for backward compatibility - individual rentable asset types
export const unitTypes = propertyTypes;

export const unitStatuses = ['Available', 'Occupied', 'Reserved', 'Maintenance'];
export const propertyStatuses = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

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

export const demoProperties = [];

export const demoUnits = [];

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
  const updated = existing.filter((p) => p.id !== propertyId && p._id !== propertyId);
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(updated));

  // Also delete associated units
  const units = getSavedUnits();
  const updatedUnits = units.filter((u) => u.propertyId !== propertyId && u.propertyId?._id !== propertyId);
  localStorage.setItem(UNITS_KEY, JSON.stringify(updatedUnits));

  return updated;
}

// --- UNIT STORAGE & QUERIES ---
// NOTE: "Units" are now individual Properties. These functions are kept for
// backward compatibility with legacy frontend code that references "units".

export function getSavedUnits() {
  // Redirect to properties — each property IS a rentable unit in the new model
  return getSavedProperties();
}

export function getUnitsByProperty(propertyId) {
  // In the new model, properties belong directly to a landlord.
  // For legacy calls that tried to get units of a parent container property,
  // we return properties that match the given propertyId (self or parent match).
  const properties = getSavedProperties();
  return properties.filter(
    (p) =>
      p.id === propertyId ||
      p._id === propertyId ||
      p.landlordId === propertyId ||
      p.landlordId?._id === propertyId
  );
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
  // In the new model, a property IS the individual unit.
  // So we look up the property itself for its status.
  const properties = getSavedProperties();
  const property = properties.find((p) => p.id === propertyId || p._id === propertyId);

  // For backward compat, provide unit-like metrics based on the single property
  const isOccupied = property?.status === 'Occupied';
  const isAvailable = property?.status === 'Available';
  const isReserved = property?.status === 'Reserved';
  const isMaintenance = property?.status === 'Maintenance';

  return {
    totalUnits: property ? 1 : 0,
    totalProperties: property ? 1 : 0,
    occupiedUnits: isOccupied ? 1 : 0,
    availableUnits: isAvailable ? 1 : 0,
    reservedUnits: isReserved ? 1 : 0,
    maintenanceUnits: isMaintenance ? 1 : 0,
    expectedMonthlyRent: property?.monthlyRent || property?.price || 0,
    expectedPropertyValue: property?.salePrice || 0,
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
