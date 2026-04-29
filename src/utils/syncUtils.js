import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Uses the same AES encryption as storage.js, but converts the output
 * to hex encoding (0-9, a-f only) for reliable QR code transmission.
 * Standard Base64 characters (+, /, =) are known to be corrupted
 * by some QR code scanners, causing decryption failures.
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
 * Encodes data into an encrypted, QR-safe sync string.
 * Flow: JSON -> AES encrypt -> Base64 -> Hex (QR-safe)
 */
export const encodeSyncData = (data, prefix) => {
  try {
    if (!SECRET_KEY) {
      console.error('Sync: SECRET_KEY is not defined');
      return '';
    }

    const compact = compactify(data);
    const json = JSON.stringify(compact);

    // AES encrypt (produces Base64 OpenSSL format)
    const base64Encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();

    // Convert Base64 to Hex for QR safety
    const wordArray = CryptoJS.enc.Base64.parse(base64Encrypted);
    const hex = CryptoJS.enc.Hex.stringify(wordArray);

    return `${prefix}${hex}`;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Decodes an encrypted sync string back to data.
 * Flow: Hex -> Base64 -> AES decrypt -> JSON
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) return null;
    if (!SECRET_KEY) {
      console.error('Sync: SECRET_KEY is missing');
      return null;
    }

    const hex = payload.substring(prefix.length);

    // Convert Hex back to Base64 (OpenSSL format)
    const wordArray = CryptoJS.enc.Hex.parse(hex);
    const base64Encrypted = CryptoJS.enc.Base64.stringify(wordArray);

    // AES decrypt
    const decrypted = CryptoJS.AES.decrypt(base64Encrypted, SECRET_KEY);
    const json = decrypted.toString(CryptoJS.enc.Utf8);

    if (!json) {
      console.error('Sync: Decryption failed (empty result)');
      return null;
    }

    const compact = JSON.parse(json);
    return decompactify(compact);
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
