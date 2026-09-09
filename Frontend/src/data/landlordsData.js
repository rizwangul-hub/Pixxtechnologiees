import { PRESET_LANDLORD_LOGOS } from './presetLandlordLogos';

const STORAGE_KEY = 'pixx_landlords_data';

export const initialLandlords = [];

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
