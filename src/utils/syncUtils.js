import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

/**
 * Payload prefixes for QR communication
 */
export const SYNC_PREFIX = {
  USER_DATA: 'ns-req:', // User -> Staff
  STAFF_DATA: 'ns-res:' // Staff -> User
};

/**
 * Encodes data into a sync string
 * @param {object} data 
 * @param {string} prefix 
 * @returns {string}
 */
export const encodeSyncData = (data, prefix) => {
  try {
    const stringValue = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
    return `${prefix}${encrypted}`;
  } catch (error) {
    console.error('Error encoding sync data:', error);
    return '';
  }
};

/**
 * Decodes a sync string back to data
 * @param {string} payload 
 * @param {string} prefix 
 * @returns {object|null}
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload.startsWith(prefix)) return null;
    
    const encrypted = payload.substring(prefix.length);
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decoding sync data:', error);
    return null;
  }
};
