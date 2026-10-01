/**
 * Phone Number Utilities for Nexus POS
 * Handles normalization, clean digit extraction, and robust cross-format matching
 * (e.g. UK standard format 07xxx vs +447xxx vs 447xxx).
 */

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').trim();
}

export function extractDigits(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Robust check if two phone strings refer to the same customer phone number.
 * Primary unique identifier for customer lookup.
 */
export function phonesMatch(phoneA?: string, phoneB?: string): boolean {
  if (!phoneA || !phoneB) return false;
  const cleanA = phoneA.trim();
  const cleanB = phoneB.trim();
  if (!cleanA || !cleanB) return false;

  const normA = normalizePhone(cleanA);
  const normB = normalizePhone(cleanB);
  if (normA && normB && normA.toLowerCase() === normB.toLowerCase()) {
    return true;
  }

  const digitsA = extractDigits(cleanA);
  const digitsB = extractDigits(cleanB);
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  // Handle UK formats: 07xxxxxxxxx (11 digits) vs 447xxxxxxxxx (12 digits)
  const canonicalA = digitsA.startsWith('44') ? '0' + digitsA.slice(2) : digitsA;
  const canonicalB = digitsB.startsWith('44') ? '0' + digitsB.slice(2) : digitsB;
  if (canonicalA === canonicalB) return true;

  // If at least 9 digits long and last 9 or 10 digits match
  if (digitsA.length >= 9 && digitsB.length >= 9) {
    const endA = digitsA.slice(-9);
    const endB = digitsB.slice(-9);
    if (endA === endB) return true;
  }

  return false;
}
