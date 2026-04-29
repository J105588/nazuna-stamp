import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Security Strategy:
 * - Full AES encryption prevents tampering and reading of data in transit.
 * - To bypass QR scanner corruption of Base64 symbols (+, /, =), 
 *   the encrypted Base64 string is converted to a pure Hex string.
 * - This guarantees 100% safe physical-layer transmission.
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
 * Convert string to Hex
 */
const stringToHex = (str) => {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert Hex back to string
 */
const hexToString = (hex) => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
};

/**
 * Encode: JSON -> AES (Base64) -> Hex
 */
export const encodeSyncData = (data, prefix) => {
  try {
    if (!SECRET_KEY) return '';
    
    const compact = compactify(data);
    const jsonString = JSON.stringify(compact);
    
    // AES Encryption (outputs Base64)
    const encryptedBase64 = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    
    // Convert to Hex for QR safety
    const safeHex = stringToHex(encryptedBase64);
    
    return `${prefix}${safeHex}`;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Decode: Hex -> AES (Base64) -> JSON
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) return null;
    if (!SECRET_KEY) {
      console.error("Sync Error: SECRET_KEY is not defined.");
      return null;
    }

    const safeHex = payload.substring(prefix.length);
    
    // Restore Base64 from Hex
    const encryptedBase64 = hexToString(safeHex);

    // Decrypt AES
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedBase64, SECRET_KEY);
    const jsonString = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (!jsonString) {
      console.error("Sync Error: Decryption failed. Keys might not match between devices.");
      return null;
    }

    const compact = JSON.parse(jsonString);
    const data = decompactify(compact);

    if (!Array.isArray(data.stamps)) return null;

    return data;
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
