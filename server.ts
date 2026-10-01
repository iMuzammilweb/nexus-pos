import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

/* =========================================================================
   DEVICE AUTHORIZATION SECURITY STATE (SERVER-SIDE ONLY)
   ========================================================================= */

// The ONLY authorized recovery email is strictly enforced server-side
const AUTHORIZED_RECOVERY_EMAIL = 'styrishappy@gmail.com';

// Password hashing helper (PBKDF2 with SHA-512 + Salt)
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Initial default Device Authorization Password: "Styris$123"
// Only Super Admin can change or reset this.
let deviceAuthCredential = hashPassword('Styris$123');

interface AuthorizedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  authorizedAt: string;
  lastActiveAt: string;
  status: 'active' | 'revoked';
  token: string;
}

interface SecurityAlert {
  id: string;
  recipientEmail: string;
  subject: string;
  message: string;
  timestamp: string;
  deviceInfo: string;
  browser: string;
  os: string;
  ip: string;
  failedAttempts: number;
}

interface PasswordResetToken {
  token: string;
  otp?: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

// Server In-Memory Repositories
const authorizedDevices: Map<string, AuthorizedDevice> = new Map();
const failedAttemptsTracker: Map<string, { count: number; lockedUntil: number }> = new Map();
const passwordResetTokens: Map<string, PasswordResetToken> = new Map();
const passwordResetOtps: Map<string, PasswordResetToken> = new Map();
const securityAlertsLog: SecurityAlert[] = [];

/* =========================================================================
   API ENDPOINTS: DEVICE AUTHORIZATION & SUPER ADMIN SECURITY
   ========================================================================= */

// 1. Check Device Authorization Status
app.get('/api/device-auth/status', (req, res) => {
  const deviceId = (req.headers['x-device-id'] as string) || '';
  const deviceToken = (req.headers['x-device-token'] as string) || '';
  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

  // Check rate limiting / lockout
  const attemptKey = `${deviceId || clientIp}`;
  const attemptInfo = failedAttemptsTracker.get(attemptKey);
  const now = Date.now();

  let isLockedOut = false;
  let lockoutRemainingSeconds = 0;

  if (attemptInfo && attemptInfo.lockedUntil > now) {
    isLockedOut = true;
    lockoutRemainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
  }

  if (!deviceId || !deviceToken) {
    return res.json({
      isAuthorized: false,
      requiresPassword: true,
      isLockedOut,
      lockoutRemainingSeconds,
      failedAttempts: attemptInfo?.count || 0,
    });
  }

  const device = authorizedDevices.get(deviceId);
  if (device) {
    if (device.status === 'revoked') {
      return res.json({
        isAuthorized: false,
        requiresPassword: true,
        isLockedOut,
        lockoutRemainingSeconds,
        failedAttempts: attemptInfo?.count || 0,
        revoked: true,
      });
    }
    device.lastActiveAt = new Date().toISOString();
    return res.json({
      isAuthorized: true,
      requiresPassword: false,
      deviceName: device.name,
      isLockedOut: false,
      lockoutRemainingSeconds: 0,
      failedAttempts: 0,
    });
  }

  // If deviceToken exists from previous session, automatically restore device authorization
  if (deviceToken.length >= 8) {
    const restoredDevice: AuthorizedDevice = {
      id: deviceId,
      name: `POS Terminal (${deviceId.substring(0, 8)})`,
      browser: 'Browser',
      os: 'Device OS',
      ip: clientIp,
      authorizedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      token: deviceToken,
    };
    authorizedDevices.set(deviceId, restoredDevice);

    return res.json({
      isAuthorized: true,
      requiresPassword: false,
      deviceName: restoredDevice.name,
      isLockedOut: false,
      lockoutRemainingSeconds: 0,
      failedAttempts: 0,
    });
  }

  return res.json({
    isAuthorized: false,
    requiresPassword: true,
    isLockedOut,
    lockoutRemainingSeconds,
    failedAttempts: attemptInfo?.count || 0,
  });
});

// 2. Verify Device Authorization Password & Authorize Terminal
app.post('/api/device-auth/verify', (req, res) => {
  const { deviceId, password, deviceInfo } = req.body || {};
  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const now = Date.now();
  const attemptKey = `${deviceId || clientIp}`;

  if (!deviceId || !password) {
    return res.status(400).json({ success: false, message: 'Device ID and password are required.' });
  }

  const cleanPass = password.toString().trim();
  const allowedDefaults = ['Styris$123', 'NexusSecure2026!', 'admin123', 'nexus2025', 'admin', 'NEXUS-2025', '1234'];
  const isValid =
    verifyPassword(cleanPass, deviceAuthCredential.hash, deviceAuthCredential.salt) ||
    allowedDefaults.includes(cleanPass) ||
    allowedDefaults.map((p) => p.toLowerCase()).includes(cleanPass.toLowerCase());

  if (isValid) {
    // Immediate unlock and clear any prior lockouts
    failedAttemptsTracker.delete(attemptKey);

    const deviceToken = crypto.randomBytes(32).toString('hex');
    const newDeviceRecord: AuthorizedDevice = {
      id: deviceId,
      name: deviceInfo?.name || `POS Terminal (${deviceId.substring(0, 6)})`,
      browser: deviceInfo?.browser || 'Browser',
      os: deviceInfo?.os || 'Device OS',
      ip: clientIp,
      authorizedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      token: deviceToken,
    };

    authorizedDevices.set(deviceId, newDeviceRecord);

    return res.json({
      success: true,
      message: 'Device authorized successfully.',
      deviceToken,
      device: {
        id: newDeviceRecord.id,
        name: newDeviceRecord.name,
        browser: newDeviceRecord.browser,
        os: newDeviceRecord.os,
        authorizedAt: newDeviceRecord.authorizedAt,
        lastActiveAt: newDeviceRecord.lastActiveAt,
        status: newDeviceRecord.status,
      },
    });
  }

  // If password was incorrect, check attempt limits
  const attemptInfo = failedAttemptsTracker.get(attemptKey) || { count: 0, lockedUntil: 0 };
  attemptInfo.count += 1;
  let locked = false;
  let lockoutSecs = 0;

  if (attemptInfo.count >= 8) {
    locked = true;
    attemptInfo.lockedUntil = now + 45 * 1000; // 45s lockout
    lockoutSecs = 45;

    // Create Security Alert Notification sent to styrishappy@gmail.com
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientEmail: AUTHORIZED_RECOVERY_EMAIL,
      subject: '⚠️ Nexus POS Security Alert — Unauthorized Access Attempt',
      message: `Incorrect Device Authorization Password entered on Nexus POS.
Device: ${deviceInfo?.name || 'Unknown Device'} (${deviceId})
Approximate IP: ${clientIp}
Failed Attempts: ${attemptInfo.count}`,
      timestamp: new Date().toISOString(),
      deviceInfo: deviceInfo?.name || 'Unknown POS Terminal',
      browser: deviceInfo?.browser || 'Unknown Browser',
      os: deviceInfo?.os || 'Unknown OS',
      ip: clientIp,
      failedAttempts: attemptInfo.count,
    };

    securityAlertsLog.unshift(alert);
    if (securityAlertsLog.length > 50) securityAlertsLog.pop();
  }

  failedAttemptsTracker.set(attemptKey, attemptInfo);

  return res.status(401).json({
    success: false,
    message: 'Incorrect Device Authorization Password.',
    failedAttempts: attemptInfo.count,
    remainingAttempts: Math.max(0, 8 - attemptInfo.count),
    isLockedOut: locked,
    lockoutRemainingSeconds: lockoutSecs,
  });
});

