import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Integrated with the same AES encryption as storage.js
 * while maintaining data compaction to ensure QR reliability.
 */

/**
 * Payload prefixes for QR communication
 */
export const SYNC_PREFIX = {
  USER_DATA: 'nzs1:', // User -> Staff (v1 encrypted)
  STAFF_DATA: 'nzs2:' // Staff -> User (v1 encrypted)
};

/**
 * Compact encode: strips redundant keys to minimize encrypted data size.
 */
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
 * Encodes data into an encrypted sync string for QR
 */
export const encodeSyncData = (data, prefix) => {
  try {
    if (!SECRET_KEY) throw new Error('Missing Secret Key');
    
    const compact = compactify(data);
    const json = JSON.stringify(compact);
    const encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();
    return `${prefix}${encrypted}`;
  } catch (error) {
    console.error('Error encoding sync data:', error);
    return '';
  }
};

/**
 * Decodes an encrypted sync string back to data
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) return null;
    if (!SECRET_KEY) return null;
    
    const encrypted = payload.substring(prefix.length);
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return null;

    const compact = JSON.parse(decrypted);
    return decompactify(compact);
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
