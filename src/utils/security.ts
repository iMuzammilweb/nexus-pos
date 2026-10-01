// Security & Password Hashing Utilities (SHA-256 NIST Standard)

/**
 * Pure TypeScript synchronous SHA-256 implementation.
 * Zero external dependencies; runs deterministically across Node.js & all browsers.
 */
export function sha256Sync(ascii: string): string {
  if (!ascii) return '';

  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  let result = '';

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // UTF-8 encoding
  const utf8: number[] = [];
  for (let m = 0; m < ascii.length; m++) {
    let charcode = ascii.charCodeAt(m);
    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      m++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (ascii.charCodeAt(m) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  for (let b = 0; b < utf8.length; b++) {
    words[b >> 2] |= utf8[b] << ((3 - (b % 4)) * 8);
  }
  const utf8BitLength = utf8.length * 8;
  words[utf8BitLength >> 5] |= 0x80 << (24 - (utf8BitLength % 32));
  words[(((utf8BitLength + 64) >> 9) << 4) + 15] = utf8BitLength;

  const w = new Array(64);
  for (let chunk = 0; chunk < words.length; chunk += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let round = 0; round < 64; round++) {
      if (round < 16) {
        w[round] = words[chunk + round] || 0;
      } else {
        const gamma0 = rightRotate(w[round - 15], 7) ^ rightRotate(w[round - 15], 18) ^ (w[round - 15] >>> 3);
        const gamma1 = rightRotate(w[round - 2], 17) ^ rightRotate(w[round - 2], 19) ^ (w[round - 2] >>> 10);
        w[round] = (w[round - 16] + gamma0 + w[round - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[round] + w[round]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (let r = 0; r < 8; r++) {
    for (let part = 3; part >= 0; part--) {
      const byteVal = (hash[r] >> (part * 8)) & 255;
      result += (byteVal < 16 ? '0' : '') + byteVal.toString(16);
    }
  }
  return result;
}

export function hashPasswordSync(plainPassword: string): string {
  if (!plainPassword) return '';
  return sha256Sync(plainPassword);
}

export function verifyPasswordSync(plainPassword: string, storedHashOrPlain: string): boolean {
  if (!plainPassword || !storedHashOrPlain) return false;
  
  // If stored value is already a SHA-256 hash (64 hex characters)
  if (/^[a-f0-9]{64}$/i.test(storedHashOrPlain)) {
    const computed = hashPasswordSync(plainPassword);
    return computed.toLowerCase() === storedHashOrPlain.toLowerCase();
  }
  
  // Direct match or hashed comparison with legacy plain strings
  return plainPassword === storedHashOrPlain || hashPasswordSync(plainPassword) === storedHashOrPlain;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return hashPasswordSync(plainPassword);
}

export async function verifyPassword(plainPassword: string, storedHashOrPlain: string): Promise<boolean> {
  return verifyPasswordSync(plainPassword, storedHashOrPlain);
}

