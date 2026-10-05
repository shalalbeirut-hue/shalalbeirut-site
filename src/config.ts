// Business details used across the site. Empty values show a visible placeholder
// on the preview and are left out of structured data until they are filled in.
export const SITE = {
  url: 'https://shalalbeirut.com',
  nameAr: 'شلال بيروت',
  nameEn: 'Shalal Beirut',
  legalAr: 'شلال بيروت للأدوات الصحية وصيانتها',
  legalEn: 'Shalal Beirut Sanitary Ware & Maintenance',
  email: 'shalalbeirut@gmail.com',

  // TODO(owner): fill these in. Kuwait numbers in international form, e.g. '96550000000'.
  whatsapp: '96596656652',
  phone: '96596656652',
  warrantyMonths: null as number | null,

  shopAr: 'محلنا: دوار الكرد',
  shopEn: 'Our shop: Al-Kurd Roundabout',
  mapsUrl: '',
  geo: null as { lat: number; lng: number } | null,

  social: {
    instagram: '', // e.g. 'https://instagram.com/shalalbeirut'
    tiktok: '',
    snapchat: '',
  },
  googleReviewUrl: '',

  hours: { opens: '08:00', closes: '22:00', days: 'Sa-Th' },
  openingOffer: true,

  // Google Ads conversion tracking. Leave id empty to disable (no script is loaded).
  // id: 'AW-1234567890'. labels: the label part of each conversion's send_to ('AW-id/label').
  ads: {
    id: 'AW-18494504490',
    labels: {
      whatsapp: 'M80RCNKU9pEdEKr87vJE',
      phone: 'rfzJCNiI95EdEKr87vJE',
      form: 'OJjdCPjb75EdEKr87vJE',
    },
  },
};

export const COLORS = {
  cedar: '#17583A',
  water: '#1B8CC4',
  deep: '#0F2A1F',
};