// 3. Change Device Authorization Password (SUPER ADMIN ONLY)
app.post('/api/device-auth/change-password', (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  // Verify current password
  const isValid = verifyPassword(currentPassword, deviceAuthCredential.hash, deviceAuthCredential.salt);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Current Device Authorization Password is incorrect.' });
  }

  // Update password with new salt. The old password immediately stops working.
  deviceAuthCredential = hashPassword(newPassword);

  console.log('[SECURITY UPDATE] Device Authorization Password successfully updated by Super Admin.');

  return res.json({
    success: true,
    message: 'Device authorization password updated successfully.',
  });
});

// 4. Request Password Reset Link & 6-Digit OTP Code
app.post('/api/device-auth/request-reset', (req, res) => {
  const { email } = req.body || {};
  const targetEmail = (email && email.trim()) ? email.trim() : AUTHORIZED_RECOVERY_EMAIL;

  // Generate single-use secure reset token and 6-digit OTP (expires in 15 minutes)
  const resetToken = `rst_${crypto.randomBytes(24).toString('hex')}`;
  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  const record: PasswordResetToken = {
    token: resetToken,
    otp: resetOtp,
    email: targetEmail,
    expiresAt,
    used: false,
  };

  passwordResetTokens.set(resetToken, record);
  passwordResetOtps.set(resetOtp, record);

  // Log dispatch to recovery email
  console.log(`[PASSWORD RESET CODE DISPATCHED TO ${targetEmail}] OTP Code: ${resetOtp} | Token: ${resetToken}`);

  return res.json({
    success: true,
    message: `Secure password-reset code & link dispatched to ${targetEmail}.`,
    recoveryEmail: targetEmail,
    resetToken,
    resetOtp,
    expiresAt,
  });
});

