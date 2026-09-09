/**
 * Sample Landlords Data & Local Storage Persistence Service
 * Project: PixxTechnologies Property Management System
 */

const STORAGE_KEY = 'pixx_landlords_data';

export const initialLandlords = [
  {
    id: 'landlord-1',
    _id: 'landlord-1',
    fullName: 'Arthur Pendelton',
    email: 'arthur.pendelton@example.com',
    phone: '+44 20 7946 0123',
    address: '15 High Street, Kensington',
    country: 'United Kingdom',
    region: 'Greater London',
    logo: {
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      publicId: '',
    },
    notes: 'Primary landlord for commercial plazas in London.',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'landlord-2',
    _id: 'landlord-2',
    fullName: 'Margaret Thatcher',
    email: 'margaret.t@example.com',
    phone: '+44 161 496 0234',
    address: '42 Deansgate',
    country: 'United Kingdom',
    region: 'Greater Manchester',
    logo: {
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      publicId: '',
    },
    notes: 'Owns residential complexes and city offices.',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
  },
  {
    id: 'landlord-3',
    _id: 'landlord-3',
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+44 20 7946 0912',
    address: '12 Baker Street',
    country: 'United Kingdom',
    region: 'London',
    logo: {
      url: '',
      publicId: '',
    },
    notes: 'Overseas investor for luxury heights.',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01',
  },
];

export function getSavedLandlords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLandlords));
    return initialLandlords;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return initialLandlords;
  }
}

export function saveLandlord(landlordData) {
  const list = getSavedLandlords();
  const newLandlord = {
    id: landlordData.id || `landlord-${Date.now()}`,
    _id: landlordData._id || `landlord-${Date.now()}`,
    fullName: landlordData.fullName || landlordData.name || '',
    email: landlordData.email || '',
    phone: landlordData.phone || landlordData.contactNumber || '',
    address: landlordData.address || '',
    country: landlordData.country || 'United Kingdom',
    region: landlordData.region || '',
    logo: landlordData.logo || { url: '', publicId: '' },
    notes: landlordData.notes || '',
    createdAt: landlordData.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  list.unshift(newLandlord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newLandlord;
}

export function updateLandlord(id, updatedData) {
  const list = getSavedLandlords();
  const index = list.findIndex((l) => l.id === id || l._id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...updatedData,
      fullName: updatedData.fullName || updatedData.name || list[index].fullName,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  }
  return null;
}

export function deleteLandlord(id) {
  const list = getSavedLandlords();
  const filtered = list.filter((l) => l.id !== id && l._id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function exportLandlordsToFile(landlords, format = 'csv') {
  const rows = landlords.map((l) => ({
    'Full Name': l.fullName || l.name || '',
    Email: l.email || '',
    Phone: l.phone || l.contactNumber || '',
    Address: l.address || '',
    Country: l.country || '',
    Region: l.region || '',
    Notes: l.notes || '',
  }));

  if (format === 'csv') {
    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent = [
      headers,
      ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Pixx_Landlords_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
