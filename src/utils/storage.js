import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

if (!SECRET_KEY) {
  console.warn('Warning: VITE_STORAGE_SECRET is not defined. Data encryption will be insecure.');
}

/**
 * Utility for encrypted localStorage access
 */
export const storage = {
  /**
   * Save data to localStorage with encryption
   * @param {string} key 
   * @param {any} value 
   */
  save: (key, value) => {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Error saving to storage [${key}]:`, error);
    }
  },

  /**
   * Load and decrypt data from localStorage
   * @param {string} key 
   * @returns {any|null}
   */
  load: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) return null;
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Error loading from storage [${key}]:`, error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key 
   */
  remove: (key) => {
    localStorage.removeItem(key);
  }
};
