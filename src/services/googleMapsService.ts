// Google Maps Platform, Address Validation & UK Delivery Engine Integration Service

import { Store, DeliveryZone, StoreDeliverySettings, DeliveryCheckResult } from '../types';
import { parseUKPostcode, normalizeUKPostcode, calculateDistanceMiles } from '../utils/postcodeHelper';

export interface AddressSuggestion {
  id: string;
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  source: 'google' | 'postcode' | 'lookup';
}

export interface StructuredAddress {
  houseNumber: string;
  buildingName: string;
  street: string;
  town: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  validationStatus?: 'VALID' | 'WARNING' | 'UNVERIFIED' | 'INVALID';
}

// Popular UK addresses as immediate local fallback if network is offline
const POPULAR_UK_ADDRESSES: AddressSuggestion[] = [
  {
    id: 'ha9-8ab-12',
    placeId: 'ChIJde13MtcEdkgRjQ_q37K-m6I_ha9',
    description: '12 Example Road, Wembley, London, HA9 8AB, UK',
    mainText: '12 Example Road',
    secondaryText: 'Wembley, HA9 8AB',
    postcode: 'HA9 8AB',
    latitude: 51.556,
    longitude: -0.2796,
    source: 'google',
  },
  {
    id: 'w1d-4ag-42',
    placeId: 'ChIJde13MtcEdkgRjQ_q37K-m6I',
    description: '42 Old Compton Street, Soho, London, W1D 4AG, UK',
    mainText: '42 Old Compton Street',
    secondaryText: 'Soho, London, W1D 4AG',
    postcode: 'W1D 4AG',
    latitude: 51.5132,
    longitude: -0.1319,
    source: 'google',
  },
  {
    id: 'w1f-9da-15',
    placeId: 'ChIJW-1jvdUEdkgR35qP48Z_m7A',
    description: '15 Wardour Street, Chinatown, London, W1D 6PJ, UK',
    mainText: '15 Wardour Street',
    secondaryText: 'Chinatown, London, W1D 6PJ',
    postcode: 'W1D 6PJ',
    latitude: 51.5118,
    longitude: -0.1315,
    source: 'google',
  },
  {
    id: 'sw1a-1aa-buck',
    placeId: 'ChIJz2xX_vYEdkgRqXkQGzOkm_s',
    description: 'Buckingham Palace, Westminster, London, SW1A 1AA, UK',
    mainText: 'Buckingham Palace',
    secondaryText: 'Westminster, London, SW1A 1AA',
    postcode: 'SW1A 1AA',
    latitude: 51.5014,
    longitude: -0.1419,
    source: 'google',
  },
  {
    id: 'm1-1ad-10',
    placeId: 'ChIJG6lA9iije0gR_8Uj0-qCmnY',
    description: '10 Piccadilly, Manchester, M1 1AD, UK',
    mainText: '10 Piccadilly',
    secondaryText: 'Manchester City Centre, M1 1AD',
    postcode: 'M1 1AD',
    latitude: 53.4809,
    longitude: -2.2372,
    source: 'google',
  },
  {
    id: 'b5-4bu-5',
    placeId: 'ChIJb7c4uQy8cEgRoFmG36qL-9g',
    description: '5 High Street, Bullring, Birmingham, B5 4BU, UK',
    mainText: '5 High Street',
    secondaryText: 'Bullring & Grand Central, Birmingham, B5 4BU',
    postcode: 'B5 4BU',
    latitude: 52.4777,
    longitude: -1.8953,
    source: 'google',
  },
];

/**
 * 1. Search UK Addresses & Postcodes using Google Places API (New) via Server Proxy
 * With secondary fallback to Postcodes.io
 */
