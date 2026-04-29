import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

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
 */
export const encodeSyncData = (data, prefix) => {
  try {
    if (!SECRET_KEY) return '';

    const compact = compactify(data);
    const json = JSON.stringify(compact);

    // AES encrypt
    const base64Encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();

    // Base64 -> Hex for QR safety
    const wordArray = CryptoJS.enc.Base64.parse(base64Encrypted);
    const hex = CryptoJS.enc.Hex.stringify(wordArray);

    // === SELF-TEST: immediately verify we can decode what we just encoded ===
    const testWordArray = CryptoJS.enc.Hex.parse(hex);
    const testBase64 = CryptoJS.enc.Base64.stringify(testWordArray);
    const testDecrypted = CryptoJS.AES.decrypt(testBase64, SECRET_KEY);
    const testJson = testDecrypted.toString(CryptoJS.enc.Utf8);
    
    if (testJson === json) {
      console.log('✅ Sync self-test PASSED. Roundtrip OK.');
    } else {
      console.error('❌ Sync self-test FAILED!');
      console.error('  Original JSON:', json);
      console.error('  Roundtrip JSON:', testJson);
      console.error('  Base64 original:', base64Encrypted);
      console.error('  Base64 after hex roundtrip:', testBase64);
    }

    const fullPayload = `${prefix}${hex}`;
    console.log(`Encoded payload length: ${fullPayload.length} chars`);
    console.log(`Full payload: ${fullPayload}`);

    return fullPayload;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Decodes an encrypted sync string back to data.
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload || !payload.startsWith(prefix)) return null;
    if (!SECRET_KEY) return null;

    const hex = payload.substring(prefix.length);
    
    console.log(`Decode: received hex length: ${hex.length}`);
    console.log(`Decode: full payload: ${payload}`);

    // Hex -> Base64
    const wordArray = CryptoJS.enc.Hex.parse(hex);
    const base64Encrypted = CryptoJS.enc.Base64.stringify(wordArray);
    
    console.log(`Decode: reconstructed Base64: ${base64Encrypted}`);

    // AES decrypt
    const decrypted = CryptoJS.AES.decrypt(base64Encrypted, SECRET_KEY);
    const json = decrypted.toString(CryptoJS.enc.Utf8);

    if (!json) {
      console.error('Sync: Decryption produced empty result');
      console.error('  Key len:', SECRET_KEY.length, 'starts with:', SECRET_KEY[0]);
      return null;
    }

    return decompactify(JSON.parse(json));
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