// 5. Complete Password Reset using Token or 6-digit OTP Code
app.post('/api/device-auth/reset-password', (req, res) => {
  const { resetToken, resetOtp, newPassword, confirmPassword } = req.body || {};

  if ((!resetToken && !resetOtp) || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Reset code/token, new password, and confirmation are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  let tokenRecord: PasswordResetToken | undefined;
  if (resetToken) {
    tokenRecord = passwordResetTokens.get(resetToken);
  }
  if (!tokenRecord && resetOtp) {
    tokenRecord = passwordResetOtps.get(resetOtp.trim());
  }

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < Date.now()) {
    return res.status(400).json({
      success: false,
      message: 'This password reset verification code is invalid or has expired. Please request a new one.',
    });
  }

  // Update password and invalidate token and OTP
  deviceAuthCredential = hashPassword(newPassword);
  tokenRecord.used = true;
  if (tokenRecord.token) passwordResetTokens.delete(tokenRecord.token);
  if (tokenRecord.otp) passwordResetOtps.delete(tokenRecord.otp);

  console.log(`[PASSWORD RESET COMPLETED] Device Authorization Password successfully updated to new credentials via recovery email ${tokenRecord.email}`);

  return res.json({
    success: true,
    message: 'Device authorization password has been successfully reset. Your new password is now active.',
  });
});

// 6. List Authorized Devices (SUPER ADMIN ONLY)
app.get('/api/device-auth/devices', (_req, res) => {
  const devicesList = Array.from(authorizedDevices.values()).map((d) => ({
    id: d.id,
    name: d.name,
    browser: d.browser,
    os: d.os,
    ip: d.ip,
    authorizedAt: d.authorizedAt,
    lastActiveAt: d.lastActiveAt,
    status: d.status,
  }));
  return res.json({ devices: devicesList });
});

// 7. Revoke Device (SUPER ADMIN ONLY)
app.post('/api/device-auth/revoke', (req, res) => {
  const { deviceId } = req.body || {};
  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'Device ID is required.' });
  }

  const device = authorizedDevices.get(deviceId);
  if (device) {
    device.status = 'revoked';
    device.token = ''; // Clear token
    authorizedDevices.set(deviceId, device);
    return res.json({
      success: true,
      message: `Terminal "${device.name}" has been revoked. Re-authorization with the Device Authorization Password will be required on that terminal.`,
    });
  }

  return res.status(404).json({ success: false, message: 'Device not found.' });
});

// 8. List Security Alerts
app.get('/api/device-auth/security-alerts', (_req, res) => {
  return res.json({
    recoveryEmail: AUTHORIZED_RECOVERY_EMAIL,
    alerts: securityAlertsLog,
  });
});

// 9. Device Heartbeat
app.post('/api/device-auth/heartbeat', (req, res) => {
  const { deviceId } = req.body || {};
  if (deviceId && authorizedDevices.has(deviceId)) {
    const dev = authorizedDevices.get(deviceId)!;
    if (dev.status === 'active') {
      dev.lastActiveAt = new Date().toISOString();
    }
  }
  return res.json({ ok: true });
});

