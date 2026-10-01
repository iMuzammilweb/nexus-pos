/**
 * Phone Number Normalization & Deduplication Helper for Nexus POS
 * Ensures accurate matching across international and UK formatting variations:
 * e.g. +44 7911 123456, 07911 123456, 07911123456, 447911123456
 */

export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Strip all non-digit characters
  let digits = phone.replace(/[^0-9]/g, '');
  // If starts with UK country code '44' and is at least 11 digits:
  // e.g. 447911123456 -> 07911123456
  if (digits.startsWith('44') && digits.length >= 11) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

export function arePhonesEqual(
  phoneA: string | null | undefined,
  phoneB: string | null | undefined
): boolean {
  if (!phoneA || !phoneB) return false;
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (!normA || !normB) return false;

  // Exact normalized match
  if (normA === normB) return true;

  // Strip leading zeros for direct mobile number comparison
  const strippedA = normA.replace(/^0+/, '');
  const strippedB = normB.replace(/^0+/, '');
  if (strippedA === strippedB && strippedA.length >= 7) return true;

  // Match by the last 9 digits (UK subscriber portion)
  if (normA.length >= 9 && normB.length >= 9) {
    if (normA.slice(-9) === normB.slice(-9)) {
      return true;
    }
  }

  return false;
}

/**
 * Format phone number nicely for display: e.g. 07911 123456 or +44 7911 123456
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  const digits = normalizePhoneNumber(cleaned);
  if (digits.startsWith('0') && digits.length === 11) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return cleaned;
}