export async function searchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  const results: AddressSuggestion[] = [];

  // A. Primary: Call Google Places Autocomplete via backend proxy
  try {
    const res = await fetch('/api/delivery/places/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: cleanQuery }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        for (const s of data.suggestions) {
          const pred = s.placePrediction;
          if (pred && pred.placeId) {
            results.push({
              id: `place-${pred.placeId}`,
              placeId: pred.placeId,
              description: pred.text?.text || pred.structuredFormat?.mainText?.text || '',
              mainText: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
              secondaryText: pred.structuredFormat?.secondaryText?.text || 'United Kingdom',
              source: 'google',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Google Places autocomplete proxy warning:', err);
  }

  // B. Secondary: Postcodes.io Autocomplete if query resembles a UK postcode
  const isPostcodeLike = /^[A-Z]{1,2}[0-9][A-Z0-9]?/i.test(cleanQuery.replace(/\s+/g, ''));
  if (isPostcodeLike && results.length < 4) {
    try {
      const cleanPc = cleanQuery.replace(/\s+/g, '');
      const pcRes = await fetch(`/api/delivery/postcode/autocomplete/${encodeURIComponent(cleanPc)}`);
      if (pcRes.ok) {
        const pcData = await pcRes.json();
        if (pcData.result && Array.isArray(pcData.result)) {
          for (const pc of pcData.result.slice(0, 4)) {
            // Lookup location details
            try {
              const dRes = await fetch(`/api/delivery/postcode/${encodeURIComponent(pc)}`);
              if (dRes.ok) {
                const dData = await dRes.json();
                const r = dData.result;
                if (r) {
                  results.push({
                    id: `postcode-${r.postcode}`,
                    placeId: `pc_${r.postcode.replace(/\s+/g, '_')}`,
                    description: `${r.admin_ward || ''}, ${r.admin_district || r.region}, ${r.postcode}, UK`.replace(/^,\s*/, ''),
                    mainText: r.postcode,
                    secondaryText: `${r.admin_ward || ''}, ${r.admin_district || r.region || 'UK'}`.replace(/^,\s*/, ''),
                    postcode: r.postcode,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    source: 'postcode',
                  });
                }
              }
            } catch {
              // skip single lookup fail
            }
          }
        }
      }
    } catch (e) {
      console.warn('Postcode lookup error:', e);
    }
  }

  // C. Fallback to Local Popular addresses if results are empty
  if (results.length === 0) {
    const qLower = cleanQuery.toLowerCase();
    const matched = POPULAR_UK_ADDRESSES.filter(
      (a) =>
        a.description.toLowerCase().includes(qLower) ||
        a.postcode?.toLowerCase().includes(qLower) ||
        a.mainText.toLowerCase().includes(qLower)
    );
    results.push(...matched);
  }

  // Deduplicate results
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = (item.placeId || item.description).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 2. Fetch Detailed Place Information from Google Place Details API (via Backend Proxy)
 */
export async function getPlaceDetails(placeId: string): Promise<{
  formattedAddress: string;
  latitude: number;
  longitude: number;
  addressComponents: Array<{ longText: string; shortText: string; types: string[] }>;
} | null> {
  if (!placeId) return null;

  try {
    const res = await fetch(`/api/delivery/places/details/${encodeURIComponent(placeId)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        formattedAddress: data.formattedAddress || data.displayName?.text || '',
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        addressComponents: data.addressComponents || [],
      };
    }
  } catch (err) {
    console.warn('Error fetching place details from backend proxy:', err);
  }
  return null;
}

/**
 * 3. Validate and Standardize Address with Google Address Validation API (via Backend Proxy)
 */
export async function validateAddressWithGoogle(addressLines: string[]): Promise<{
  isValid: boolean;
  formattedAddress?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  components?: any;
  status: 'VALID' | 'WARNING' | 'INVALID';
}> {
  try {
    const res = await fetch('/api/delivery/address/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressLines }),
    });

    if (res.ok) {
      const data = await res.json();
      const verdict = data.result?.verdict;
      const postalAddress = data.result?.address?.postalAddress;
      const geocode = data.result?.geocode;

      const postcode = postalAddress?.postalCode || '';
      const formattedAddress = data.result?.address?.formattedAddress || addressLines.join(', ');
      const lat = geocode?.location?.latitude;
      const lng = geocode?.location?.longitude;

      const isValid = verdict ? !verdict.hasUnconfirmedComponents && verdict.validationGranularity !== 'OTHER' : true;

      return {
        isValid,
        formattedAddress,
        postcode: normalizeUKPostcode(postcode),
        latitude: lat,
        longitude: lng,
        components: postalAddress,
        status: isValid ? 'VALID' : 'WARNING',
      };
    }
  } catch (err) {
    console.warn('Address validation request failed, falling back:', err);
  }

  // Fallback if API has no quota or is offline
  return {
    isValid: true,
    status: 'WARNING',
  };
}

/**
 * 4. Parse and Extract Structured Address from Suggestion with Full Component Identification
 */
export async function resolveFullAddressDetails(suggestion: AddressSuggestion): Promise<StructuredAddress> {
  let fullAddress = suggestion.description;
  let latitude = suggestion.latitude || 0;
  let longitude = suggestion.longitude || 0;
  let postcode = suggestion.postcode || '';
  let houseNumber = '';
  let street = '';
  let town = '';
  let county = '';
  let country = 'United Kingdom';
  let validationStatus: 'VALID' | 'WARNING' | 'UNVERIFIED' | 'INVALID' = 'UNVERIFIED';

  // 1. If Google Place ID, retrieve full details from Google API
  if (suggestion.placeId && !suggestion.placeId.startsWith('pc_') && !suggestion.placeId.startsWith('geo-')) {
    const details = await getPlaceDetails(suggestion.placeId);
    if (details) {
      fullAddress = details.formattedAddress || fullAddress;
      if (details.latitude && details.longitude) {
        latitude = details.latitude;
        longitude = details.longitude;
      }

      // Extract components from Google response
      if (details.addressComponents && Array.isArray(details.addressComponents)) {
        for (const c of details.addressComponents) {
          const types = c.types || [];
          if (types.includes('street_number')) houseNumber = c.longText || c.shortText;
          if (types.includes('route')) street = c.longText || c.shortText;
          if (types.includes('postal_town') || types.includes('locality')) town = c.longText;
          if (types.includes('administrative_area_level_2')) county = c.longText;
          if (types.includes('postal_code')) postcode = c.longText || c.shortText;
          if (types.includes('country')) country = c.longText;
        }
      }
    }
  }

  // 2. Validate with Google Address Validation API if address line is available
  if (fullAddress) {
    const valResult = await validateAddressWithGoogle([fullAddress]);
    if (valResult.formattedAddress) {
      fullAddress = valResult.formattedAddress;
    }
    if (valResult.postcode && !postcode) {
      postcode = valResult.postcode;
    }
    if (valResult.latitude && !latitude) {
      latitude = valResult.latitude;
      longitude = valResult.longitude || longitude;
    }
    validationStatus = valResult.status;
  }

  // 3. Fallback postcode extraction from address string
  if (!postcode) {
    const pcMatch = fullAddress.match(/([A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2})/i);
    if (pcMatch) {
      postcode = normalizeUKPostcode(pcMatch[1]);
    }
  } else {
    postcode = normalizeUKPostcode(postcode);
  }

  // 4. Fallback coordinates lookup via postcodes.io if coordinates are still 0
  if ((!latitude || !longitude) && postcode) {
    try {
      const clean = postcode.replace(/\s+/g, '');
      const pcRes = await fetch(`/api/delivery/postcode/${encodeURIComponent(clean)}`);
      if (pcRes.ok) {
        const pcData = await pcRes.json();
        if (pcData.result) {
          latitude = pcData.result.latitude;
          longitude = pcData.result.longitude;
          if (!town) town = pcData.result.admin_ward || pcData.result.admin_district || '';
        }
      }
    } catch {
      // ignore
    }
  }

  // Default coordinate fallback to central London if unresolved
  if (!latitude || !longitude) {
    latitude = 51.5133;
    longitude = -0.1365;
  }

  return {
    houseNumber: houseNumber || '',
    buildingName: '',
    street: street || suggestion.mainText || '',
    town: town || 'London',
    city: town || 'London',
    county: county || 'Greater London',
    postcode: postcode || 'HA9 8AB',
    country: country || 'United Kingdom',
    fullAddress,
    latitude,
    longitude,
    placeId: suggestion.placeId || `loc_${Date.now()}`,
    validationStatus,
  };
}

/**
 * 5. Check Backend Delivery Availability (Strict Server-Side Verification)
 */
export interface DeliveryValidationResult {
  isValid: boolean;
  isRestricted?: boolean;
  message: string;
  distanceMiles?: number;
  estimatedDriveMins?: number;
  deliveryFee?: number;
  minimumOrder?: number;
  deliveryZone?: string;
}

export function extractStructuredAddress(suggestion: AddressSuggestion): StructuredAddress {
  const parts = suggestion.description.split(',').map((p) => p.trim());
  let houseNumber = '';
  let street = suggestion.mainText || '';
  let town = 'London';
  let county = 'Greater London';
  let postcode = suggestion.postcode || 'HA9 8AB';

  const numMatch = street.match(/^(\d+[A-Za-z]?)\s+(.*)/);
  if (numMatch) {
    houseNumber = numMatch[1];
    street = numMatch[2];
  }

  if (parts.length > 2) {
    town = parts[parts.length - 3] || town;
  }

  return {
    houseNumber,
    buildingName: '',
    street,
    town,
    city: town,
    county,
    postcode,
    country: 'United Kingdom',
    fullAddress: suggestion.description,
    latitude: suggestion.latitude || 51.556,
    longitude: suggestion.longitude || -0.2796,
    placeId: suggestion.placeId,
  };
}

export function validateStoreDelivery(
  store: Store,
  customerLat?: number,
  customerLng?: number,
  customerPostcode?: string,
  customerAddress?: string,
  settings?: StoreDeliverySettings | null,
  zones?: DeliveryZone[]
): DeliveryValidationResult {
  const sLat = store.latitude || 51.5133;
  const sLng = store.longitude || -0.1365;

  let distanceMiles = 2.0;
  if (customerLat && customerLng) {
    distanceMiles = calculateDistanceMiles(sLat, sLng, customerLat, customerLng);
  }

  // Admin-configured restricted addresses/postcodes are the ONLY restriction source.
  let isRestricted = false;
  let restrictionReason = '';

  // 1. Store global delivery disabled by Admin
  if (store.isDeliveryEnabled === false || (settings && settings.enabled === false)) {
    isRestricted = true;
    restrictionReason = 'Delivery is currently disabled for this store in Admin settings.';
  }

  // 2. Admin restricted postcodes list
  if (!isRestricted && customerPostcode && settings?.restrictedPostcodes && settings.restrictedPostcodes.length > 0) {
    const pcParsed = parseUKPostcode(customerPostcode);
    const cleanCustomer = customerPostcode.trim().toUpperCase().replace(/\s+/g, '');
    const matched = settings.restrictedPostcodes.find((rp) => {
      const cleanRp = rp.trim().toUpperCase().replace(/\s+/g, '');
      return (
        cleanCustomer === cleanRp ||
        pcParsed.compact === cleanRp ||
        pcParsed.district === cleanRp ||
        pcParsed.area === cleanRp ||
        // Keep the space so sector "E1 1" is not confused with district "E11"
        pcParsed.sector === rp.trim().toUpperCase().replace(/\s+/g, ' ')
      );
    });
    if (matched) {
      isRestricted = true;
      restrictionReason = `Postcode "${customerPostcode}" is restricted in Admin delivery settings.`;
    }
  }

  // 3. Admin restricted addresses list
  if (!isRestricted && customerAddress && settings?.restrictedAddresses && settings.restrictedAddresses.length > 0) {
    const cleanAddr = customerAddress.toLowerCase();
    const matchedAddr = settings.restrictedAddresses.find((ra) => {
      const trimmed = ra.trim().toLowerCase();
      return trimmed.length > 0 && cleanAddr.includes(trimmed);
    });
    if (matchedAddr) {
      isRestricted = true;
      restrictionReason = `Address matches restricted location "${matchedAddr}" in Admin delivery settings.`;
    }
  }

  // 4. Admin deactivated Delivery Zone (active === false)
  if (!isRestricted && customerPostcode && zones && zones.length > 0) {
    const pcParsed = parseUKPostcode(customerPostcode);
    const disabledZone = zones.find(
      (z) =>
        z.storeId === store.id &&
        z.active === false &&
        (z.postcodeRule.trim().toUpperCase().replace(/\s+/g, '') === pcParsed.compact ||
          z.postcodeRule.trim().toUpperCase() === pcParsed.district ||
          z.postcodeRule.trim().toUpperCase() === pcParsed.area ||
          z.postcodeRule.trim().toUpperCase().replace(/\s+/g, ' ') === pcParsed.sector)
    );
    if (disabledZone) {
      isRestricted = true;
      restrictionReason = `Delivery zone "${disabledZone.postcodeRule}" is restricted/disabled in Admin settings.`;
    }
  }

  return {
    isValid: !isRestricted,
    isRestricted,
    message: isRestricted
      ? `Restricted Delivery Area: ${restrictionReason}`
      : 'Delivery Available',
    distanceMiles,
    estimatedDriveMins: Math.round(distanceMiles * 3.5 + 10),
    deliveryFee: store.deliveryFee ?? 2.5,
    minimumOrder: store.minimumDeliveryOrder ?? 12.0,
  };
}

export async function geocodeAddressWithPostcode(
  address: string,
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  if (postcode) {
    try {
      const clean = postcode.replace(/\s+/g, '');
      const res = await fetch(`/api/delivery/postcode/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result?.latitude && data.result?.longitude) {
          return { lat: data.result.latitude, lng: data.result.longitude };
        }
      }
    } catch {
      // fallback
    }

    // Static hosting has no /api proxy, so ask postcodes.io directly
    try {
      const clean = postcode.replace(/\s+/g, '');
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result?.latitude && data.result?.longitude) {
          return { lat: data.result.latitude, lng: data.result.longitude };
        }
      }
    } catch {
      // fallback
    }
  }

  // Geocode address line
  try {
    const res = await fetch(`/api/delivery/geocode?address=${encodeURIComponent(`${address}, ${postcode}, UK`)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.[0]?.geometry?.location) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        };
      }
    }
  } catch {
    // fallback
  }

  return null;
}

export async function verifyDeliveryAvailabilityWithBackend(params: {
  store: Store;
  settings?: StoreDeliverySettings | null;
  zones?: DeliveryZone[];
  postcode: string;
  customerLat?: number;
  customerLng?: number;
  cartSubtotal: number;
}): Promise<DeliveryCheckResult> {
  try {
    const res = await fetch('/api/delivery/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend delivery check failed, using local calculation fallback:', err);
  }

  // Client-side fallback computation
  const { checkDeliveryAvailability } = await import('./deliveryService');
  return checkDeliveryAvailability({
    store: params.store,
    settings: params.settings,
    zones: params.zones,
    customerPostcode: params.postcode,
    customerLat: params.customerLat,
    customerLng: params.customerLng,
    cartSubtotal: params.cartSubtotal,
  });
}
