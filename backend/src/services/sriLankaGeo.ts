/**
 * Sri Lankan Geographic Reference Data & Spatial Resolver
 * Maps coordinates to nearest Sri Lankan city and administrative district.
 */

export interface SriLankanCityRef {
  name: string;
  district: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export const SRI_LANKA_BOUNDS = {
  minLat: 5.85,
  maxLat: 9.95,
  minLng: 79.55,
  maxLng: 81.95,
};

export const SRI_LANKAN_CITIES_REF: SriLankanCityRef[] = [
  { name: 'Colombo', district: 'Colombo', province: 'Western', postalCode: '00100', lat: 6.9271, lng: 79.8612 },
  { name: 'Kandy', district: 'Kandy', province: 'Central', postalCode: '20000', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', district: 'Galle', province: 'Southern', postalCode: '80000', lat: 6.0535, lng: 80.221 },
  { name: 'Matara', district: 'Matara', province: 'Southern', postalCode: '81000', lat: 5.9549, lng: 80.555 },
  { name: 'Jaffna', district: 'Jaffna', province: 'Northern', postalCode: '40000', lat: 9.6615, lng: 80.0255 },
  { name: 'Negombo', district: 'Gampaha', province: 'Western', postalCode: '11500', lat: 7.2008, lng: 79.8736 },
  { name: 'Kurunegala', district: 'Kurunegala', province: 'North Western', postalCode: '60000', lat: 7.4863, lng: 80.3623 },
  { name: 'Anuradhapura', district: 'Anuradhapura', province: 'North Central', postalCode: '50000', lat: 8.3114, lng: 80.4037 },
  { name: 'Trincomalee', district: 'Trincomalee', province: 'Eastern', postalCode: '31000', lat: 8.5874, lng: 81.2152 },
  { name: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', postalCode: '30000', lat: 7.731, lng: 81.6747 },
  { name: 'Ratnapura', district: 'Ratnapura', province: 'Sabaragamuwa', postalCode: '70000', lat: 6.6828, lng: 80.4037 },
  { name: 'Badulla', district: 'Badulla', province: 'Uva', postalCode: '90000', lat: 6.9934, lng: 81.055 },
  { name: 'Gampaha', district: 'Gampaha', province: 'Western', postalCode: '11000', lat: 7.084, lng: 79.9943 },
  { name: 'Kalutara', district: 'Kalutara', province: 'Western', postalCode: '12000', lat: 6.5854, lng: 79.9607 },
  { name: 'Nuwara Eliya', district: 'Nuwara Eliya', province: 'Central', postalCode: '22200', lat: 6.9497, lng: 80.7891 },
  { name: 'Matale', district: 'Matale', province: 'Central', postalCode: '21000', lat: 7.4675, lng: 80.6234 },
  { name: 'Hambantota', district: 'Hambantota', province: 'Southern', postalCode: '82000', lat: 6.1429, lng: 81.1212 },
  { name: 'Vavuniya', district: 'Vavuniya', province: 'Northern', postalCode: '43000', lat: 8.7542, lng: 80.4982 },
  { name: 'Mannar', district: 'Mannar', province: 'Northern', postalCode: '41000', lat: 8.981, lng: 79.9042 },
  { name: 'Kilinochchi', district: 'Kilinochchi', province: 'Northern', postalCode: '44000', lat: 9.3803, lng: 80.377 },
  { name: 'Mullaitivu', district: 'Mullaitivu', province: 'Northern', postalCode: '42000', lat: 9.2671, lng: 80.8143 },
  { name: 'Puttalam', district: 'Puttalam', province: 'North Western', postalCode: '61300', lat: 8.0362, lng: 79.8283 },
  { name: 'Polonnaruwa', district: 'Polonnaruwa', province: 'North Central', postalCode: '51000', lat: 7.9403, lng: 81.0188 },
  { name: 'Ampara', district: 'Ampara', province: 'Eastern', postalCode: '32000', lat: 7.2912, lng: 81.6724 },
  { name: 'Kegalle', district: 'Kegalle', province: 'Sabaragamuwa', postalCode: '71000', lat: 7.2513, lng: 80.3464 },
  { name: 'Monaragala', district: 'Monaragala', province: 'Uva', postalCode: '91200', lat: 6.8728, lng: 81.3507 },
];

/**
 * Checks whether coordinates fall within Sri Lanka bounding box
 */
export function isWithinSriLanka(lat: number, lng: number): boolean {
  return (
    lat >= SRI_LANKA_BOUNDS.minLat &&
    lat <= SRI_LANKA_BOUNDS.maxLat &&
    lng >= SRI_LANKA_BOUNDS.minLng &&
    lng <= SRI_LANKA_BOUNDS.maxLng
  );
}

/**
 * Calculates Euclidean approximate distance in kilometers
 */
function getApproxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 111.32;
  const dLng = (lng2 - lng1) * (111.32 * Math.cos((lat1 * Math.PI) / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Resolves the nearest Sri Lankan city and administrative district for given coordinates
 */
export function resolveNearestSriLankanLocation(lat: number, lng: number): SriLankanCityRef {
  let closest = SRI_LANKAN_CITIES_REF[0];
  let minDistance = Infinity;

  for (const city of SRI_LANKAN_CITIES_REF) {
    const dist = getApproxDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return closest;
}
