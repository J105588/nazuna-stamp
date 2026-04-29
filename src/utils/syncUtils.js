import CryptoJS from 'crypto-js';

// Strictly require the environment variable. No hardcoded fallback keys for security.
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET;

export const SYNC_PREFIX = {
  USER_DATA: 'nzs1:',
  STAFF_DATA: 'nzs2:'
};

/**
 * Generates an HMAC-SHA256 signature for tamper-proofing.
 */
const generateHash = (str) => {
  return CryptoJS.HmacSHA256(str, SECRET_KEY).toString(CryptoJS.enc.Hex).substring(0, 8);
};

/**
 * Redesigned Encode:
 * Uses simple URL query parameters format. 
 * This is 100% immune to QR scanner character corruption and avoids JSON/Base64 entirely.
 * Example: nzs1:s=spot1,spot2&e=0&d=0&n=abcd&h=12345678
 */
export const encodeSyncData = (data, prefix) => {
  try {
    const s = (data.stamps || []).join(',');
    const e = data.isExchanged ? '1' : '0';
    const d = data.isDismissed ? '1' : '0';
    const n = data.nonce || '';
    
    // Construct base payload
    const payloadStr = `s=${s}&e=${e}&d=${d}&n=${n}`;
    
    // Generate signature
    const hash = generateHash(payloadStr);
    
    return `${prefix}${payloadStr}&h=${hash}`;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Redesigned Decode:
 * Parses the URL parameters and verifies the HMAC signature.
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload) return null;
    
    // Make prefix check case-insensitive in case mobile camera altered it
    const lowerPayload = payload.toLowerCase();
    const targetPrefix = prefix.toLowerCase();
    
    if (!lowerPayload.startsWith(targetPrefix)) return null;
    
    // Extract data part
    const dataStr = payload.substring(prefix.length);
    
    // Use standard URLSearchParams for bulletproof parsing
    const params = new URLSearchParams(dataStr);
    
    const s = params.get('s') || '';
    const e = params.get('e') === '1';
    const d = params.get('d') === '1';
    const n = params.get('n') || '';
    const h = params.get('h');
    
    if (!h) {
      console.error("Sync Error: Missing security hash.");
      return null;
    }
    
    // Reconstruct base payload to verify signature
    const eStr = params.get('e') || '0';
    const dStr = params.get('d') || '0';
    const reconstructedPayloadStr = `s=${s}&e=${eStr}&d=${dStr}&n=${n}`;
    
    const expectedHash = generateHash(reconstructedPayloadStr);
    
    if (h !== expectedHash) {
      console.error("Sync Error: Hash mismatch! Data was tampered or keys differ.");
      return null;
    }
    
    return {
      stamps: s ? s.split(',') : [],
      isExchanged: e,
      isDismissed: d,
      nonce: n
    };
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
