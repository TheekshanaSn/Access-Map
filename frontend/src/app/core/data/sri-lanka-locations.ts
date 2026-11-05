export interface SriLankanLocation {
  id: string;
  name: string;
  localName?: string;
  type: 'city' | 'district' | 'province' | 'transport_hub';
  district: string;
  province: string;
  postalCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  zoomLevel: number;
  aliases: string[];
  description?: string;
}

/**
 * Registry of major Sri Lankan cities required by Step 11:
 * Colombo, Kandy, Galle, Matara, Jaffna, Negombo, Kurunegala,
 * Anuradhapura, Trincomalee, Batticaloa, Ratnapura, Badulla.
 */
export const SRI_LANKAN_CITIES: SriLankanLocation[] = [
  {
    id: 'lk-city-colombo',
    name: 'Colombo',
    localName: 'කොළඹ / கொழும்பு',
    type: 'city',
    district: 'Colombo',
    province: 'Western Province',
    postalCode: '00100',
    coordinates: { lat: 6.9271, lng: 79.8612 },
    zoomLevel: 13,
    aliases: ['Colombo Fort', 'Kollupitiya', 'Bambalapitiya', 'Pettah', 'Maradana', 'Kolomba'],
    description: 'Commercial capital and primary maritime transit hub of Sri Lanka.',
  },
  {
    id: 'lk-city-kandy',
    name: 'Kandy',
    localName: 'මහනුවර / கண்டி',
    type: 'city',
    district: 'Kandy',
    province: 'Central Province',
    postalCode: '20000',
    coordinates: { lat: 7.2906, lng: 80.6337 },
    zoomLevel: 13,
    aliases: ['Mahanuwara', 'Senkadagala', 'Kandy Lake', 'Peradeniya'],
    description: 'Historic hill capital and cultural epicenter in Central Sri Lanka.',
  },
  {
    id: 'lk-city-galle',
    name: 'Galle',
    localName: 'ගාල්ල / காலி',
    type: 'city',
    district: 'Galle',
    province: 'Southern Province',
    postalCode: '80000',
    coordinates: { lat: 6.0535, lng: 80.221 },
    zoomLevel: 14,
    aliases: ['Gaalu', 'Galle Fort', 'Unawatuna', 'Karapitiya'],
    description: 'Major southern coastal city renowned for the historic Galle Fort.',
  },
  {
    id: 'lk-city-matara',
    name: 'Matara',
    localName: 'මාතර / மாத்தறை',
    type: 'city',
    district: 'Matara',
    province: 'Southern Province',
    postalCode: '81000',
    coordinates: { lat: 5.9549, lng: 80.555 },
    zoomLevel: 13,
    aliases: ['Mathara', 'Nilwala', 'Dondra', 'Mirissa'],
    description: 'Southern coastal hub situated along the Nilwala River.',
  },
  {
    id: 'lk-city-jaffna',
    name: 'Jaffna',
    localName: 'යාපනය / யாழ்ப்பாணம்',
    type: 'city',
    district: 'Jaffna',
    province: 'Northern Province',
    postalCode: '40000',
    coordinates: { lat: 9.6615, lng: 80.0255 },
    zoomLevel: 13,
    aliases: ['Yapanaya', 'Yalpanam', 'Nallur', 'Chundikuli'],
    description: 'Cultural and administrative hub of the Northern Peninsula.',
  },
  {
    id: 'lk-city-negombo',
    name: 'Negombo',
    localName: 'මීගමුව / நீர்கொழும்பு',
    type: 'city',
    district: 'Gampaha',
    province: 'Western Province',
    postalCode: '11500',
    coordinates: { lat: 7.2008, lng: 79.8736 },
    zoomLevel: 13,
    aliases: ['Meegamuwa', 'Katunayake', 'Kochchikade'],
    description: 'Western coastal city adjacent to Bandaranaike International Airport.',
  },
  {
    id: 'lk-city-kurunegala',
    name: 'Kurunegala',
    localName: 'කුරුණෑගල / குருணாகல்',
    type: 'city',
    district: 'Kurunegala',
    province: 'North Western Province',
    postalCode: '60000',
    coordinates: { lat: 7.4863, lng: 80.3623 },
    zoomLevel: 13,
    aliases: ['Athugalpura', 'Ethagala', 'Mawatagama'],
    description: 'Central transit intersection beneath the Elephant Rock.',
  },
  {
    id: 'lk-city-anuradhapura',
    name: 'Anuradhapura',
    localName: 'අනුරාධපුරය / அனுராதபுரம்',
    type: 'city',
    district: 'Anuradhapura',
    province: 'North Central Province',
    postalCode: '50000',
    coordinates: { lat: 8.3114, lng: 80.4037 },
    zoomLevel: 13,
    aliases: ['Anuradhapura Sacred City', 'Nuwaragam Palatha', 'Mihintale'],
    description: 'Ancient first capital and sacred heritage city of Sri Lanka.',
  },
  {
    id: 'lk-city-trincomalee',
    name: 'Trincomalee',
    localName: 'ත්‍රිකුණාමලය / திருகோணமலை',
    type: 'city',
    district: 'Trincomalee',
    province: 'Eastern Province',
    postalCode: '31000',
    coordinates: { lat: 8.5874, lng: 81.2152 },
    zoomLevel: 13,
    aliases: ['Gokanna', 'Trinco', 'Nilaveli', 'China Bay'],
    description: 'Eastern port city famous for natural deep-water harbors and coastal forts.',
  },
  {
    id: 'lk-city-batticaloa',
    name: 'Batticaloa',
    localName: 'මඩකලපුව / மட்டக்களப்பு',
    type: 'city',
    district: 'Batticaloa',
    province: 'Eastern Province',
    postalCode: '30000',
    coordinates: { lat: 7.731, lng: 81.6747 },
    zoomLevel: 13,
    aliases: ['Mada Kalapuwa', 'Kallady', 'Eravur'],
    description: 'Major eastern administrative city situated beside the Batticaloa Lagoon.',
  },
  {
    id: 'lk-city-ratnapura',
    name: 'Ratnapura',
    localName: 'රත්නපුර / இரத்தினபுரி',
    type: 'city',
    district: 'Ratnapura',
    province: 'Sabaragamuwa Province',
    postalCode: '70000',
    coordinates: { lat: 6.6828, lng: 80.4036 },
    zoomLevel: 13,
    aliases: ['City of Gems', 'Kalu Ganga', 'Sripada Foothills'],
    description: 'Provincial capital of Sabaragamuwa and center of Sri Lanka gemstone trade.',
  },
  {
    id: 'lk-city-badulla',
    name: 'Badulla',
    localName: 'බදුල්ල / பதுளை',
    type: 'city',
    district: 'Badulla',
    province: 'Uva Province',
    postalCode: '90000',
    coordinates: { lat: 6.9934, lng: 81.055 },
    zoomLevel: 13,
    aliases: ['Uva Capital', 'Dunhinda', 'Bandarawela', 'Hali Ela'],
    description: 'Hill country terminus of the Main Railway line in Uva Province.',
  },
];

