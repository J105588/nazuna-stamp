import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Design:
 *   - Base64 encoding for reliable QR transmission (AES corrupts through QR scanners)
 *   - HMAC-SHA256 signature using the same secret key as storage.js
 *     to prevent data tampering while keeping QR payloads scannable
 *   - localStorage remains AES-encrypted via storage.js (at-rest security)
 *   - QR data is ephemeral (screen-to-camera), so full encryption is unnecessary
 */

export const SYNC_PREFIX = {
  USER_DATA: 'nzs1:',
  STAFF_DATA: 'nzs2:'
};

const compactify = (data) => ({
  s: data.stamps || [],
  e: !!data.isExchanged,
  d: !!data.isDismissed,
  n: data.nonce || ''
});

const decompactify = (compact) => ({
  stamps: compact.s || [],
  isExchanged: !!compact.e,
  isDismissed: !!compact.d,
  nonce: compact.n || ''
});

/**
 * Generate HMAC-SHA256 signature (first 8 hex chars for compactness)
 */
const sign = (json) => {
  if (!SECRET_KEY) return '00000000';
  return CryptoJS.HmacSHA256(json, SECRET_KEY).toString().substring(0, 8);
};

/**
 * Encodes data into a signed, QR-safe sync string.
 * Format: prefix + signature(8 hex chars) + "." + base64(json)
 */
export const encodeSyncData = (data, prefix) => {
  try {
    const compact = compactify(data);
    const json = JSON.stringify(compact);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const sig = sign(json);
    return `${prefix}${sig}.${b64}`;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Decodes a signed sync string back to data.
 * Verifies HMAC signature to prevent tampering.
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) return null;

    const body = payload.substring(prefix.length);
    const dotIndex = body.indexOf('.');
    if (dotIndex === -1) return null;

    const sig = body.substring(0, dotIndex);
    const b64 = body.substring(dotIndex + 1);

    const json = decodeURIComponent(escape(atob(b64)));

    // Verify signature
    const expectedSig = sign(json);
    if (sig !== expectedSig) {
      console.error('Sync: Signature mismatch - data may be tampered or key differs');
      return null;
    }

    const compact = JSON.parse(json);
    const data = decompactify(compact);

    if (!Array.isArray(data.stamps)) return null;

    return data;
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