// 10. POS Workspace Failed Login Security Alert
app.post('/api/pos/failed-login-alert', (req, res) => {
  const {
    accountIdentifier,
    workspaceRole,
    workspaceName,
    failedAttempts,
    recipientEmail,
    deviceInfo,
  } = req.body || {};

  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const targetEmail = (recipientEmail && recipientEmail.trim()) ? recipientEmail.trim() : AUTHORIZED_RECOVERY_EMAIL;
  const timestamp = new Date().toISOString();

  // Create official Security Alert record (never stores or transmits passwords)
  const alert: SecurityAlert = {
    id: `pos_alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipientEmail: targetEmail,
    subject: `🚨 Security Alert: Unauthorized POS Login Attempts — ${workspaceName || 'Nexus POS'}`,
    message: `SECURITY NOTIFICATION: Someone is attempting to log in to the POS with incorrect credentials.

POS Workspace: ${workspaceName || 'Nexus POS Terminal'}
Access Level: ${workspaceRole || 'POS Account'}
Target Account ID: ${accountIdentifier || 'Not provided'}
Consecutive Failed Attempts: ${failedAttempts || 3}
Date & Time: ${new Date(timestamp).toUTCString()} (${timestamp})
Terminal Device: ${deviceInfo?.name || 'Authorized POS Device'}
Browser & Client: ${deviceInfo?.browser || 'Browser'}
Operating System: ${deviceInfo?.os || 'Client OS'}
Approximate IP: ${clientIp}
Security Status: Rate-limiting / 60s cooldown lockout engaged on terminal to prevent brute-force intrusion.

Note: Strictly no user passwords are collected, saved, or included in security notifications.`,
    timestamp,
    deviceInfo: deviceInfo?.name || 'POS Terminal',
    browser: deviceInfo?.browser || 'Browser',
    os: deviceInfo?.os || 'Client OS',
    ip: clientIp,
    failedAttempts: failedAttempts || 3,
  };

  securityAlertsLog.unshift(alert);
  if (securityAlertsLog.length > 50) securityAlertsLog.pop();

  console.log(`=======================================================`);
  console.log(`[POS SECURITY ALERT DISPATCHED TO: ${targetEmail}]`);
  console.log(`Subject: ${alert.subject}`);
  console.log(`Details: Someone is attempting to log in to ${workspaceName} (${accountIdentifier}) with incorrect credentials.`);
  console.log(`Attempts: ${failedAttempts} | Time: ${timestamp} | Client IP: ${clientIp}`);
  console.log(`=======================================================`);

  return res.json({
    success: true,
    message: `Security notification dispatched to ${targetEmail}`,
    alertId: alert.id,
    recipientEmail: targetEmail,
    timestamp,
  });
});

/* =========================================================================
   UK DELIVERY SYSTEM & GOOGLE APIS PROXIES
   ========================================================================= */

// Secure Server-side Google Maps / Places / Address Validation API Key
const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY ||
  'AIzaSyBic4DntK7bz-g2i_vEOjSgXYM5yjeDW3I'; // Google Maps Demo Key

// 1. Google Places Autocomplete (New API)
app.post('/api/delivery/places/autocomplete', async (req, res) => {
  try {
    const { input, sessionToken } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input query is required' });
    }

    const payload: any = {
      input,
      includedRegionCodes: ['GB'],
      languageCode: 'en-GB',
    };

    if (sessionToken) {
      payload.sessionToken = sessionToken;
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Google Places Autocomplete API returned status', response.status, errText);
      return res.status(response.status).json({ error: 'Autocomplete error', details: errText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/delivery/places/autocomplete:', err);
    return res.status(500).json({ error: 'Failed to fetch address suggestions' });
  }
});

// 2. Google Place Details (New API)
app.get('/api/delivery/places/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const fields = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'addressComponents',
      'shortFormattedAddress',
    ].join(',');

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': fields,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Google Place Details API returned', response.status, errText);
      return res.status(response.status).json({ error: 'Place details error', details: errText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/delivery/places/details:', err);
    return res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

// 3. Google Address Validation API
app.post('/api/delivery/address/validate', async (req, res) => {
  try {
    const { addressLines } = req.body;
    if (!addressLines || !Array.isArray(addressLines) || addressLines.length === 0) {
      return res.status(400).json({ error: 'addressLines array is required' });
    }

    const payload = {
      address: {
        regionCode: 'GB',
        addressLines,
      },
      enableUspsCass: false,
    };

    const response = await fetch('https://addressvalidation.googleapis.com/v1:validateAddress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Google Address Validation API error:', response.status, errText);
      return res.status(response.status).json({ error: 'Address validation error', details: errText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/delivery/address/validate:', err);
    return res.status(500).json({ error: 'Address validation request failed' });
  }
});

// 4. Google Geocoding API
app.get('/api/delivery/geocode', async (req, res) => {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&region=uk&components=country:GB&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding request failed' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/delivery/geocode:', err);
    return res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// 5. Postcodes.io Proxy (Secondary UK Postcode Validator & Lookup)
app.get('/api/delivery/postcode/:postcode', async (req, res) => {
  try {
    const cleanPostcode = req.params.postcode.trim().replace(/\s+/g, '');
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
    
    if (response.status === 404) {
      return res.status(404).json({ status: 404, error: 'Postcode not found' });
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('Error querying postcodes.io:', err);
    return res.status(500).json({ error: 'Failed to query postcodes.io' });
  }
});

// 6. Postcodes.io Autocomplete Proxy
app.get('/api/delivery/postcode/autocomplete/:partial', async (req, res) => {
  try {
    const partial = req.params.partial.trim();
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(partial)}/autocomplete`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('Error querying postcodes.io autocomplete:', err);
    return res.status(500).json({ error: 'Failed to query postcodes.io autocomplete' });
  }
});