/**
 * 25 Administrative Districts of Sri Lanka
 */
export const SRI_LANKAN_DISTRICTS: SriLankanLocation[] = [
  // Western
  { id: 'dist-colombo', name: 'Colombo District', type: 'district', district: 'Colombo', province: 'Western Province', coordinates: { lat: 6.9271, lng: 79.8612 }, zoomLevel: 11, aliases: ['Colombo'] },
  { id: 'dist-gampaha', name: 'Gampaha District', type: 'district', district: 'Gampaha', province: 'Western Province', coordinates: { lat: 7.084, lng: 79.9936 }, zoomLevel: 11, aliases: ['Gampaha', 'Kelaniya', 'Ja-Ela'] },
  { id: 'dist-kalutara', name: 'Kalutara District', type: 'district', district: 'Kalutara', province: 'Western Province', coordinates: { lat: 6.5854, lng: 79.9607 }, zoomLevel: 11, aliases: ['Kalutara', 'Panadura', 'Horana'] },
  // Central
  { id: 'dist-kandy', name: 'Kandy District', type: 'district', district: 'Kandy', province: 'Central Province', coordinates: { lat: 7.2906, lng: 80.6337 }, zoomLevel: 11, aliases: ['Kandy'] },
  { id: 'dist-matale', name: 'Matale District', type: 'district', district: 'Matale', province: 'Central Province', coordinates: { lat: 7.4675, lng: 80.6234 }, zoomLevel: 11, aliases: ['Matale', 'Dambulla', 'Sigiriya'] },
  { id: 'dist-nuwara-eliya', name: 'Nuwara Eliya District', type: 'district', district: 'Nuwara Eliya', province: 'Central Province', coordinates: { lat: 6.9497, lng: 80.7891 }, zoomLevel: 11, aliases: ['Nuwara Eliya', 'Hatton'] },
  // Southern
  { id: 'dist-galle', name: 'Galle District', type: 'district', district: 'Galle', province: 'Southern Province', coordinates: { lat: 6.0535, lng: 80.221 }, zoomLevel: 11, aliases: ['Galle'] },
  { id: 'dist-matara', name: 'Matara District', type: 'district', district: 'Matara', province: 'Southern Province', coordinates: { lat: 5.9549, lng: 80.555 }, zoomLevel: 11, aliases: ['Matara', 'Weligama'] },
  { id: 'dist-hambantota', name: 'Hambantota District', type: 'district', district: 'Hambantota', province: 'Southern Province', coordinates: { lat: 6.1429, lng: 81.1212 }, zoomLevel: 11, aliases: ['Hambantota', 'Tangalle'] },
  // Northern
  { id: 'dist-jaffna', name: 'Jaffna District', type: 'district', district: 'Jaffna', province: 'Northern Province', coordinates: { lat: 9.6615, lng: 80.0255 }, zoomLevel: 11, aliases: ['Jaffna', 'Point Pedro'] },
  { id: 'dist-kilinochchi', name: 'Kilinochchi District', type: 'district', district: 'Kilinochchi', province: 'Northern Province', coordinates: { lat: 9.3803, lng: 80.377 }, zoomLevel: 11, aliases: ['Kilinochchi'] },
  { id: 'dist-mannar', name: 'Mannar District', type: 'district', district: 'Mannar', province: 'Northern Province', coordinates: { lat: 8.981, lng: 79.9044 }, zoomLevel: 11, aliases: ['Mannar', 'Talaimannar'] },
  { id: 'dist-vavuniya', name: 'Vavuniya District', type: 'district', district: 'Vavuniya', province: 'Northern Province', coordinates: { lat: 8.7514, lng: 80.4971 }, zoomLevel: 11, aliases: ['Vavuniya'] },
  { id: 'dist-mullaitivu', name: 'Mullaitivu District', type: 'district', district: 'Mullaitivu', province: 'Northern Province', coordinates: { lat: 9.2671, lng: 80.8142 }, zoomLevel: 11, aliases: ['Mullaitivu'] },
  // Eastern
  { id: 'dist-batticaloa', name: 'Batticaloa District', type: 'district', district: 'Batticaloa', province: 'Eastern Province', coordinates: { lat: 7.731, lng: 81.6747 }, zoomLevel: 11, aliases: ['Batticaloa'] },
  { id: 'dist-ampara', name: 'Ampara District', type: 'district', district: 'Ampara', province: 'Eastern Province', coordinates: { lat: 7.2912, lng: 81.6724 }, zoomLevel: 11, aliases: ['Ampara', 'Kalmunai'] },
  { id: 'dist-trincomalee', name: 'Trincomalee District', type: 'district', district: 'Trincomalee', province: 'Eastern Province', coordinates: { lat: 8.5874, lng: 81.2152 }, zoomLevel: 11, aliases: ['Trincomalee'] },
  // North Western
  { id: 'dist-kurunegala', name: 'Kurunegala District', type: 'district', district: 'Kurunegala', province: 'North Western Province', coordinates: { lat: 7.4863, lng: 80.3623 }, zoomLevel: 11, aliases: ['Kurunegala'] },
  { id: 'dist-puttalam', name: 'Puttalam District', type: 'district', district: 'Puttalam', province: 'North Western Province', coordinates: { lat: 8.0362, lng: 79.8283 }, zoomLevel: 11, aliases: ['Puttalam', 'Chilaw', 'Marawila'] },
  // North Central
  { id: 'dist-anuradhapura', name: 'Anuradhapura District', type: 'district', district: 'Anuradhapura', province: 'North Central Province', coordinates: { lat: 8.3114, lng: 80.4037 }, zoomLevel: 11, aliases: ['Anuradhapura'] },
  { id: 'dist-polonnaruwa', name: 'Polonnaruwa District', type: 'district', district: 'Polonnaruwa', province: 'North Central Province', coordinates: { lat: 7.9403, lng: 81.0188 }, zoomLevel: 11, aliases: ['Polonnaruwa', 'Kaduruwela'] },
  // Uva
  { id: 'dist-badulla', name: 'Badulla District', type: 'district', district: 'Badulla', province: 'Uva Province', coordinates: { lat: 6.9934, lng: 81.055 }, zoomLevel: 11, aliases: ['Badulla'] },
  { id: 'dist-monaragala', name: 'Monaragala District', type: 'district', district: 'Monaragala', province: 'Uva Province', coordinates: { lat: 6.8728, lng: 81.3507 }, zoomLevel: 11, aliases: ['Monaragala', 'Wellawaya', 'Kataragama'] },
  // Sabaragamuwa
  { id: 'dist-ratnapura', name: 'Ratnapura District', type: 'district', district: 'Ratnapura', province: 'Sabaragamuwa Province', coordinates: { lat: 6.6828, lng: 80.4036 }, zoomLevel: 11, aliases: ['Ratnapura'] },
  { id: 'dist-kegalle', name: 'Kegalle District', type: 'district', district: 'Kegalle', province: 'Sabaragamuwa Province', coordinates: { lat: 7.2513, lng: 80.3464 }, zoomLevel: 11, aliases: ['Kegalle', 'Mawanella'] },
];

export const ALL_SRI_LANKAN_LOCATIONS: SriLankanLocation[] = [
  ...SRI_LANKAN_CITIES,
  ...SRI_LANKAN_DISTRICTS,
];

/**
 * Search Sri Lankan cities, districts, landmarks, and aliases
 */
export function findSriLankanLocations(query: string): SriLankanLocation[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return ALL_SRI_LANKAN_LOCATIONS.filter((loc) => {
    const nameMatch = loc.name.toLowerCase().includes(q);
    const districtMatch = loc.district.toLowerCase().includes(q);
    const provinceMatch = loc.province.toLowerCase().includes(q);
    const localMatch = loc.localName ? loc.localName.toLowerCase().includes(q) : false;
    const postalMatch = loc.postalCode ? loc.postalCode.includes(q) : false;
    const aliasMatch = loc.aliases.some((a) => a.toLowerCase().includes(q));

    return nameMatch || districtMatch || provinceMatch || localMatch || postalMatch || aliasMatch;
  });
}

