/**
 * UK Postcode Normalization, Parsing and Formatting Engine
 * Complies with BS 7666 standard UK Postcodes
 *
 * Examples:
 * "ha9 8ab" -> "HA9 8AB"
 * "HA98AB"  -> "HA9 8AB"
 * "ec1a1bb" -> "EC1A 1BB"
 * "m11ae"   -> "M1 1AE"
 * "w1d4ag"  -> "W1D 4AG"
 */

export interface ParsedUKPostcode {
  raw: string;
  normalized: string; // e.g. "HA9 8AB"
  compact: string;    // e.g. "HA98AB"
  outward: string;    // e.g. "HA9"
  inward: string;     // e.g. "8AB"
  area: string;       // e.g. "HA"
  district: string;   // e.g. "HA9"
  sector: string;     // e.g. "HA9 8"
  isValid: boolean;
}

/**
 * Normalizes any UK postcode string into uppercase standardized format:
 * "OUTWARD INWARD" (e.g. "HA9 8AB") or partial outward ("HA9", "HA")
 */
export function normalizeUKPostcode(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 0) return '';

  // Standard full UK postcodes are 5 to 7 alphanumeric chars
  if (clean.length >= 5 && clean.length <= 7) {
    const inward = clean.slice(-3); // always last 3 chars: 1 digit + 2 letters
    const outward = clean.slice(0, -3);
    return `${outward} ${inward}`;
  }

  // Partial / outward code (e.g. "HA9", "W1", "SW1A")
  return clean;
}

/**
 * Validates whether string is a valid full UK postcode or recognized outward code
 */
export function isValidUKPostcode(raw: string): boolean {
  if (!raw) return false;
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Standard UK full postcode regex
  const fullPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/;
  if (fullPostcodeRegex.test(normalizeUKPostcode(raw))) {
    return true;
  }

  // Also accept outward/district format e.g. "HA9", "NW10", "W1D", "B1"
  const outwardRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/;
  return outwardRegex.test(clean);
}

/**
 * Parses a postcode into its distinct hierarchical precision tiers:
 * 1. Area (e.g. "HA")
 * 2. District (e.g. "HA9")
 * 3. Sector (e.g. "HA9 8")
 * 4. Full (e.g. "HA9 8AB")
 */
export function parseUKPostcode(raw: string): ParsedUKPostcode {
  const norm = normalizeUKPostcode(raw);
  const compact = norm.replace(/\s+/g, '');
  const isValid = isValidUKPostcode(raw);

  let outward = '';
  let inward = '';
  let area = '';
  let district = '';
  let sector = '';

  if (norm.includes(' ')) {
    const parts = norm.split(' ');
    outward = parts[0];
    inward = parts[1];
    
    // Area is letters at the start of outward (e.g. "HA" from "HA9", "W" from "W1")
    const areaMatch = outward.match(/^[A-Z]+/);
    area = areaMatch ? areaMatch[0] : outward;
    district = outward;
    sector = `${outward} ${inward[0]}`; // e.g. "HA9 8"
  } else {
    outward = compact;
    const areaMatch = outward.match(/^[A-Z]+/);
    area = areaMatch ? areaMatch[0] : outward;
    district = outward;
    sector = outward;
  }

  return {
    raw,
    normalized: norm,
    compact,
    outward,
    inward,
    area,
    district,
    sector,
    isValid,
  };
}

/**
 * Calculates Great-circle distance between two GPS coordinates using Haversine formula (in statute miles)
 */
export function calculateHaversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 3958.8; // Radius of Earth in statute miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // 2 decimal precision
}

export const calculateDistanceMiles = calculateHaversineDistanceMiles;