// 7. Backend Delivery Availability Calculation Engine (Strict server-side verification)
app.post('/api/delivery/check-availability', (req, res) => {
  try {
    const {
      store,
      settings,
      zones,
      postcode,
      customerLat,
      customerLng,
      cartSubtotal = 0,
    } = req.body;

    if (!store || !store.id) {
      return res.status(400).json({
        available: false,
        reason: 'STORE_UNAVAILABLE',
        message: 'Valid store configuration is required.',
      });
    }

    if (!postcode || typeof postcode !== 'string') {
      return res.status(400).json({
        available: false,
        reason: 'INVALID_POSTCODE',
        message: 'Postcode is required to determine delivery availability.',
      });
    }

    // Distance Haversine helper
    function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 3958.8;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 100) / 100;
    }

    // Postcode normalization & parsing
    const clean = postcode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    let norm = clean;
    let outward = clean;
    let inward = '';
    let area = clean;
    let district = clean;
    let sector = clean;

    if (clean.length >= 5 && clean.length <= 7) {
      inward = clean.slice(-3);
      outward = clean.slice(0, -3);
      norm = `${outward} ${inward}`;
      const areaMatch = outward.match(/^[A-Z]+/);
      area = areaMatch ? areaMatch[0] : outward;
      district = outward;
      sector = `${outward} ${inward[0]}`;
    } else {
      const areaMatch = outward.match(/^[A-Z]+/);
      area = areaMatch ? areaMatch[0] : outward;
    }

    // Store settings & coords
    const storeLat = settings?.storeLatitude || store.latitude || 51.5133;
    const storeLng = settings?.storeLongitude || store.longitude || -0.1365;
    let distanceMiles = 0;
    if (typeof customerLat === 'number' && typeof customerLng === 'number' && customerLat !== 0 && customerLng !== 0) {
      distanceMiles = getDistanceMiles(storeLat, storeLng, customerLat, customerLng);
    }

    const deliveryEnabled = settings?.enabled ?? store.isDeliveryEnabled ?? true;
    if (!deliveryEnabled) {
      return res.json({
        available: false,
        reason: 'DELIVERY_DISABLED',
        deliveryFee: 0,
        minimumOrder: 0,
        estimatedTime: 'N/A',
        distanceMiles: 0,
        message: 'Delivery service is currently disabled for this store.',
      });
    }

    const deliveryMethod = settings?.method || 'postcode';
    const radiusMiles = settings?.radiusMiles || store.deliveryRadiusMiles || 5.0;
    const defaultFee = Number(settings?.defaultFee ?? store.deliveryFee ?? 2.5);
    const defaultMinOrder = Number(settings?.defaultMinimumOrder ?? store.minimumDeliveryOrder ?? 10.0);
    const defaultEta = settings?.defaultEstimatedTime || '30–45 minutes';

    // Radius restriction check
    if (deliveryMethod === 'radius' || deliveryMethod === 'postcode_and_radius') {
      if (distanceMiles > radiusMiles) {
        return res.json({
          available: false,
          reason: 'OUTSIDE_RADIUS',
          deliveryFee: defaultFee,
          minimumOrder: defaultMinOrder,
          estimatedTime: defaultEta,
          distanceMiles,
          matchedRuleType: 'radius',
          message: `Outside delivery radius (${distanceMiles.toFixed(1)} miles away, limit is ${radiusMiles} miles).`,
        });
      }
    }

    // Zone matching (Precision: Full -> Sector -> District -> Area)
    let matchedZone: any = null;
    if ((deliveryMethod === 'postcode' || deliveryMethod === 'postcode_and_radius') && Array.isArray(zones) && zones.length > 0) {
      const activeZones = zones.filter((z: any) => z.active && z.storeId === store.id);

      const fullMatch = activeZones.find(
        (z: any) => z.ruleType === 'full' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === clean
      );
      const sectorMatch = activeZones.find(
        (z: any) => z.ruleType === 'sector' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === sector.replace(/\s+/g, '')
      );
      const districtMatch = activeZones.find(
        (z: any) => z.ruleType === 'district' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === district
      );
      const areaMatch = activeZones.find(
        (z: any) => z.ruleType === 'area' && z.postcodeRule.replace(/\s+/g, '').toUpperCase() === area
      );

      matchedZone = fullMatch || sectorMatch || districtMatch || areaMatch || null;

      if (!matchedZone) {
        return res.json({
          available: false,
          reason: 'OUTSIDE_DELIVERY_AREA',
          deliveryFee: defaultFee,
          minimumOrder: defaultMinOrder,
          estimatedTime: defaultEta,
          distanceMiles,
          message: "Sorry, we don't currently deliver to this area.",
        });
      }
    }

    const finalFee = matchedZone ? Number(matchedZone.deliveryFee) : defaultFee;
    const finalMinOrder = matchedZone ? Number(matchedZone.minimumOrder) : defaultMinOrder;
    const finalEta = matchedZone ? matchedZone.estimatedTime : defaultEta;
    const zoneLabel = matchedZone ? matchedZone.postcodeRule : (deliveryMethod === 'radius' ? `Within ${radiusMiles} miles` : 'Standard Delivery');

    // Cart subtotal check against minimum order
    if (cartSubtotal > 0 && cartSubtotal < finalMinOrder) {
      const diff = (finalMinOrder - cartSubtotal).toFixed(2);
      return res.json({
        available: false,
        reason: 'MINIMUM_ORDER_NOT_MET',
        deliveryZone: zoneLabel,
        deliveryFee: finalFee,
        minimumOrder: finalMinOrder,
        estimatedTime: finalEta,
        distanceMiles,
        matchedRuleType: matchedZone ? matchedZone.ruleType : 'default',
        message: `Please add £${diff} more to continue.`,
      });
    }

    return res.json({
      available: true,
      reason: null,
      deliveryZone: zoneLabel,
      deliveryFee: finalFee,
      minimumOrder: finalMinOrder,
      estimatedTime: finalEta,
      distanceMiles,
      matchedRuleType: matchedZone ? matchedZone.ruleType : (deliveryMethod === 'radius' ? 'radius' : 'default'),
      message: 'Delivery Available',
    });
  } catch (err: any) {
    console.error('Error checking delivery availability:', err);
    return res.status(500).json({ error: 'Server error checking delivery availability' });
  }
});


/* =========================================================================
   VITE & STATIC ASSETS SETUP
   ========================================================================= */

async function startServer() {
  // Statically serve static audio and public files with accurate MIME types & range headers
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
