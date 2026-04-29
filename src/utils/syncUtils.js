/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Uses compact Base64 encoding (NOT encryption) for QR payloads.
 * QR codes are ephemeral screen-to-screen transfers, 
 * so AES encryption is unnecessary and causes read failures.
 * The localStorage remains encrypted via storage.js.
 */

/**
 * Payload prefixes for QR communication
 */
export const SYNC_PREFIX = {
  USER_DATA: 'nzs1:', // User -> Staff (v1 format)
  STAFF_DATA: 'nzs2:' // Staff -> User (v1 format)
};

/**
 * Compact encode: strips redundant keys to minimize QR data size.
 * Input:  { stamps: ["spot-1","spot-3"], isExchanged: true, isDismissed: false }
 * Output: { s: ["spot-1","spot-3"], e: true, d: false }
 */
const compactify = (data) => ({
  s: data.stamps || [],
  e: !!data.isExchanged,
  d: !!data.isDismissed,
  n: data.nonce || '' // One-time session ID
});

const decompactify = (compact) => ({
  stamps: compact.s || [],
  isExchanged: !!compact.e,
  isDismissed: !!compact.d,
  nonce: compact.n || ''
});

/**
 * Encodes data into a sync string for QR display
 * @param {object} data - { stamps, isExchanged, isDismissed }
 * @param {string} prefix - SYNC_PREFIX.USER_DATA or SYNC_PREFIX.STAFF_DATA
 * @returns {string}
 */
export const encodeSyncData = (data, prefix) => {
  try {
    const compact = compactify(data);
    const json = JSON.stringify(compact);
    // Use URL-safe Base64 to avoid QR encoding issues
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `${prefix}${base64}`;
  } catch (error) {
    console.error('Error encoding sync data:', error);
    return '';
  }
};

/**
 * Decodes a sync string back to data
 * @param {string} payload - Full QR string including prefix
 * @param {string} prefix - Expected prefix
 * @returns {object|null} - { stamps, isExchanged, isDismissed } or null on failure
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) {
      console.error('Sync: prefix mismatch');
      return null;
    }
    
    const base64 = payload.substring(prefix.length);
    if (!base64) {
      console.error('Sync: empty payload after prefix');
      return null;
    }

    const json = decodeURIComponent(escape(atob(base64)));
    const compact = JSON.parse(json);
    const data = decompactify(compact);
    
    // Validate structure
    if (!Array.isArray(data.stamps)) {
      console.error('Sync: invalid data structure');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
