import { DeliveryZone, StoreDeliverySettings, DeliveryCheckResult, Store } from '../types';
import { parseUKPostcode, calculateHaversineDistanceMiles } from '../utils/postcodeHelper';

export interface CheckDeliveryInput {
  store: Store;
  settings?: StoreDeliverySettings | null;
  zones?: DeliveryZone[];
  customerPostcode: string;
  customerLat?: number;
  customerLng?: number;
  cartSubtotal: number;
}

/**
 * Checks delivery availability, applies precision rule precedence:
 * Full Postcode -> Postcode Sector -> Postcode District -> Postcode Area
 * Also evaluates delivery method (postcode, radius, or postcode_and_radius)
 * and verifies minimum order requirements.
 */
export function checkDeliveryAvailability(input: CheckDeliveryInput): DeliveryCheckResult {
  const {
    store,
    settings,
    zones = [],
    customerPostcode,
    customerLat,
    customerLng,
    cartSubtotal,
  } = input;

  // 1. Store existence & active status
  if (!store || store.isActive === false || store.activeStatus === 'Inactive' || store.activeStatus === 'Suspended') {
    return {
      available: false,
      reason: 'STORE_UNAVAILABLE',
      deliveryFee: 0,
      minimumOrder: 0,
      estimatedTime: 'N/A',
      distanceMiles: 0,
      message: `${store?.businessName || 'This store'} is currently not accepting orders.`,
    };
  }

  // 2. Delivery enabled check
  const isEnabled = settings?.enabled ?? store.isDeliveryEnabled ?? true;
  if (!isEnabled) {
    return {
      available: false,
      reason: 'DELIVERY_DISABLED',
      deliveryFee: 0,
      minimumOrder: 0,
      estimatedTime: 'N/A',
      distanceMiles: 0,
      message: 'Delivery is currently not enabled for this store.',
    };
  }

  // 3. Postcode Validation
  const parsedPc = parseUKPostcode(customerPostcode);
  if (!customerPostcode?.trim() || !parsedPc.isValid) {
    return {
      available: false,
      reason: 'INVALID_POSTCODE',
      deliveryFee: 0,
      minimumOrder: 0,
      estimatedTime: 'N/A',
      distanceMiles: 0,
      message: 'Please enter a valid UK postcode.',
    };
  }

  // Resolve Store Coordinates
  const storeLat = settings?.storeLatitude || store.latitude || 51.5133;
  const storeLng = settings?.storeLongitude || store.longitude || -0.1365;

  // Calculate Distance if customer coordinates are present
  let distanceMiles = 0;
  if (typeof customerLat === 'number' && typeof customerLng === 'number' && customerLat !== 0 && customerLng !== 0) {
    distanceMiles = calculateHaversineDistanceMiles(storeLat, storeLng, customerLat, customerLng);
  }

  const deliveryMethod = settings?.method || 'postcode';
  const radiusMiles = settings?.radiusMiles || store.deliveryRadiusMiles || 5.0;
  const defaultFee = settings?.defaultFee ?? store.deliveryFee ?? 2.5;
  const defaultMinOrder = settings?.defaultMinimumOrder ?? store.minimumDeliveryOrder ?? 10.0;
  const defaultEta = settings?.defaultEstimatedTime || '30–45 minutes';

  // 4. Admin Restricted Postcodes Check
  if (customerPostcode && settings?.restrictedPostcodes && settings.restrictedPostcodes.length > 0) {
    const cleanCustomer = customerPostcode.trim().toUpperCase().replace(/\s+/g, '');
    const matched = settings.restrictedPostcodes.find((rp) => {
      const cleanRp = rp.trim().toUpperCase().replace(/\s+/g, '');
      return (
        cleanCustomer === cleanRp ||
        parsedPc.compact === cleanRp ||
        parsedPc.district === cleanRp ||
        parsedPc.area === cleanRp ||
        // Keep the space so sector "E1 1" is not confused with district "E11"
        parsedPc.sector === rp.trim().toUpperCase().replace(/\s+/g, ' ')
      );
    });
    if (matched) {
      return {
        available: false,
        reason: 'RESTRICTED_DELIVERY_AREA',
        deliveryFee: defaultFee,
        minimumOrder: defaultMinOrder,
        estimatedTime: defaultEta,
        distanceMiles,
        message: `Restricted Delivery Area: Postcode "${customerPostcode}" is restricted in Admin delivery settings.`,
      };
    }
  }

  // 5. Admin Deactivated Zones Check
  if (customerPostcode && zones && zones.length > 0) {
    const disabledZone = zones.find(
      (z) =>
        z.storeId === store.id &&
        z.active === false &&
        (z.postcodeRule.trim().toUpperCase().replace(/\s+/g, '') === parsedPc.compact ||
          z.postcodeRule.trim().toUpperCase() === parsedPc.district ||
          z.postcodeRule.trim().toUpperCase() === parsedPc.area ||
          z.postcodeRule.trim().toUpperCase().replace(/\s+/g, ' ') === parsedPc.sector)
    );
    if (disabledZone) {
      return {
        available: false,
        reason: 'RESTRICTED_DELIVERY_AREA',
        deliveryFee: defaultFee,
        minimumOrder: defaultMinOrder,
        estimatedTime: defaultEta,
        distanceMiles,
        message: `Restricted Delivery Area: Delivery zone "${disabledZone.postcodeRule}" is restricted in Admin settings.`,
      };
    }
  }

  // 6. Postcode Zone Matching (for custom fee/time tiering; if no zone matched, fallback to default fee)
  let matchedZone: DeliveryZone | null = null;
  if (zones && zones.length > 0) {
    const activeZones = zones.filter((z) => z.active && z.storeId === store.id);

    const fullMatch = activeZones.find(
      (z) => z.ruleType === 'full' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === parsedPc.compact
    );
    const sectorMatch = activeZones.find(
      (z) => z.ruleType === 'sector' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === parsedPc.sector.replace(/\s+/g, '')
    );
    const districtMatch = activeZones.find(
      (z) => z.ruleType === 'district' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === parsedPc.district
    );
    const areaMatch = activeZones.find(
      (z) => z.ruleType === 'area' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === parsedPc.area
    );

    matchedZone = fullMatch || sectorMatch || districtMatch || areaMatch || null;
  }

  // 6. Determine applicable Fee, Min Order, and ETA
  const finalFee = matchedZone ? matchedZone.deliveryFee : defaultFee;
  const finalMinOrder = matchedZone ? matchedZone.minimumOrder : defaultMinOrder;
  const finalEta = matchedZone ? matchedZone.estimatedTime : defaultEta;
  const zoneName = matchedZone ? matchedZone.postcodeRule : (deliveryMethod === 'radius' ? `Within ${radiusMiles} miles` : 'Standard Delivery');

  // 7. Minimum Order Check
  if (cartSubtotal > 0 && cartSubtotal < finalMinOrder) {
    const diff = (finalMinOrder - cartSubtotal).toFixed(2);
    return {
      available: false,
      reason: 'MINIMUM_ORDER_NOT_MET',
      deliveryZone: zoneName,
      deliveryFee: finalFee,
      minimumOrder: finalMinOrder,
      estimatedTime: finalEta,
      distanceMiles,
      matchedRuleType: matchedZone ? matchedZone.ruleType : 'default',
      message: `Minimum order not met. Please add £${diff} more to your order.`,
    };
  }

  return {
    available: true,
    reason: null,
    deliveryZone: zoneName,
    deliveryFee: finalFee,
    minimumOrder: finalMinOrder,
    estimatedTime: finalEta,
    distanceMiles,
    matchedRuleType: matchedZone ? matchedZone.ruleType : (deliveryMethod === 'radius' ? 'radius' : 'default'),
    message: `Delivery available to ${parsedPc.normalized || customerPostcode}. Delivery fee: £${finalFee.toFixed(2)}.`,
  };
}
